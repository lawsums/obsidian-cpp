# fetch-game CLI — Agent 调用协议（RAWG 游戏）

## 调用方式

```bash
# 推荐（批处理包装器，兼容性最好）：
fetch-game.cmd search --name "游戏名" --json
fetch-game.cmd add --name "游戏名" --score 8.5 --status 想玩💭

# 或直接用 node：
node "E:/Documents/Obsidian/Templates/fetch-game-cli.cjs" search --name "游戏名" --json
node "E:/Documents/Obsidian/Templates/fetch-game-cli.cjs" add --name "游戏名" --score 8.5
```

> 脚本在 `E:/Documents/Obsidian/Templates/fetch-game-cli.cjs`。
> API Key 自动从 `rawg-config.json` 读取；也可用环境变量 `RAWG_API_KEY` 或 `--api-key` 参数。

---

## 命令速查

### 1. 搜索

```bash
fetch-game.cmd search --name "关键词" --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--name` | ✅ | 搜索关键词（英文效果更好） |
| `--json` | ❌ | JSON 输出 |

返回数组，每项含 `title` `slug` `year` `rating` `platforms`。

### 2. 生成笔记

```bash
fetch-game.cmd add --name "Elden Ring" --score 9.5 --status 已通关🎮
```

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `--name` | ✅ | — | 搜索关键词 |
| `--index` | ❌ | 0 | 搜索结果的第 N 条 |
| `--score` | ❌ | — | 个人评分 (0–10) |
| `--status` | ❌ | 想玩💭 | 状态编号(1-4)或标签(已通关🎮/在玩🕹️/想玩💭/搁置⏸️) |
| `--chinese-name` | ❌ | 英文原名 | 中文名 |
| `--playtime` | ❌ | RAWG 数据 | 游玩时长 |
| `--api-key` | ❌ | 自动 | RAWG API Key |
| `--folder` | ❌ | auto | 输出文件夹 |
| `--filename` | ❌ | 游戏名 | 文件名 |
| `--out` | ❌ | — | 完整输出路径 |
| `--dry-run` | ❌ | — | 只打印不写文件 |
| `--json` | ❌ | — | JSON 输出 |
| `--proxy` | ❌ | 自动 | 代理 URL |

### 游玩状态对照表

| 编号 | 标签 | 说明 |
|------|------|------|
| 1 | 已通关🎮 | 已通关 |
| 2 | 在玩🕹️ | 正在进行 |
| 3 | 想玩💭 | 打算游玩（默认） |
| 4 | 搁置⏸️ | 暂时搁置 |

> 传编号或标签均等效：`--status 1` = `--status 已通关🎮`

---

## 标准操作流程

```
1. 搜索
   fetch-game.cmd search --name "Elden Ring" --json
   → [{title:"Elden Ring", slug:"elden-ring", year:"2022", rating:4.38, platforms:"PC, PS5, ..."}]

2. 生成笔记
   fetch-game.cmd add --name "Elden Ring" --score 10.0 --status 已通关🎮
   → E:\Documents\Obsidian_\Cpp\Projects\game\Elden Ring.md
```

---

## 输出

默认输出到 `E:/Documents/Obsidian_/Cpp/Projects/game/<游戏名>.md`，生成 frontmatter + 「基本信息」表格的 Obsidian 笔记格式。

## 依赖

零外部依赖，仅需 Node.js 和 RAWG API Key（免费注册 https://rawg.io/apidocs）。
