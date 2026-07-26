# 项目长期记忆 (Obsidian Cpp 工作区)

## 环境与路径
- Obsidian 主 vault：`E:/Documents/Obsidian/`。`E:/Documents/Obsidian_/Cpp/Templates` 是指向 `E:/Documents/Obsidian/Templates` 的符号链接。
- 番剧/漫画/游戏笔记目录：`E:/Documents/Obsidian/Projects/{anime,manga,game}/`，文件名=作品名。
- Bangumi QuickAdd 模板：`Templates/T-动画.md`、`T-漫画.md`、`T-游戏.md`（含 Templater `<%* %>` 交互 suggester 与 `{{VALUE:field}}`、`{{DATE:YYYYMMDDHHmmss}}`）。
- 原始脚本：`Templates/ACGbangumiv2.1.js`（Obsidian QuickAdd 版，by 月涟Luvian），勿改动。

## Bangumi CLI 脚本
- `Templates/ACGbangumi-cli.cjs`：纯命令行版，供大模型调用。子命令 `search` / `add`，支持 `--url/--name/--type/--score/--tags/--state/--media/--subgroup/--sublang/--category/--dry-run/--json/--proxy` 等。
- 依赖 linkedom（装在 `C:/Users/Administrator/.workbuddy/binaries/node/workspace`）；HTTP 层零依赖（http/https/tls/zlib + 代理 CONNECT）。
- 本机代理 `http://127.0.0.1:7890`（系统 env HTTP_PROXY/HTTPS_PROXY）；脚本自动读取，亦支持 `--proxy` / `BGM_PROXY`。

## 用户偏好
- lawsam：Godot 4 开发者（Vampire Survivors-like）；偏好完整工程脚手架、信号驱动/组合式/类型安全架构。
- Obsidian 已接入大模型，倾向把交互式 QuickAdd 脚本转成 CLI 供大模型调用。
