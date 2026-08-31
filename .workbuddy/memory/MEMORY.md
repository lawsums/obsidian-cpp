# 项目长期记忆 (Obsidian Cpp 工作区)

## 环境与路径
- Obsidian 主 vault：`E:/Documents/Obsidian/`。`E:/Documents/Obsidian_/Cpp/Templates` 是指向 `E:/Documents/Obsidian/Templates` 的符号链接。
- 番剧/漫画/游戏笔记目录：`E:/Documents/Obsidian/Projects/{anime,manga,game}/`，文件名=作品名。
- Bangumi QuickAdd 模板：`Templates/T-动画.md`、`T-漫画.md`、`T-游戏.md`（含 Templater `<%* %>` 交互 suggester 与 `{{VALUE:field}}`、`{{DATE:YYYYMMDDHHmmss}}`）。
- 原始脚本：`Templates/ACGbangumiv2.1.js`（Obsidian QuickAdd 版，by 月涟Luvian），勿改动。

## Bangumi CLI 脚本
- ⚠️ 2026-08-07 起脚本已从 `Templates/` 移入 `Templates/scripts/` 子目录：`E:/Documents/Obsidian/Templates/scripts/ACGbangumi-cli.cjs`（同目录还有 `ACGbangumi.cmd`、`ACGbangumi-API.md`、`ACGbangumiv2.1.js`）。**模板 T-动画.md 仍在 `Templates/` 根目录**。
- 因脚本在 `scripts/` 子目录，默认 vaultRoot 计算会错，**必须显式加 `--vault "E:/Documents/Obsidian"`**，否则模板路径变成 `Templates/Templates/T-动画.md` 报错。
- 子命令 `search` / `add`，支持 `--url/--name/--type/--score/--tags/--state/--media/--subgroup/--sublang/--category/--dry-run/--json/--proxy/--vault` 等。
- 依赖 linkedom（装在 `C:/Users/Administrator/.workbuddy/binaries/node/workspace`）；HTTP 层零依赖（http/https/tls/zlib + 代理 CONNECT）。
- 本机代理 `http://127.0.0.1:7890`（系统 env HTTP_PROXY/HTTPS_PROXY）；脚本自动读取，亦支持 `--proxy` / `BGM_PROXY`。
- 写文件到 `Projects/anime/`（工作区外）会被 sandbox 拦截，需 `dangerouslyDisableSandbox`。
- 同目录另有 `fetch-game-cli.cjs`（2026-07-29 新增，RAWG API 游戏抓取）+ `rawg-config.json`。

## 新番季档批量入库流程
- WebSearch 搜「YYYY年M月新番一览表」（bilibili/163/萌娘百科/thetv.jp 等来源，注意 nextanimeseason.com 等 AI 生成站勿信）→ 整理分组表格给用户筛选 → 用户报序号 → `search --name` 定位每部 Bangumi subject ID（续作要用「第N季/第N期/日文名」多试）→ `add --url ... --vault "E:/Documents/Obsidian"` 批量写入。
- 番剧文件名安全化会把 `/` 替换为空格（如「乱马1/2」→「乱马1 2」），属正常现象。

## 用户偏好
- lawsam：Godot 4 开发者（Vampire Survivors-like）；偏好完整工程脚手架、信号驱动/组合式/类型安全架构。
- Obsidian 已接入大模型，倾向把交互式 QuickAdd 脚本转成 CLI 供大模型调用。
