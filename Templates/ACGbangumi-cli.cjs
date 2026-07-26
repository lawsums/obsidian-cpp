#!/usr/bin/env node
// =============================================================================
// ACGbangumi-cli.cjs  —  命令行版 Bangumi 番剧/漫画/游戏 导入脚本
// -----------------------------------------------------------------------------
// 由 Obsidian QuickAdd 版 Templates/ACGbangumiv2.1.js (by 月涟Luvian) 改写。
// 去除对 Obsidian (Notice / request / DOMParser) 与 QuickAdd (quickAddApi) 的依赖，
// 改为纯命令行调用，方便大模型 / 脚本自动化调用并生成 Project 笔记。
//
// 依赖：linkedom（用于解析 bgm.tv 的 HTML）。脚本会自动尝试多个路径加载它。
//   一次性安装（任选其一）：
//     npm install linkedom                       # 装到脚本可解析的位置
//     # 或装到本机 workbuddy 托管 node 工作区（脚本默认回退路径之一）：
//     cd C:\Users\Administrator\.workbuddy\binaries\node\workspace && npm install linkedom
//
// 网络：HTTP 层为零依赖实现（Node 内置 http/https/tls/zlib），自动读取系统代理环境变量
//   HTTP_PROXY / HTTPS_PROXY / NO_PROXY；也可用 --proxy <url> 或环境变量 BGM_PROXY 显式指定。
//
// 用法示例：
//   1) 搜索（返回 JSON 结果，供大模型选择）：
//      node ACGbangumi-cli.cjs search --name "GIRLS BAND CRY" --type anime --json
//
//   2) 直接按详情页 URL 生成笔记（最稳，推荐大模型先 search 再 add --url）：
//      node ACGbangumi-cli.cjs add --url https://bgm.tv/subject/431767 --type anime --score 10.0
//
//   3) 按名称搜索并自动取第一条匹配生成笔记：
//      node ACGbangumi-cli.cjs add --name "进击的巨人" --type anime --score 9.0 --state 在看📖
//
//   4) 预览（不写文件）：
//      node ACGbangumi-cli.cjs add --url https://bgm.tv/subject/431767 --type anime --dry-run
//
// 可选 cookie：导出环境变量 BGM_COOKIE="chii_auth=...; chii_sid=..." 以访问需登录内容。
// =============================================================================

'use strict';

const path = require('path');
const fs = require('fs');

// -----------------------------------------------------------------------------
// 加载 linkedom（多路径回退，保证大模型在不同 cwd / node 下都能跑）
// -----------------------------------------------------------------------------
function loadLinkedom() {
    const candidates = [
        () => require('linkedom'),
        () => require(path.join(
            process.env.USERPROFILE || process.env.HOME || '',
            '.workbuddy', 'binaries', 'node', 'workspace', 'node_modules', 'linkedom'
        )),
        () => require(path.join(__dirname, 'node_modules', 'linkedom')),
    ];
    for (const load of candidates) {
        try { return load(); } catch (_) { /* try next */ }
    }
    console.error('[ERROR] 无法加载 linkedom 模块。请执行: npm install linkedom');
    console.error('        或装到: %USERPROFILE%\\.workbuddy\\binaries\\node\\workspace');
    process.exit(2);
}
const { parseHTML } = loadLinkedom();

// -----------------------------------------------------------------------------
// 常量 / 配置
// -----------------------------------------------------------------------------
const USER_COOKIE = process.env.BGM_COOKIE || '';

const COMMON_HEADERS = {
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.100.4758.11 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'script',
    'Referer': 'https://bgm.tv/',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
};
if (USER_COOKIE) COMMON_HEADERS['Cookie'] = USER_COOKIE;

// CLI 下 Notice 等价于 stderr 输出
const notice = (msg) => process.stderr.write(`[notice] ${msg}\n`);
const log = (msg) => process.stderr.write(`[log] ${msg}\n`);

// =============================================================================
// 通用工具函数（与原脚本同名同语义，仅替换底层实现）
// =============================================================================

/**
 * 通用 HTTP GET 请求（Obsidian request -> 零依赖 httpGet，支持 HTTP/HTTPS 代理）
 * 用 Node 内置 http/https/tls/zlib 实现，自动读取 HTTP_PROXY/HTTPS_PROXY/NO_PROXY 环境变量。
 * 这样大模型在本机代理环境下也能直接调用，无需额外安装网络依赖。
 * @param {string} url
 * @param {object} [customHeaders]
 * @returns {Promise<string|null>}
 */
async function requestGet(url, customHeaders = COMMON_HEADERS) {
    try {
        const finalURL = new URL(url);
        // 45s 安全超时，避免网络/代理问题导致永久挂起
        const res = await Promise.race([
            httpGet(finalURL.href, customHeaders),
            new Promise((_, rej) => setTimeout(() => rej(new Error('请求超时(45s)')), 45000)),
        ]);
        if (!res || res.status < 200 || res.status >= 400) {
            log(`请求失败: HTTP ${res ? res.status : '未知'} (${finalURL.href})`);
            return null;
        }
        return res.body;
    } catch (err) {
        log(`请求失败: ${err.message}`);
        notice(`请求失败: ${err.message}`);
        return null;
    }
}

// ---- 零依赖 HTTP 客户端（支持代理 CONNECT / gzip/br/deflate / 重定向） ----
const _http = require('http');
const _https = require('https');
const _tls = require('tls');
const _zlib = require('zlib');
const _net = require('net');

// 可通过 --proxy 或环境变量 BGM_PROXY 显式指定代理（兜底，防止 Obsidian 进程未继承系统代理变量）
let PROXY_OVERRIDE = process.env.BGM_PROXY || '';

