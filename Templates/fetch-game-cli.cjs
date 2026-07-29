#!/usr/bin/env node
// =============================================================================
// fetch-game-cli.cjs  —  命令行版 RAWG 游戏卡片生成器
// -----------------------------------------------------------------------------
// 由 Templates/fetch-game.js（交互式版）改写为纯命令行调用，
// 方便大模型 / Agent 自动化搜索游戏并生成 Obsidian 笔记。
//
// 依赖：零外部依赖（Node 内置 http/https/tls/child_process）。
//       需要 RAWG API Key：注册 rawg.io → https://rawg.io/apidocs 获取。
//
// 配置 API Key（二选一）：
//   方式一：环境变量 RAWG_API_KEY
//   方式二：--api-key <key> 参数
//
// 用法示例：
//   1) 搜索：
//      node fetch-game-cli.cjs search --name "Elden Ring" --json
//
//   2) 按名称生成（自动取搜索结果第 0 条）：
//      node fetch-game-cli.cjs add --name "Elden Ring" --score 9.5 --status 已通关🎮
//
//   3) 预览不写文件：
//      node fetch-game-cli.cjs add --name "Elden Ring" --dry-run
//
// 代理：自动读取系统环境变量 HTTPS_PROXY/HTTP_PROXY 或 Windows 注册表系统代理。
//       也可用 --proxy <url> 显式指定。
// =============================================================================

'use strict';

const https = require('https');
const http = require('http');
const tls = require('tls');
const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// =============================================================================
// 配置
// =============================================================================

const DEFAULT_OUTPUT_DIR = 'E:/Documents/Obsidian_/Cpp/Projects/game';
const RAWG_BASE = 'https://api.rawg.io/api';
const CONFIG_FILE = join(__dirname, 'rawg-config.json');

// 从配置文件读取 API Key（与原始 fetch-game.js 一致）
function getConfigApiKey() {
    if (existsSync(CONFIG_FILE)) {
        try {
            const cfg = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
            if (cfg.apiKey) return cfg.apiKey;
        } catch (_) { /* ignore */ }
    }
    return null;
}

const STATUS_OPTIONS = [
    { key: '1', label: '已通关', emoji: '🎮' },
    { key: '2', label: '在玩', emoji: '🕹️' },
    { key: '3', label: '想玩', emoji: '💭' },
    { key: '4', label: '搁置', emoji: '⏸️' },
];

// 可通过 --proxy 或环境变量 BGM_PROXY 显式指定代理
let PROXY_OVERRIDE = process.env.BGM_PROXY || '';

// =============================================================================
// 代理检测
// =============================================================================

function getWindowsProxy() {
    if (process.platform !== 'win32') return null;
    try {
        const regPath = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';
        const enableOut = execSync(`reg query "${regPath}" /v ProxyEnable`, { timeout: 3000, encoding: 'utf-8' });
        if (!/0x1/i.test(enableOut)) return null;
        const serverOut = execSync(`reg query "${regPath}" /v ProxyServer`, { timeout: 3000, encoding: 'utf-8' });
        const match = serverOut.match(/ProxyServer\s+REG_SZ\s+(.+)/);
        if (!match) return null;
        const serverStr = match[1].trim();
        if (serverStr.includes('=')) {
            const parts = serverStr.split(';');
            for (const part of parts) {
                const [proto, addr] = part.split('=');
                if (proto.trim() === 'https' || proto.trim() === 'http') {
                    const url = new URL(`http://${addr.trim()}`);
                    return { host: url.hostname, port: parseInt(url.port) || 80 };
                }
            }
            return null;
        }
        const url = new URL(`http://${serverStr}`);
        return { host: url.hostname, port: parseInt(url.port) || 80 };
    } catch { return null; }
}

function getProxy() {
    if (PROXY_OVERRIDE) {
        try { const u = new URL(PROXY_OVERRIDE); return { host: u.hostname, port: parseInt(u.port) || 80 }; } catch {}
    }
    const proxyStr = process.env.HTTPS_PROXY || process.env.https_proxy ||
        process.env.HTTP_PROXY || process.env.http_proxy ||
        process.env.ALL_PROXY || process.env.all_proxy;
    if (proxyStr) {
        try { const u = new URL(proxyStr); return { host: u.hostname, port: parseInt(u.port) || 80 }; } catch {}
    }
    return getWindowsProxy();
}

