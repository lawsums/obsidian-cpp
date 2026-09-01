---
name: bangumi-season-import
description: 当用户要求搜索并批量导入某个月份新播出的番剧（新番/新番季档/季度动画）到 Obsidian 的 Bangumi 追番笔记库时使用。覆盖完整流程：WebSearch 搜集当月新番列表 → 按类型分组整理成表格供用户筛选 → 用户报序号后逐一定位 Bangumi 条目 → 用 ACGbangumi-cli.cjs 生成 Obsidian 笔记。触发场景包括「帮我搜搜X月有哪些新番」「批量添加番剧」「把这几部加进追番库」等，涉及番剧/动画的批量入库任务。
agent_created: true
---

# Bangumi 新番季档批量入库

## Overview

帮用户在 Obsidian 里批量添加某一季度新播番剧的追番笔记。核心是调用用户机器上现成的 `ACGbangumi-cli.cjs` 命令行脚本，把「WebSearch 找番 → 用户筛选 → search 定位 → add 生成笔记」串成一条龙。

## 关键路径与命令（务必照抄，否则必错）

用户机器上 ACGbangumi 脚本**已被整理进 `Templates/scripts/` 子目录**，且模板文件留在 `Templates/` 根目录，导致脚本默认的 vault 根路径计算会错。所以：

- 脚本路径：`E:/Documents/Obsidian/Templates/scripts/ACGbangumi-cli.cjs`
- **必须显式传 `--vault "E:/Documents/Obsidian"`**，否则模板路径会变成 `Templates/Templates/T-动画.md` 报错
- Node 用托管版，并设 `NODE_PATH` 以加载 linkedom 依赖

标准命令模板（在 `E:/Documents/Obsidian_/Cpp` 下运行）：

```bash
cd "E:/Documents/Obsidian_/Cpp" && \
NODE_PATH="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules" \
"C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe" \
"E:/Documents/Obsidian/Templates/scripts/ACGbangumi-cli.cjs" \
  search --name "<番名>" --type anime --json
```

```bash
cd "E:/Documents/Obsidian_/Cpp" && \
NODE_PATH="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules" \
"C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe" \
"E:/Documents/Obsidian/Templates/scripts/ACGbangumi-cli.cjs" \
  add --url "https://bgm.tv/subject/<ID>" --type anime --vault "E:/Documents/Obsidian"
```

要点：

- 写文件到 `E:/Documents/Obsidian/Projects/anime/`（工作区之外），会被 sandbox 拦截，**必须用 `dangerouslyDisableSandbox` 执行 add**（search 不需要）。
- `--type` 只支持 `anime`（动画）/`book`·`manga`（漫画）/`game`（游戏）。新番默认 `anime`。
- 状态默认就是「想看⏰」（模板内置），无需传 `--state`，除非用户指定其它状态（如在看📖、看过🎉、搁置等）。
- 脚本 HTTP 层零依赖，会自动读环境变量代理；但实测本机自动检测会命中坏节点（ETIMEDOUT 到 31.13.69.169:443），**推荐每条命令都显式加 `--proxy "http://127.0.0.1:7890"`**，稳定可用。
- 调试/预览建议先跑 `--dry-run`（不写文件）确认内容无误，再正式 add。

## 工作流

### Step 1 — 搜集当月新番列表

用 `WebSearch` 搜索，示例 query：`YYYY年M月新番一览表`（或「秋季新番」「夏季新番」）。

- 可信来源：bilibili 专栏、萌娘百科（zh.moegirl.org.cn）、thetv.jp、网易 163 动漫、acg17 等。
- **勿信** nextanimeseason.com 等 AI 生成站（它们会编造 Phantom Throne、Blue Horizon Academy 之类不存在的番）。
- 多来源交叉去重，得到一份当月新番清单（通常 50~65 部）。

### Step 2 — 分组整理给用户筛选

按「热门续作 / 新作·奇幻异世界 / 新作·恋爱喜剧 / 新作·悬疑科幻战斗 / 泡面子供向」等分类，整理成带序号的表格，附播出日期。**不要一次全加**——明确告诉用户「回复序号（支持 `1,2,3` 或 `1-6,9,12`）即可」，并默认状态为「想看」。

### Step 3 — 用户报序号后逐一定位

对用户选的每一部，用 `search --name "<番名>" --type anime --json` 定位 Bangumi 条目，拿到 `subject/<ID>` 和 `link`。

定位技巧（续作最容易搜错）：

- **续作必须精确到「第N季 / 第N期 / 第2部分」**，否则会命中第一季。例：「药屋少女的呢喃 第三季」「乱马1/2 第三季」。
- 中文搜不到或结果不全时，换**日文名**再搜（如 `らんま1/2`）。
- 确认 `info` 里的播出年份匹配目标季度（如 2026年10月）。
- 注意 Bangumi 官方译名可能与用户口述不同（如「FX战士小胡桃」实际是「FX战士久留美」），记下来在结果里提示用户。

### Step 4 — 批量 add 生成笔记

对每部用 `add --url "https://bgm.tv/subject/<ID>" --type anime --vault "E:/Documents/Obsidian"` 写入（记得 `dangerouslyDisableSandbox`）。并行执行多部可提速，但每部的 search 结果要先确认正确。

## 注意事项与坑

- **文件名安全化**：脚本会把标题里的 `/` `:` 等非法字符替换为空格，如「乱马1/2」→「乱马1 2」，属正常现象，不必纠正。
- **播出日期核对**：用户口述的月份可能不准（如「愚者之夜」是 11 月而非 10 月），search 后以 Bangumi `info` 为准，并在结果里提示。
- **条目未建**：新番条目可能尚未在 Bangumi 建立（尤其距离开播还有 1~2 个月时），search 无结果时换关键词/日文名重试，仍无则告知用户「该番条目尚未收录」。
- 详见 `references/cli-reference.md` 可查 CLI 全部子命令与参数。