function _matchNoProxy(np, host) {
    if (!np) return false;
    if (np === '*') return true;
    if (np.includes('*')) {
        const re = new RegExp('^' + np.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return re.test(host);
    }
    return host === np || host.endsWith('.' + np);
}
function _getProxyFor(u) {
    const noProxy = (process.env.NO_PROXY || process.env.no_proxy || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    for (const np of noProxy) if (_matchNoProxy(np, u.hostname)) return null;
    if (PROXY_OVERRIDE) return PROXY_OVERRIDE;
    if (u.protocol === 'https:') {
        return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
    }
    return process.env.HTTP_PROXY || process.env.http_proxy || null;
}
function _lowerHeaders(h) { const o = {}; for (const k in h) o[k.toLowerCase()] = h[k]; return o; }
function _dechunk(buf) {
    const out = []; let pos = 0;
    while (pos < buf.length) {
        const le = buf.indexOf('\r\n', pos); if (le === -1) break;
        const size = parseInt(buf.slice(pos, le).toString('latin1').trim().split(';')[0], 16);
        if (isNaN(size) || size === 0) break;
        pos = le + 2; out.push(buf.slice(pos, pos + size)); pos += size + 2;
    }
    return Buffer.concat(out);
}
function _decompress(buf, enc) {
    try {
        if (enc.includes('br')) return _zlib.brotliDecompressSync(buf);
        if (enc.includes('gzip')) return _zlib.gunzipSync(buf);
        if (enc.includes('deflate')) return _zlib.inflateSync(buf);
    } catch (_) { /* leave as-is */ }
    return buf;
}
/**
 * 零依赖 HTTP GET
 * @param {string} urlStr
 * @param {object} [headers]
 * @param {number} [maxRedirects=5]
 * @returns {Promise<{status:number, headers:object, body:string}>}
 */
function httpGet(urlStr, headers, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const proxy = _getProxyFor(u);
        const isHttps = u.protocol === 'https:';
        const hdr = Object.assign({
            Host: u.host,
            'Accept-Encoding': 'gzip, deflate, br',
        }, headers || {});
        // 强制 close：本实现依靠连接关闭来判定响应体结束（避免 keep-alive 导致挂起）
        hdr['Connection'] = 'close';

        const finish = (status, rh, bodyBuf) => {
            let p = bodyBuf;
            if ((rh['transfer-encoding'] || '').toLowerCase().includes('chunked')) p = _dechunk(p);
            p = _decompress(p, (rh['content-encoding'] || '').toLowerCase());
            if (status >= 300 && status < 400 && rh['location'] && maxRedirects > 0) {
                return resolve(httpGet(new URL(rh['location'], u).href, headers, maxRedirects - 1));
            }
            resolve({ status, headers: rh, body: p.toString('utf8') });
        };

        if (!proxy) {
            // 直连
            const lib = isHttps ? _https : _http;
            const req = lib.request({
                host: u.hostname,
                port: u.port || (isHttps ? 443 : 80),
                path: u.pathname + u.search,
                method: 'GET',
                headers: hdr,
            }, (res) => {
                const ch = [];
                res.on('data', (c) => ch.push(c));
                res.on('end', () => finish(res.statusCode, _lowerHeaders(res.headers), Buffer.concat(ch)));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.end();
            return;
        }

        // 走代理
        const pu = new URL(proxy);
        const ps = _net.connect({ host: pu.hostname, port: pu.port || 80 }, () => {
            if (isHttps) {
                // CONNECT 隧道
                ps.write(`CONNECT ${u.hostname}:${u.port || 443} HTTP/1.1\r\nHost: ${u.hostname}:${u.port || 443}\r\n\r\n`);
                let b = Buffer.alloc(0);
                const onData = (c) => {
                    b = Buffer.concat([b, c]);
                    const i = b.indexOf('\r\n\r\n');
                    if (i !== -1) {
                        ps.removeListener('data', onData);
                        const resp = b.slice(0, i).toString('latin1');
                        if (!/^HTTP\/1\.[01]\s+200/.test(resp)) {
                            ps.destroy();
                            return reject(new Error('代理 CONNECT 失败: ' + resp.split('\r\n')[0]));
                        }
                        const ts = _tls.connect({ socket: ps, servername: u.hostname }, () => {
                            let reqLine = `GET ${u.pathname + u.search || '/'} HTTP/1.1\r\n`;
                            for (const k of Object.keys(hdr)) reqLine += `${k}: ${hdr[k]}\r\n`;
                            reqLine += '\r\n';
                            ts.write(reqLine);
                            const ch = [];
                            ts.on('data', (x) => ch.push(x));
                            ts.on('end', () => {
                                const buf = Buffer.concat(ch);
                                const he = buf.indexOf('\r\n\r\n');
                                if (he === -1) return reject(new Error('malformed response'));
                                const hs = buf.slice(0, he).toString('latin1').split('\r\n');
                                const sm = /^HTTP\/1\.[01]\s+(\d+)/.exec(hs[0]);
                                const status = sm ? parseInt(sm[1], 10) : 0;
                                const rh = {};
                                for (let k = 1; k < hs.length; k++) {
                                    const idx = hs[k].indexOf(':');
                                    if (idx > -1) rh[hs[k].slice(0, idx).trim().toLowerCase()] = hs[k].slice(idx + 1).trim();
                                }
                                finish(status, rh, buf.slice(he + 4));
                            });
                            ts.on('error', reject);
                        });
                    }
                };
                ps.on('data', onData);
                ps.on('error', reject);
            } else {
                // http over proxy: 绝对 URI
                let reqLine = `GET ${u.href} HTTP/1.1\r\n`;
                for (const k of Object.keys(hdr)) reqLine += `${k}: ${hdr[k]}\r\n`;
                reqLine += '\r\n';
                ps.write(reqLine);
                const ch = [];
                ps.on('data', (x) => ch.push(x));
                ps.on('end', () => {
                    const buf = Buffer.concat(ch);
                    const he = buf.indexOf('\r\n\r\n');
                    if (he === -1) return reject(new Error('malformed response'));
                    const hs = buf.slice(0, he).toString('latin1').split('\r\n');
                    const sm = /^HTTP\/1\.[01]\s+(\d+)/.exec(hs[0]);
                    const status = sm ? parseInt(sm[1], 10) : 0;
                    const rh = {};
                    for (let k = 1; k < hs.length; k++) {
                        const idx = hs[k].indexOf(':');
                        if (idx > -1) rh[hs[k].slice(0, idx).trim().toLowerCase()] = hs[k].slice(idx + 1).trim();
                    }
                    finish(status, rh, buf.slice(he + 4));
                });
                ps.on('error', reject);
            }
        });
        ps.on('error', reject);
    });
}

/**
 * 解析 HTML 字符串为 document 对象（DOMParser -> linkedom）
 * @param {string} html
 * @returns {Document}
 */
function parseHtmlToDom(html) {
    if (!html || typeof html !== 'string') {
        log('无效的HTML字符串，无法解析DOM');
        return parseHTML('<html></html>').document;
    }
    return parseHTML(html).document;
}

/**
 * 提取作品基础信息（与原脚本 extractBaseInfo 一致）
 * 注：linkedom 无 .innerText / .href IDL，故用 textContent / getAttribute 替代。
 */
function extractBaseInfo(doc, type) {
    const $ = (s) => doc.querySelector(s);
    const workinginfo = {};

    // 名称解析
    const workingname = $('meta[name="keywords"]')?.getAttribute('content') || '';
    const regex = /[\*"\\\/<>:\|?]/g;
    const nameArr = workingname.split(',');
    workinginfo.CN = (nameArr[0]?.replace(regex, ' ') || ' ').trim() || ' ';
    workinginfo.JP = (nameArr[1]?.replace(regex, ' ') || ' ').trim() || ' ';
    workinginfo.fileName = `${workinginfo.CN}_${workinginfo.JP}`.trim() || '未知作品';

    // 类型与评分
    workinginfo.type = ($('small.grey')?.textContent || ' ').trim() || ' ';
    workinginfo.rating = ($('span[property="v:average"]')?.textContent || '未知').trim() || '未知';

    // 封面图片（原脚本用 .href，这里用 getAttribute 并自行归一化 URL）
    const regPoster = $('div[align="center"] > a')?.getAttribute('href') || '';
    let Poster = String(regPoster).replace('app://', 'http://').trim();
    if (Poster) {
        if (Poster.startsWith('http')) {
            workinginfo.Poster = Poster;
        } else if (Poster.startsWith('//')) {
            workinginfo.Poster = 'https:' + Poster;
        } else if (Poster.startsWith('/')) {
            workinginfo.Poster = 'https://bgm.tv' + Poster;
        } else {
            workinginfo.Poster = `https://${Poster.replace(/^https?:\/\//, '')}`;
        }
    } else {
        workinginfo.Poster = 'https://via.placeholder.com/300x450?text=无封面';
    }

    // 简介
    let summary = $('#subject_summary')?.textContent || '暂无简介';
    const nbspReg = /&nbsp;/gm;
    summary = summary.replace(nbspReg, '\n').trim();
    const multiSpaceReg = /\s{4,}/gm;
    summary = summary.replace(multiSpaceReg, '\n');
    const multiLineReg = /\n+/g;
    summary = summary.replace(multiLineReg, '\n');
    summary = summary || '暂无简介';
    workinginfo.summary = summary;

    // 标签（原脚本用 a:has(span)；linkedom 用 filter 等价实现）
    const TagBox = $('div.subject_tag_section > div.inner');
    workinginfo.tagsArray = TagBox
        ? (() => {
            const allTagLinks = Array.from(TagBox.querySelectorAll('a')).filter(a => a.querySelector('span'));
            const tagsWithNumber = allTagLinks.map(link => {
                const textSpan = link.querySelector('span');
                const tagText = textSpan ? textSpan.textContent.trim() : '';
                const numberSmall = link.querySelector('small.grey');
                const tagNumber = numberSmall
                    ? parseInt(numberSmall.textContent.trim(), 10) || 0
                    : 0;
                return { text: tagText, number: tagNumber };
            }).filter(tag => tag.text && tag.number > 0);
            const sortedTags = tagsWithNumber.sort((a, b) => b.number - a.number);
            return sortedTags.map(tag => tag.text);
        })()
        : [];

    workinginfo.tagsRecommendArray = TagBox
        ? (() => {
            const allMetaLinks = TagBox.querySelectorAll('a.l.meta');
            return Array.from(allMetaLinks).map(link => {
                const span = link.querySelector('span');
                return span ? span.textContent.trim() : '';
            }).filter(Boolean);
        })()
        : [];

    // 别名
    const infobox = doc.querySelectorAll('#infobox > li');
    const str = Array.from(infobox).map(li => li.textContent.trim()).join('\n');
    const regaliases = /别名:\s*(.*?)(?=\n|$)/gm;
    const aliasMatches = str.match(regaliases) || [];
    const alias = aliasMatches.map(match => match.replace(/^别名:\s*/, '').trim()).filter(Boolean);
    workinginfo.alias = alias.length > 0 ? alias.join(',') : '无';

    // 空值兜底
    for (const key in workinginfo) {
        if (!workinginfo[key] || workinginfo[key] === 'null' || workinginfo[key] === 'undefined') {
            workinginfo[key] = ' ';
        }
    }

    return workinginfo;
}

/**
 * 解析角色列表（与原脚本 parseCharacterList 一致）
 */
function parseCharacterList(doc, type) {
    const $ = (s) => doc.querySelector(s);
    const characterList = [];
    let CharacterBox, EachCharaNumber;
    CharacterBox = doc.querySelectorAll('#browserItemList > li.item');
    if (type === 'anime') {
        EachCharaNumber = 3;
    } else {
        EachCharaNumber = 2;
    }

    const regCharacterArray = Array.from(CharacterBox || []);
    regCharacterArray.forEach(item => {
        const row = [];
        const charaType = item.querySelector('span.badge_job_tip')?.textContent.trim() || '--';
        const charaCnName = item.querySelector('a.thumbTip')?.getAttribute('title')?.trim() || '暂无角色';
        const charaJpName = item.querySelector('p.title > a.title')?.textContent.trim() || '暂无日文名';
        const charaCV = item.querySelector('p.badge_actor > a')?.textContent.trim() || '暂无CV';

        const charaPhotoStyle = item.querySelector('span.avatarNeue')?.getAttribute('style') || '';
        const regCharacterPhoto = /background-image:\s*url\('([^']*)'\)/gi;
        const photoMatch = regCharacterPhoto.exec(charaPhotoStyle);
        const charaPhoto = photoMatch ? `https:${photoMatch[1].replace(/^https?:\/\//, '')}` : '';

        if (type === 'anime') {
            row.push(`${charaType}: ${charaCnName}<br>${charaJpName}`);
            row.push(`CV: ${charaCV}`);
            row.push(charaPhoto ? `![bookcover](${charaPhoto})` : '');
        } else {
            row.push(`${charaType}: ${charaCnName}<br>${charaJpName}`);
            row.push(charaPhoto ? `![bookcover](${charaPhoto})` : '');
        }
        characterList.push(...row);
    });

    const characterInfo = { characterList: characterList.join('\n') || ' ' };
    for (let i = 0; i < 9; i++) {
        const baseIndex = i * EachCharaNumber;
        characterInfo[`character${i + 1}`] = characterList[baseIndex] || ' ';
        if (type === 'anime') {
            characterInfo[`characterCV${i + 1}`] = characterList[baseIndex + 1] || ' ';
            characterInfo[`characterPhoto${i + 1}`] = characterList[baseIndex + 2] || ' ';
        } else {
            characterInfo[`characterPhoto${i + 1}`] = characterList[baseIndex + 1] || ' ';
        }
    }

    return characterInfo;
}

/**
 * 提取信息框文本并解析指定字段（与原脚本 extractInfoboxFields 一致）
 */
function extractInfoboxFields(doc, rules) {
    const infobox = doc.querySelectorAll('#infobox > li');
    const str = Array.from(infobox).map(li => li.textContent.trim()).join('\n');
    const result = {};

    for (const [key, reg] of Object.entries(rules)) {
        const match = reg.exec(str);
        result[key] = match ? match[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知';
        if (!result[key] || result[key] === 'null') result[key] = '未知';
    }

    return result;
}

// =============================================================================
// 搜索
// =============================================================================

let pageNum = 1;

/**
 * 搜索 Bangumi 作品（与原脚本 searchBangumi 一致）
 * @param {string} url
 * @returns {Promise<Array|null>}
 */
async function searchBangumi(url) {
    const res = await requestGet(url);
    if (!res) return null;

    const doc = parseHtmlToDom(res);
    const $ = (s) => doc.querySelector(s);
    const re = $('#browserItemList');
    if (!re) return null;

    const itemList = [{
        text: '❔ 没找到想要的作品 \n下一页',
        link: url.includes('&page=') ? url.replace(/&page=\d+/, `&page=${++pageNum}`) : `${url}&page=${++pageNum}`,
        type: 'none',
        typeId: 8,
    }];

    const result = re.querySelectorAll('.inner');
    for (const temp of Array.from(result)) {
        const spanElem = temp.querySelector('h3 span');
        if (!spanElem) continue;

        const value = spanElem.getAttribute('class') || '';
        const titleElem = temp.querySelector('h3 a');
        const infoElem = temp.querySelector('.info.tip');
        if (!titleElem || !infoElem) continue;

        let text, type, typeId;
        const title = titleElem.textContent.trim() || '未知作品';
        const info = infoElem.textContent.trim() || '无信息';

        if (value.includes('ico_subject_type subject_type_2')) {
            text = `🎞️ 《${title}》 \n${info}`;
            type = 'anime'; typeId = 2;
        } else if (value.includes('ico_subject_type subject_type_1')) {
            text = `📚 《${title}》 \n${info}`;
            type = 'book'; typeId = 1;
        } else if (value.includes('ico_subject_type subject_type_4')) {
            text = `🎮 《${title}》 \n${info}`;
            type = 'game'; typeId = 4;
        } else {
            continue;
        }

        const href = titleElem.getAttribute('href') || '';
        const link = href.startsWith('http') ? href : `https://bgm.tv${href.replace(/^\/+/, '/')}`;
        itemList.push({ text, link, type, typeId, title, info });
    }

    itemList.sort((a, b) => a.typeId - b.typeId);
    return itemList.length > 1 ? itemList : null;
}

// =============================================================================
// 作品详情解析
// =============================================================================

/**
 * 获取动画信息（与原脚本 getAnimeByurl 一致）
 */
async function getAnimeByurl(url) {
    const page = await requestGet(url);
    if (!page) {
        notice('No results found.');
        throw new Error('No results found.');
    }

    const doc = parseHtmlToDom(page);
    const $ = (s) => doc.querySelector(s);
    const $$ = (s) => doc.querySelectorAll(s);

    const Type = $('#headerSubject')?.getAttribute('typeof');
    const validAnimeTypes = ['v:Movie', 'v:Video'];
    if (!validAnimeTypes.includes(Type)) {
        notice('您输入的作品不是动画！');
        throw new Error('Not An Anime Information Input');
    }

    const workinginfo = extractBaseInfo(doc, 'anime');

    const infoboxRules = {
        episode: /话数:\s*(\d*)/g,
        website: /官方网站:\s*(.*?)(?=\n|$)/gm,
        director: /导演:\s*([^\n]*)/,
        staff: /脚本:\s*([^\n]*)/,
        AudioDirector: /音响监督:\s*([^\n]*)/,
        ArtDirector: /美术监督:\s*([^\n]*)/,
        AnimeChief: /总作画监督:\s*([^\n]*)/,
        MusicMake: /音乐制作:\s*([^\n]*)/,
        AnimeMake: /动画制作:\s*([^\n]*)/,
        from: /原作:\s*([^\n]*)/,
    };
    const infoboxFields = extractInfoboxFields(doc, infoboxRules);

    const str = Array.from($$('#infobox > li')).map(li => li.textContent.trim()).join('\n');
    const dateRegMap = {
        'TV': /放送开始:\s*([^\n]*)/,
        'OVA': /发售日:\s*([^\n]*)/,
        '剧场版': /上映年度:\s*([^\n]*)/,
        'OAD': /发售日:\s*([^\n]*)/,
    };
    const regstartdate = dateRegMap[workinginfo.type] || /放送开始:\s*([^\n]*)/;
    const startdateMatch = regstartdate.exec(str);
    const startdate = startdateMatch ? startdateMatch[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知';

    let season = '未知季度';
    let seasonYear;
    if (startdate && startdate.includes('年')) {
        const year = startdate.split('年')[0];
        const monthPart = startdate.split('年')[1];
        if (monthPart && monthPart.includes('月')) {
            const month = parseInt(monthPart.split('月')[0]);
            seasonYear = year;
            if (month === 12) {
                seasonYear = (parseInt(year) + 1).toString();
            }
            if ([12, 1, 2].includes(month)) {
                season = '01月新番';
            } else if ([3, 4, 5].includes(month)) {
                season = '04月新番';
            } else if ([6, 7, 8].includes(month)) {
                season = '07月新番';
            } else if ([9, 10, 11].includes(month)) {
                season = '10月新番';
            }
        }
    }

    // 章节列表解析（原脚本用 innerText，这里用 textContent 等价）
    const paragraphbox = $$('.prg_list li');
    const paraList = [];
    const opedList = [];
    let currentType = '';
    let TypeNum = 1;

    Array.from(paragraphbox).forEach(li => {
        const typeSpan = li.querySelector('span');
        if (typeSpan) {
            currentType = typeSpan.textContent.trim();
            TypeNum = 1;
            return;
        }

        const titleElem = li.querySelector('a');
        if (!titleElem) return;

        const titleAttr = titleElem.getAttribute('title') || '';
        const titleParts = titleAttr.split(' ').filter(Boolean);
        const episodeNum = titleParts[0]?.split('.')[1] || '';
        const jpTitle = titleParts.slice(1).join(' ') || '';

        const titleRel = titleElem.getAttribute('rel');
        const cnTitleElem = titleRel ? $(titleRel) : null;
        const cnTitleRaw = cnTitleElem?.textContent || '';
        const cnTitleMatch = cnTitleRaw.match(/中文标题:\s*([\s\S]*?)(?=首播:|$)/);
        const cnTitle = cnTitleMatch ? cnTitleMatch[1].trim() : '';

        if (currentType === '') {
            const fullTitle = `- [ ] 第${episodeNum}话 ${jpTitle} ${cnTitle}`.trim();
            paraList.push(fullTitle || `- [ ] 第${episodeNum}话 无标题`);
        } else {
            const fullTitle = `${currentType}-${episodeNum}: ${jpTitle}${cnTitle}`.trim();
            opedList.push(fullTitle || `${currentType}-${episodeNum}: 无标题`);
        }
    });

    const characterInfo = parseCharacterList(doc, 'anime');

    const finalInfo = {
        ...workinginfo,
        ...infoboxFields,
        date: startdate || ' ',
        year: startdate.split('年')[0] || ' ',
        month: startdate.split('年')[1]?.split('月')[0] || ' ',
        seasonYear: seasonYear,
        season: season,
        fromWho: infoboxFields.from.split('(')[0]?.split('・')[0]?.trim() || ' ',
        fromWhere: infoboxFields.from.split('（')[1]?.replace('）', '')?.trim() || ' ',
        paraList: paraList.join('\n') || ' 无章节信息',
        OpEd: opedList.join('\n') || ' 无OP/ED信息',
        ...characterInfo,
    };

    for (const key in finalInfo) {
        if (!finalInfo[key] || finalInfo[key] === 'null' || finalInfo[key] === 'undefined') {
            finalInfo[key] = ' ';
        }
    }
    return finalInfo;
}

/**
 * 获取漫画信息（与原脚本 getComicByurl 一致）
 */
async function getComicByurl(url) {
    const page = await requestGet(url);
    if (!page) {
        notice('No results found.');
        throw new Error('No results found.');
    }

    const doc = parseHtmlToDom(page);
    const $ = (s) => doc.querySelector(s);

    const Type = $('#headerSubject')?.getAttribute('typeof');
    if (Type !== 'v:Book') {
        notice('您输入的作品不是书籍！');
        throw new Error('Not A Book Information Input');
    }

    const workinginfo = extractBaseInfo(doc, 'book');

    const infobox = doc.querySelectorAll('#infobox > li');
    const str = Array.from(infobox).map(li => li.textContent.trim()).join('\n');

    const authorMatch = /作者:\s*([^\n]*)/.exec(str) || /原作:\s*([^\n]*)/.exec(str);
    const author = authorMatch ? authorMatch[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知';

    const staffMatch = /作画:\s*([^\n]*)/.exec(str);
    const staff = staffMatch ? staffMatch[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : (author !== '未知' ? author : '未知');

    const infoboxFields = {
        episode: /话数:\s*(\d*)/g.exec(str) ? /话数:\s*(\d*)/g.exec(str)[1].trim() : '0',
        author: author,
        staff: staff,
        Publish: /出版社:\s*([^\n]*)/.exec(str) ? /出版社:\s*([^\n]*)/.exec(str)[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知',
        Journal: /连载杂志:\s*([^\n]*)/.exec(str) ? /连载杂志:\s*([^\n]*)/.exec(str)[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知',
        ReleaseDate: /发售日:\s*([^\n]*)/.exec(str) ? /发售日:\s*([^\n]*)/.exec(str)[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知',
        Start: /开始:\s*([^\n]*)/.exec(str) ? /开始:\s*([^\n]*)/.exec(str)[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知',
    };

    const endMatch = /结束:\s*([^\n]*)/.exec(str);
    infoboxFields.End = endMatch ? endMatch[1].trim().replace(/\n|\r/g, '').replace(/\ +/g, '') : '未知';
    infoboxFields.status = endMatch && endMatch[1].trim() ? '已完结' : '连载中';

    const characterInfo = parseCharacterList(doc, 'book');

    const finalInfo = {
        ...workinginfo,
        ...infoboxFields,
        ...characterInfo,
    };

    for (const key in finalInfo) {
        if (!finalInfo[key] || finalInfo[key] === 'null' || finalInfo[key] === 'undefined') {
            finalInfo[key] = ' ';
        }
    }
    return finalInfo;
}

/**
 * 获取游戏信息（与原脚本 getGameByurl 一致）
 */
async function getGameByurl(url) {
    const page = await requestGet(url);
    if (!page) {
        notice('No results found.');
        throw new Error('No results found.');
    }

    const doc = parseHtmlToDom(page);
    const $ = (s) => doc.querySelector(s);
    const $$ = (s) => doc.querySelectorAll(s);

    const Type = $('#headerSubject')?.getAttribute('typeof');
    if (Type !== 'v:Game') {
        notice('您输入的作品不是游戏！');
        throw new Error('Not A Game Information Input');
    }

    const workinginfo = extractBaseInfo(doc, 'game');

    const infobox = $$('#infobox > li');
    const str = Array.from(infobox).map(li => li.textContent.trim()).join('\n');

    // 平台
    const platformMatch = /平台:\s*(.*?)\s*展开\+/s.exec(str);
    let platform = [];
    if (!platformMatch) platform = '未知';
    let platformRaw = platformMatch ? platformMatch[1].trim() : '';
    let platformList = platformRaw.includes('、')
        ? platformRaw.split('、')
        : platformRaw.split(/\s+/);
    platform = platformList
        .filter(item => item.trim() !== '')
        .join('、');

    const infoboxRules = {
        type: /游戏类型:\s*([^\n]*)/g,
        playerNum: /游玩人数:\s*(\d*)/g,
        develop: /开发:\s*([^\n]*)/,
        Publish: /发行:\s*([^\n]*)/,
        script: /剧本:\s*([^\n]*)/,
        music: /音乐:\s*([^\n]*)/,
        art: /原画:\s*([^\n]*)/,
        director: /导演:\s*([^\n]*)/,
        producer: /制作人:\s*([^\n]*)/,
        ReleaseDate: /发行日期:\s*([^\n]*)/,
        price: /售价:\s*([^\n]*)/,
        website: /官方网站:\s*(.*?)(?=\n|$)/gm,
    };
    const infoboxFields = extractInfoboxFields(doc, infoboxRules);
    infoboxFields.platform = platform;

    if (infoboxFields.website && infoboxFields.website !== '未知' && !infoboxFields.website.startsWith('http')) {
        infoboxFields.website = `https://${infoboxFields.website.replace(/^https?:\/\//, '')}`;
    }

    const characterInfo = parseCharacterList(doc, 'game');

    const finalInfo = {
        ...workinginfo,
        ...infoboxFields,
        ...characterInfo,
    };

    for (const key in finalInfo) {
        if (!finalInfo[key] || finalInfo[key] === 'null' || finalInfo[key] === 'undefined') {
            finalInfo[key] = ' ';
        }
    }
    return finalInfo;
}

// =============================================================================
// 模板渲染（替代 QuickAdd executeChoice + Templater 交互）
// =============================================================================

/**
 * 按日期格式串生成时间戳（支持 YYYY MM DD HH mm ss）
 * @param {string} fmt
 * @returns {string}
 */
function formatDate(fmt) {
    const d = new Date();
    const pad = (n, l = 2) => String(n).padStart(l, '0');
    return fmt
        .replace(/YYYY/g, d.getFullYear())
        .replace(/YY/g, String(d.getFullYear()).slice(-2))
        .replace(/MM/g, pad(d.getMonth() + 1))
        .replace(/DD/g, pad(d.getDate()))
        .replace(/HH/g, pad(d.getHours()))
        .replace(/mm/g, pad(d.getMinutes()))
        .replace(/ss/g, pad(d.getSeconds()));
}

/**
 * 渲染模板：替换 {{VALUE:field}} / {{DATE:fmt}} / Templater <%* %> 与 <% var %>
 * @param {string} tplText - 模板文件内容
 * @param {object} info - 字段值
 * @param {object} interactive - Templater 交互变量值 {state, subGroup, subLanguage, catego, mediaInfo, ...}
 * @returns {string}
 */
function renderTemplate(tplText, info, interactive) {
    let out = tplText;

    // 1) 移除 Templater 代码定义块 <%* ... -%>（带 trim，吃掉其后换行）
    out = out.replace(/<%\*[\s\S]*?-%>\n?/g, '');
    // 2) 移除其它 <%* ... %> 代码块（无 trim）
    out = out.replace(/<%\*[\s\S]*?%>/g, '');

    // 3) 替换 Templater 输出 <% varName %>
    out = out.replace(/<%\s*([\w.]+)\s*%>/g, (m, name) => {
        const v = interactive[name];
        return (v === undefined || v === null) ? '' : String(v);
    });

    // 4) 替换 {{VALUE:field}}
    out = out.replace(/\{\{VALUE:([\w]+)\}\}/g, (m, key) => {
        const v = info[key];
        if (Array.isArray(v)) return v.join(',');
        return (v === undefined || v === null) ? ' ' : String(v);
    });

    // 5) 替换 {{DATE:fmt}}
    out = out.replace(/\{\{DATE:([^}]+)\}\}/g, (m, fmt) => formatDate(fmt.trim()));

    return out;
}

// =============================================================================
// 类型映射 / 默认值
// =============================================================================

// type -> { cat(搜索cat参数), sourceName, templateFile, folder }
const TYPE_MAP = {
    anime: { cat: '2', sourceName: '动画', template: 'T-动画.md', folder: 'anime' },
    book:  { cat: '1', sourceName: '漫画', template: 'T-漫画.md', folder: 'manga' },
    manga: { cat: '1', sourceName: '漫画', template: 'T-漫画.md', folder: 'manga' },
    game:  { cat: '4', sourceName: '游戏', template: 'T-游戏.md', folder: 'game' },
};

// 各类型的交互字段默认值（对应 Templater suggester 的第二组选项）
function defaultInteractive(type) {
    switch (type) {
        case 'anime':
            return { state: '想看⏰', mediaInfo: 'online', subGroup: 'Online', subLanguage: 'Online', catego: '其它' };
        case 'book':
        case 'manga':
            return { state: '想看⏰', mediaInfo: 'False' };
        case 'game':
            return { state: '想玩⏰', mediaInfo: 'False' };
        default:
            return {};
    }
}

// =============================================================================
// CLI 参数解析
// =============================================================================

function parseArgs(argv) {
    const args = { _: [] };
    // --kebab-case 转为 camelCase（如 dry-run -> dryRun），避免引用时大小写不一致
    const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const key = a.slice(2);
            // 支持 --key=value
            if (key.includes('=')) {
                const [k, ...rest] = key.split('=');
                args[toCamel(k)] = rest.join('=');
            } else {
                // 下一个若不是 flag 则作为 value，否则视为布尔 true
                const next = argv[i + 1];
                if (next !== undefined && !next.startsWith('--')) {
                    args[toCamel(key)] = next;
                    i++;
                } else {
                    args[toCamel(key)] = true;
                }
            }
        } else {
            args._.push(a);
        }
    }
    return args;
}

function usage() {
    return [
        'ACGbangumi-cli — 命令行版 Bangumi 番剧导入',
        '',
        '用法:',
        '  node ACGbangumi-cli.cjs search --name <关键词> [--type all|anime|book|game] [--page N] [--json]',
        '  node ACGbangumi-cli.cjs add    --name <关键词> | --url <详情页URL>  --type anime|book|game',
        '                                  [--index N] [--score 1.0-10.0] [--tags a,b,c]',
        '                                  [--state <状态>] [--media <本地类型>]',
        '                                  [--subgroup <字幕组>] [--sublang <字幕语言>] [--category <改编类别>]',
        '                                  [--folder <路径>] [--filename <名>] [--out <完整路径>]',
        '                                  [--vault <vault根>] [--template <模板文件>] [--proxy <代理URL>]',
        '                                  [--dry-run] [--json]',
        '',
        '说明:',
        '  search : 搜索并输出结果列表（--json 输出 JSON，便于大模型选择）。',
        '  add    : 抓取详情并按模板生成 Project 笔记文件。',
        '           --url 指定详情页时跳过搜索；--name 时自动取第 --index 条（默认 0）匹配结果。',
        '  type   : anime->动画/T-动画.md/Projects/anime；book|manga->漫画/T-漫画.md/Projects/manga；game->游戏/T-游戏.md/Projects/game。',
        '  cookie : 导出环境变量 BGM_COOKIE 即可（可选，公共页面通常不需要）。',
        '  proxy  : 自动读取 HTTP_PROXY/HTTPS_PROXY/NO_PROXY 环境变量；也可用 --proxy 或 BGM_PROXY 显式指定。',
    ].join('\n');
}

// =============================================================================
// 主流程
// =============================================================================

async function cmdSearch(args) {
    const name = args.name;
    if (!name) { console.error(usage()); process.exit(1); }
    const typeKey = (args.type || 'all').toLowerCase();
    const cat = TYPE_MAP[typeKey]?.cat || 'all';
    const page = parseInt(args.page || '1', 10);
    pageNum = page > 1 ? page - 1 : 1; // searchBangumi 内部 ++pageNum

    const encodedName = encodeURIComponent(String(name).trim());
    let url = `https://bgm.tv/subject_search/${encodedName}?cat=${cat}`;
    if (page > 1) url += `&page=${page}`;

    const results = await searchBangumi(url);
    if (!results) {
        const msg = '找不到你搜索的内容';
        if (args.json) { console.log(JSON.stringify({ ok: false, error: msg, results: [] })); }
        else { console.error(msg); }
        process.exit(1);
    }
    // 过滤掉“下一页”占位项，输出干净结果
    const clean = results.filter(r => r.type !== 'none').map(r => ({
        title: r.title || r.text,
        type: r.type,
        link: r.link,
        info: r.info || '',
    }));
    if (args.json) {
        console.log(JSON.stringify({ ok: true, count: clean.length, results: clean }, null, 2));
    } else {
        clean.forEach((r, i) => {
            const icon = r.type === 'anime' ? '🎞️' : r.type === 'book' ? '📚' : '🎮';
            console.log(`[${i}] ${icon} ${r.title}\n    ${r.link}\n    ${r.info}`);
        });
    }
}

async function cmdAdd(args) {
    const typeKey = (args.type || '').toLowerCase();
    if (!TYPE_MAP[typeKey]) {
        console.error(`[ERROR] --type 必须是 anime|book|game 之一（收到: ${args.type || '(空)'}）`);
        console.error(usage());
        process.exit(1);
    }
    const tinfo = TYPE_MAP[typeKey];

    // ---- 1. 确定详情页 URL ----
    let detailUrl = args.url;
    if (!detailUrl) {
        const name = args.name;
        if (!name) { console.error(usage()); process.exit(1); }
        const encodedName = encodeURIComponent(String(name).trim());
        const searchUrl = `https://bgm.tv/subject_search/${encodedName}?cat=${tinfo.cat}`;
        const results = await searchBangumi(searchUrl);
        if (!results) { console.error('[ERROR] 找不到你搜索的内容'); process.exit(1); }
        const clean = results.filter(r => r.type !== 'none');
        const idx = Math.max(0, Math.min(clean.length - 1, parseInt(args.index || '0', 10)));
        const choice = clean[idx];
        if (!choice) { console.error('[ERROR] 搜索结果为空，无法选择'); process.exit(1); }
        detailUrl = choice.link;
        notice(`已选择: ${choice.title} -> ${detailUrl}`);
    }

    // ---- 2. 抓取详情 ----
    let Info;
    try {
        switch (typeKey) {
            case 'book':
            case 'manga':
                Info = await getComicByurl(detailUrl);
                notice('正在生成漫画笔记📚');
                break;
            case 'game':
                Info = await getGameByurl(detailUrl);
                notice('正在生成游戏笔记🎮');
                break;
            case 'anime':
            default:
                Info = await getAnimeByurl(detailUrl);
                notice('正在生成动画笔记🎞');
                break;
        }
    } catch (err) {
        notice(`获取详情失败: ${err.message}`);
        throw err;
    }

    // ---- 3. 标签 / 评分 / url / 添加时间 ----
    if (args.tags !== undefined) {
        Info.tags = String(args.tags);
    } else {
        Info.tags = (Info.tagsArray && Info.tagsArray.length) ? Info.tagsArray.join(',') : ' ';
    }
    Info.score = args.score !== undefined ? String(args.score) : 'null';
    Info.url = detailUrl || ' ';
    const _now = new Date();
    Info.addDate = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

    // ---- 4. 交互字段（CLI 覆盖默认值）----
    const interactive = defaultInteractive(typeKey);
    if (args.state) interactive.state = String(args.state);
    if (args.media) interactive.mediaInfo = String(args.media);
    if (args.subgroup) interactive.subGroup = String(args.subgroup);
    if (args.sublang) interactive.subLanguage = String(args.sublang);
    if (args.category) interactive.catego = String(args.category);

    // ---- 5. 渲染模板 ----
    const vaultRoot = args.vault
        ? path.resolve(args.vault)
        : path.resolve(fs.realpathSync(__dirname), '..');
    const templatePath = args.template
        ? path.resolve(args.template)
        : path.join(vaultRoot, 'Templates', tinfo.template);
    if (!fs.existsSync(templatePath)) {
        console.error(`[ERROR] 模板文件不存在: ${templatePath}`);
        process.exit(1);
    }
    const tplText = fs.readFileSync(templatePath, 'utf8');
    const rendered = renderTemplate(tplText, Info, interactive);

    // ---- 6. 输出 ----
    const fileName = (args.filename !== undefined ? String(args.filename) : Info.CN).trim() || '未知作品';
    const safeName = fileName.replace(/[\*"\\\/<>:\|?]/g, ' ').trim() || '未知作品';
    const folder = args.folder
        ? path.resolve(args.folder)
        : path.join(vaultRoot, 'Projects', tinfo.folder);
    const outPath = args.out
        ? path.resolve(args.out)
        : path.join(folder, `${safeName}.md`);

    if (args.dryRun) {
        if (args.json) {
            console.log(JSON.stringify({
                ok: true,
                dryRun: true,
                path: outPath,
                type: typeKey,
                title: Info.CN,
                url: detailUrl,
                content: rendered,
            }, null, 2));
        } else {
            console.log(`===== DRY-RUN (will NOT write) =====`);
            console.log(`目标路径: ${outPath}`);
            console.log(`----- 内容 -----`);
            console.log(rendered);
            console.log(`----- 结束 -----`);
        }
        return;
    }

    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(outPath, rendered, 'utf8');
    notice(`已写入: ${outPath}`);

    if (args.json) {
        console.log(JSON.stringify({
            ok: true,
            path: outPath,
            type: typeKey,
            title: Info.CN,
            url: detailUrl,
        }, null, 2));
    } else {
        console.log(`✅ 已创建笔记: ${outPath}`);
        console.log(`   类型: ${tinfo.sourceName} | 评分: ${Info.score} | 标签: ${Info.tags}`);
    }
}

// -----------------------------------------------------------------------------
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.proxy) PROXY_OVERRIDE = String(args.proxy);
    const sub = args._[0] || (args.name || args.url ? 'add' : '');
    if (!sub || args.help || args.h) {
        console.log(usage());
        process.exit(0);
    }
    try {
        if (sub === 'search') await cmdSearch(args);
        else if (sub === 'add') await cmdAdd(args);
        else { console.error(`[ERROR] 未知子命令: ${sub}\n`); console.error(usage()); process.exit(1); }
    } catch (err) {
        console.error(`[ERROR] ${err.message}`);
        process.exit(1);
    }
}

main();