// =============================================================================
// HTTP 层（代理 CONNECT 隧道 + 直连）
// =============================================================================

function parseHttpResponse(rawData) {
    const headerEnd = rawData.indexOf('\r\n\r\n');
    if (headerEnd < 0) throw new Error('无效的 HTTP 响应');
    const headerStr = rawData.slice(0, headerEnd);
    let body = rawData.slice(headerEnd + 4);
    const headers = {};
    headerStr.split('\r\n').slice(1).forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim().toLowerCase();
    });
    if (headers['transfer-encoding'] === 'chunked') {
        let result = '', pos = 0;
        while (pos < body.length) {
            const lineEnd = body.indexOf('\r\n', pos);
            if (lineEnd < 0) break;
            const chunkSize = parseInt(body.slice(pos, lineEnd), 16);
            if (isNaN(chunkSize) || chunkSize === 0) break;
            result += body.slice(lineEnd + 2, lineEnd + 2 + chunkSize);
            pos = lineEnd + 2 + chunkSize + 2;
        }
        body = result;
    }
    return body;
}

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const proxy = getProxy();
        let timer; const cleanup = () => { if (timer) { clearTimeout(timer); timer = null; } };
        const fail = (err) => { cleanup(); reject(err); };
        timer = setTimeout(() => fail(new Error('请求超时 (15s)')), 15000);

        if (proxy) {
            const targetUrl = new URL(url);
            const connectReq = http.request({
                host: proxy.host, port: proxy.port, method: 'CONNECT',
                path: `${targetUrl.hostname}:443`, headers: { Host: `${targetUrl.hostname}:443` },
            });
            connectReq.on('connect', (proxyRes, socket) => {
                if (proxyRes.statusCode !== 200) { fail(new Error(`代理连接失败: ${proxyRes.statusCode}`)); return; }
                const tlsSocket = tls.connect({ socket, servername: targetUrl.hostname }, () => {
                    tlsSocket.write(
                        `GET ${targetUrl.pathname + targetUrl.search} HTTP/1.1\r\n` +
                        `Host: ${targetUrl.hostname}\r\n` +
                        `Connection: close\r\nAccept: application/json\r\n\r\n`
                    );
                    let raw = '';
                    tlsSocket.on('data', (chunk) => (raw += chunk.toString()));
                    tlsSocket.on('end', () => {
                        cleanup();
                        try {
                            const body = parseHttpResponse(raw);
                            const json = JSON.parse(body);
                            if (json.detail) reject(new Error(json.detail));
                            else resolve(json);
                        } catch (e) { reject(new Error(`JSON 解析失败: ${e.message}`)); }
                    });
                    tlsSocket.on('error', fail);
                });
                tlsSocket.on('error', fail);
            });
            connectReq.on('error', fail);
            connectReq.end();
        } else {
            const req = https.get(url, { timeout: 15000 }, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    cleanup();
                    try {
                        const json = JSON.parse(data);
                        if (json.detail) reject(new Error(json.detail));
                        else resolve(json);
                    } catch (e) { reject(new Error(`JSON 解析失败: ${e.message}`)); }
                });
                res.on('error', fail);
            });
            req.on('error', fail);
            req.on('timeout', () => fail(new Error('请求超时 (15s)')));
        }
    });
}

// =============================================================================
// RAWG API
// =============================================================================

async function searchGames(apiKey, query) {
    const url = `${RAWG_BASE}/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=10`;
    const data = await httpsGet(url);
    return data.results || [];
}

async function getGameDetails(apiKey, slug) {
    const url = `${RAWG_BASE}/games/${slug}?key=${apiKey}`;
    return httpsGet(url);
}

// =============================================================================
// 工具函数
// =============================================================================

function safeFileName(name) {
    return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n').trim();
}

function notice(msg) { process.stderr.write(`[notice] ${msg}\n`); }
function log(msg) { process.stderr.write(`[log] ${msg}\n`); }

// =============================================================================
// Markdown 生成
// =============================================================================

