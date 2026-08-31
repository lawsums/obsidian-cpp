# ACGbangumi-cli.cjs 命令参考

## 脚本位置

- 脚本：`E:/Documents/Obsidian/Templates/scripts/ACGbangumi-cli.cjs`
- 配套：`ACGbangumi.cmd`（Windows 包装器）、`ACGbangumi-API.md`（完整协议文档）、`ACGbangumiv2.1.js`（QuickAdd 原始版，勿改动）
- 依赖 linkedom（装在 `C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules`）
- 同目录另有 `fetch-game-cli.cjs`（RAWG API 游戏抓取）+ `rawg-config.json`

## 运行前置

```bash
cd "E:/Documents/Obsidian_/Cpp"
export NODE_PATH="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules"
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe"
SCRIPT="E:/Documents/Obsidian/Templates/scripts/ACGbangumi-cli.cjs"
```

## 子命令

### search — 搜索作品（返回 JSON 供大模型选择）

```bash
$NODE $SCRIPT search --name <关键词> [--type anime|book|game|all] [--json]
```

- 输出 JSON：`{ ok, count, results: [{ title, type, link, info }] }`
- `info` 含「播出日期 / 监督 / 原作 / 角色设计」，用于核对季度与译名

### add — 抓取详情并生成笔记

```bash
$NODE $SCRIPT add --url https://bgm.tv/subject/<ID> --type anime --vault "E:/Documents/Obsidian"
```

常用参数：

| 参数                       | 说明                                                  |
| -------------------------- | ----------------------------------------------------- |
| `--url`                    | 详情页 URL（最稳，推荐 search 后 add --url）          |
| `--name`                   | 按名称搜索并取第 `--index` 条（默认 0）               |
| `--type`                   | `anime` / `book`·`manga` / `game`                     |
| `--vault`                  | **必传** `"E:/Documents/Obsidian"`，否则模板路径错误  |
| `--score`                  | 评分（1.0–10.0，不传则 null）                         |
| `--tags`                   | 自定义标签（逗号分隔，覆盖默认抓取标签）              |
| `--state`                  | 状态，默认「想看⏰」；其它如「在看📖」「看过🎉」「搁置」 |
| `--media`                  | 本地类型（online/offline 等）                         |
| `--subgroup` / `--sublang` | 字幕组 / 字幕语言                                     |
| `--category`               | 改编类别                                              |
| `--dry-run`                | 预览不写文件                                          |
| `--json`                   | 输出 JSON                                             |
| `--proxy`                  | 显式指定代理（默认自动读 env）                        |

## 输出路径约定

- 笔记目录：`E:/Documents/Obsidian/Projects/anime/`（manga→`manga/`，game→`game/`）
- 文件名 = 作品中文名（非法字符被替换为空格）
- 模板：`E:/Documents/Obsidian/Templates/T-动画.md`（漫画/游戏对应 T-漫画.md / T-游戏.md）

## 类型映射

| type         | cat  | 模板      | 目录           | 状态默认 |
| ------------ | ---- | --------- | -------------- | -------- |
| anime        | 2    | T-动画.md | Projects/anime | 想看⏰    |
| book / manga | 1    | T-漫画.md | Projects/manga | 想看⏰    |
| game         | 4    | T-游戏.md | Projects/game  | 想玩⏰    |
