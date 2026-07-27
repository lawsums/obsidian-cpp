# ACGbangumi CLI — Agent 调用协议

## 调用方式

```bash
# 推荐（批处理包装器，兼容性最好）：
ACGbangumi.cmd search --name "关键词" --type anime --json
ACGbangumi.cmd add --url <URL> --type anime --score 8.0

# 或直接用 node：
node "E:/Documents/Obsidian/Templates/ACGbangumi-cli.cjs" search --name "关键词" --type anime --json
node "E:/Documents/Obsidian/Templates/ACGbangumi-cli.cjs" add --url <URL> --type anime --score 8.0
```

> 脚本在 `E:/Documents/Obsidian/Templates/ACGbangumi-cli.cjs`（实际路径；工作区 `Cpp/Templates` 是符号链接指向这里）。

---

## 命令速查

### 1. 搜索

```bash
ACGbangumi.cmd search --name "作品名" --type anime|all --json
```

输出 JSON 数组，每项含 `title` `type` `link` `info`。

| 参数 | 必填 | 说明 |
|------|------|------|
| `--name` | ✅ | 搜索关键词 |
| `--type` | ❌ | `all` / `anime` / `book` / `game`，默认 all |
| `--json` | ❌ | JSON 输出；不加则人类可读格式 |

### 2. 抓取生成

```bash
# 方式 A：直接给详情页 URL（最稳）
ACGbangumi.cmd add --url https://bgm.tv/subject/329906 --type anime --score 8.5

# 方式 B：给名字，自动取搜索结果第 0 条
ACGbangumi.cmd add --name "间谍过家家" --type anime --score 8.5

# 方式 C：预览（不写文件，先看效果）
ACGbangumi.cmd add --url https://bgm.tv/subject/329906 --type anime --dry-run
```

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `--type` | ✅ | — | `anime` / `book` / `manga` / `game` |
| `--url` | 二选一 | — | Bangumi 详情页 URL |
| `--name` | 二选一 | — | 搜索关键词（自动取搜索结果 [0]） |
| `--index` | ❌ | 0 | 搭配 `--name`，选第 N 条结果 |
| `--score` | ❌ | null | 个人评分 (1.0–10.0) |
| `--tags` | ❌ | 全量标签 | 自定义标签，逗号分隔 |
| `--state` | ❌ | 想看⏰/想玩⏰ | 观看/游玩状态 |
| `--media` | ❌ | online/False | anime: online/720P… ; 漫画/游戏: False/True |
| `--subgroup` | ❌ | Online | 字幕组（仅 anime） |
| `--sublang` | ❌ | Online | 字幕语言（仅 anime） |
| `--category` | ❌ | 其它 | 改编类别（仅 anime） |
| `--folder` | ❌ | 自动 | 输出文件夹 |
| `--filename` | ❌ | 中文名 | 输出文件名（不含 .md） |
| `--out` | ❌ | — | 完整输出路径（覆盖 folder/filename） |
| `--dry-run` | ❌ | — | 只打印内容不写文件 |
| `--json` | ❌ | — | 输出 JSON |
| `--proxy` | ❌ | 自动探测 | 代理 URL；自动读 HTTP_PROXY/HTTPS_PROXY |

---

## 标准操作流程

### 典型流程：添加一部动画

```
1. 搜索 → 拿到 URL
   ACGbangumi.cmd search --name "进击的巨人" --type anime --json
   → 返回 [{title:"进击的巨人", type:"anime", link:"https://bgm.tv/subject/...", ...}]

2. 用 URL 生成笔记
   ACGbangumi.cmd add --url https://bgm.tv/subject/... --type anime --score 9.5

3. 输出 → 文件路径
   Projects/anime/进击的巨人.md
```

### 先预览再写入

```
# 预览
ACGbangumi.cmd add --url https://bgm.tv/subject/329906 --type anime --dry-run
→ 打印完整 markdown，不写文件

# 确认无误后写入（去掉 --dry-run，加 --score）
ACGbangumi.cmd add --url https://bgm.tv/subject/329906 --type anime --score 8.5
```

### 指定标签、字幕组

```
ACGbangumi.cmd add --url https://bgm.tv/subject/329906 --type anime --score 8.5 \
  --state "已看📘" \
  --tags "搞笑,日常,治愈" \
  --subgroup "喵萌奶茶屋" \
  --sublang "简日双语"
```

---

## 输出文件

默认输出到 vault 根目录的 `Projects/`：

| type | 文件夹 | 模板 | 文件名 |
|------|--------|------|--------|
| anime | `Projects/anime/` | T-动画.md | 中文名.md |
| book / manga | `Projects/manga/` | T-漫画.md | 中文名.md |
| game | `Projects/game/` | T-游戏.md | 中文名.md |

---

## 依赖

脚本只有一个外部依赖 **linkedom**，已装在 `C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/linkedom`。

HTTP 网络层零依赖（Node 内置模块），自动读取系统代理环境变量 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`。

`--help` 和 `search` 不需要 linkedom，只有 `add`（需要解析 HTML）才加载它。