function generateFrontmatter(details, chineseName, status, rating) {
    const cover = details.background_image ? `![](${details.background_image})` : '';
    const platforms = (details.platforms || []).map(p => p.platform?.name).filter(Boolean).join(', ');
    const genres = (details.genres || []).map(g => g.name).filter(Boolean).join(', ');
    const developers = (details.developers || []).map(d => d.name).filter(Boolean).join(', ');
    const year = details.released ? details.released.slice(0, 4) : '';
    const tags = (details.tags || []).slice(0, 10).map(t => t.name).filter(Boolean).join(', ');
    const playtime = details.playtime ? `${details.playtime}h` : '';

    const lines = ['---', `中文名: "${chineseName || details.name}"`, `外文名: "${details.name}"`];
    if (cover) lines.push(`封面: "${cover}"`);
    lines.push(`游玩状态: ${status}`);
    if (rating) lines.push(`评分: "${rating}"`);
    if (platforms) lines.push(`平台: ${platforms}`);
    if (genres) lines.push(`类型: ${genres}`);
    if (developers) lines.push(`开发商: ${developers}`);
    if (year) lines.push(`发售年份: "${year}"`);
    if (playtime) lines.push(`游玩时长: "${playtime}"`);
    if (tags) lines.push(`标签: ${tags}`);
    lines.push('---');
    return lines.join('\n');
}

function generateBody(details) {
    const parts = [];
    if (details.description_raw) {
        const desc = stripHtml(details.description_raw);
        if (desc) parts.push(desc);
    }
    parts.push('\n## 基本信息');
    if (details.released) parts.push(`- 发售日期: ${details.released}`);
    if (details.metacritic) parts.push(`- Metacritic: ${details.metacritic}`);
    if (details.rating) parts.push(`- RAWG 评分: ${details.rating}/5`);
    if (details.website) parts.push(`- 官网: ${details.website}`);
    if (details.esrb_rating?.name) parts.push(`- 分级: ${details.esrb_rating.name}`);
    const publishers = (details.publishers || []).map(p => p.name).filter(Boolean).join(', ');
    if (publishers) parts.push(`- 发行商: ${publishers}`);
    if (details.playtime) parts.push(`- 平均通关时长: ${details.playtime} 小时`);
    return parts.join('\n');
}

// =============================================================================
// CLI 参数解析
// =============================================================================

function parseArgs(argv) {
    const args = { _: [] };
    const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const key = a.slice(2);
            if (key.includes('=')) {
                const [k, ...rest] = key.split('=');
                args[toCamel(k)] = rest.join('=');
            } else {
                const next = argv[i + 1];
                if (next !== undefined && !next.startsWith('--')) { args[toCamel(key)] = next; i++; }
                else { args[toCamel(key)] = true; }
            }
        } else { args._.push(a); }
    }
    return args;
}

function usage() {
    return [
        'fetch-game-cli — 命令行版 RAWG 游戏卡片生成器',
        '',
        '用法:',
        '  node fetch-game-cli.cjs search --name <关键词> [--api-key <key>] [--json]',
        '  node fetch-game-cli.cjs add    --name <关键词> [--api-key <key>] [--index N]',
        '                                  [--score 1.0-10.0] [--status <状态>]',
        '                                  [--chinese-name <中文名>] [--playtime <时长>]',
        '                                  [--folder <路径>] [--filename <名>] [--out <路径>]',
        '                                  [--proxy <代理URL>] [--dry-run] [--json]',
        '',
        '说明:',
        '  search : 搜索 RAWG 游戏数据库（--json 输出 JSON，便于大模型选择）。',
        '  add    : 获取详情并按格式生成 Obsidian 笔记文件。',
        '           --name 搜索并自动取第 --index 条（默认 0）匹配结果。',
        '  status : 游玩状态，可选: 已通关🎮(1), 在玩🕹️(2), 想玩💭(3), 搁置⏸️(4)；默认 想玩💭。',
        '           也可自定义任意文本（如 "已通关🎮" 和 "1" 均为等效）。',
        '  api-key: 环境变量 RAWG_API_KEY 或 --api-key 参数；注册获取 https://rawg.io/apidocs',
        '  proxy  : 自动读取 HTTPS_PROXY/HTTP_PROXY 或 Windows 系统代理；也可 --proxy 显式指定。',
    ].join('\n');
}

// =============================================================================
// 子命令
// =============================================================================

async function cmdSearch(args) {
    if (!args.name) { console.error(usage()); process.exit(1); }
    const apiKey = args.apiKey || process.env.RAWG_API_KEY || getConfigApiKey();
    if (!apiKey) { console.error('[ERROR] 需要 RAWG API Key。设置环境变量 RAWG_API_KEY 或用 --api-key <key>'); process.exit(1); }
    const results = await searchGames(apiKey, String(args.name));
    if (!results.length) {
        if (args.json) console.log(JSON.stringify({ ok: false, error: '未找到结果', results: [] }));
        else console.log('未找到相关游戏');
        return;
    }
    const clean = results.map(g => ({
        title: g.name,
        slug: g.slug,
        year: g.released ? g.released.slice(0, 4) : '----',
        rating: g.rating || null,
        platforms: (g.platforms || []).map(p => p.platform?.name).filter(Boolean).slice(0, 6).join(', '),
    }));
    if (args.json) {
        console.log(JSON.stringify({ ok: true, count: clean.length, results: clean }, null, 2));
    } else {
        clean.forEach((g, i) => {
            console.log(`[${i}] ${g.title} (${g.year}) ★${g.rating || '-'}  |  ${g.platforms}`);
        });
    }
}

async function cmdAdd(args) {
    if (!args.name) { console.error(usage()); process.exit(1); }
    const apiKey = args.apiKey || process.env.RAWG_API_KEY || getConfigApiKey();
    if (!apiKey) { console.error('[ERROR] 需要 RAWG API Key。设置环境变量 RAWG_API_KEY 或用 --api-key <key>'); process.exit(1); }

    // 搜索
    const results = await searchGames(apiKey, String(args.name));
    if (!results.length) { console.error('[ERROR] 未找到相关游戏'); process.exit(1); }
    const idx = Math.max(0, Math.min(results.length - 1, parseInt(args.index || '0', 10)));
    const selected = results[idx];
    notice(`已选择: ${selected.name} (${selected.slug})`);

    // 获取详情
    let details;
    try {
        details = await getGameDetails(apiKey, selected.slug);
    } catch (e) {
        notice(`获取详情失败: ${e.message} — 使用搜索数据`);
        details = selected;
    }

    // 状态
    let status;
    const statusArg = String(args.status || '3');
    const statusOpt = STATUS_OPTIONS.find(s => s.key === statusArg) || STATUS_OPTIONS.find(s => s.label === statusArg);
    if (statusOpt) { status = `${statusOpt.label}${statusOpt.emoji}`; }
    else if (statusArg.includes('🎮') || statusArg.includes('🕹️') || statusArg.includes('💭') || statusArg.includes('⏸️')) { status = statusArg; }
    else { status = '想玩💭'; }

    // 评分
    let rating = '';
    if (args.score !== undefined) {
        const parsed = parseFloat(args.score);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) rating = parsed.toFixed(1);
    }

    // 中文名
    const chineseName = args.chineseName || '';

    // 生成 Markdown
    const finalCN = chineseName || details.name;
    let frontmatter = generateFrontmatter(details, finalCN, status, rating);
    const body = generateBody(details);
    let finalMarkdown = frontmatter + '\n\n' + body + '\n';

    // 游玩时长覆盖
    if (args.playtime !== undefined) {
        finalMarkdown = finalMarkdown.replace(/游玩时长: ".*?"/, `游玩时长: "${args.playtime}"`);
    }

    // 输出路径
    const folder = args.folder ? args.folder : DEFAULT_OUTPUT_DIR;
    const fileName = (args.filename ? safeFileName(String(args.filename)) : safeFileName(finalCN)) + '.md';
    const outPath = args.out || join(folder, fileName);

    if (args.dryRun) {
        if (args.json) {
            console.log(JSON.stringify({ ok: true, dryRun: true, path: outPath, title: finalCN, content: finalMarkdown }, null, 2));
        } else {
            console.log('===== DRY-RUN (will NOT write) =====');
            console.log(`目标路径: ${outPath}`);
            console.log('----- 内容 -----');
            console.log(finalMarkdown);
            console.log('----- 结束 -----');
        }
        return;
    }

    if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
    writeFileSync(outPath, finalMarkdown, 'utf-8');
    notice(`已写入: ${outPath}`);

    if (args.json) {
        console.log(JSON.stringify({ ok: true, path: outPath, title: finalCN }, null, 2));
    } else {
        console.log(`✅ 已创建笔记: ${outPath}`);
        console.log(`   游戏: ${finalCN} | 状态: ${status}${rating ? ' | 评分: ' + rating : ''}`);
    }
}

// =============================================================================
// 入口
// =============================================================================

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.proxy) PROXY_OVERRIDE = String(args.proxy);
    const sub = args._[0] || (args.name ? 'add' : '');
    if (!sub || args.help || args.h) { console.log(usage()); process.exit(0); }
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
