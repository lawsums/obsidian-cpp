# Obsidian 仓库目录重构影响面分析

> 扫描时间: 2026-08-01
> 仓库路径: `E:/Documents/Obsidian_/Cpp`

## 当前顶层文件夹

| 文件夹 | 类型 |
|--------|------|
| `100-学习` | 已有序号命名 |
| `Attachments` | 英文 |
| `Clippings` | 英文 |
| `Configs` | 英文 |
| `Dairies` | 英文 |
| `Excalidraw` | 英文 |
| `Leetcode` | 英文 |
| `Pandoc` | 英文 |
| `Plugins` | 英文 |
| `Projects` | 英文 |
| `Software` | 英文 |
| `Tasks` | 英文 |
| `Temp` | 英文 |
| `Templates` | 英文 |
| `Vocabulary` | 英文 |
| `代码模版` | 中文 |
| `八股文` | 中文 |
| `操作系统` | 中文 |
| `数据结构` | 中文 |
| `网络技术` | 中文 |
| `论文` | 中文 |
| `设计模式` | 中文 |
| `语言特性` | 中文 |
| `项目` | 中文 |

---

## 一、Obsidian 核心设置（必须手动修改）

### 1. `.obsidian/app.json`
```json
"attachmentFolderPath": "Attachments"
```
**影响**: 附件存放目录。如果重命名 `Attachments` 文件夹，必须同步修改此值，否则新附件会创建到错误位置。

### 2. `.obsidian/daily-notes.json`
```json
"template": "Templates/Daily_note_template",
"folder": "Dairies"
```
**影响**: 日记功能。`folder` 控制日记创建位置，`template` 指向日记模板。重命名 `Dairies` 或 `Templates` 后必须同步修改。

### 3. `.obsidian/templates.json`
```json
"folder": "Templates"
```
**影响**: 核心模板插件。控制模板插入功能的模板搜索目录。重命名 `Templates` 后必须修改。

### 4. `.obsidian/workspace.json` 和 `.obsidian/workspaces.json`
- 包含大量打开文件的路径（如 `Templates/Homepage/Homepage.md`、`Leetcode/算法路线图.md`、`Dairies/2026-08-01.md` 等）
- 侧边栏展开的文件夹路径（如 `项目/嵌入式/FreeRTOS快速入门`）

**影响**: 重命名后，当前打开的标签页和侧边栏状态会失效。
**风险**: **低**。Obsidian 重新打开时会自动重建 workspace，不会崩溃，只是之前的标签页会丢失。

---

## 二、插件配置（必须手动修改）

### 5. `templater-obsidian/data.json`
```json
"templates_folder": "Templates",
"user_scripts_folder": "Templates/scripts"
```
**影响**: Templater 的模板目录和用户脚本目录。重命名 `Templates` 后必须修改，否则 Templater 无法找到模板和脚本。

### 6. `quickadd/data.json` （重灾区，30+ 处引用）

| 配置项 | 引用路径 |
|--------|----------|
| Add_Word_Auto → templatePath | `Templates/Word_Template.md.md` |
| Add_Word_Auto → fileNameFormat | `Vocabulary/{{VALUE:Word}}-{{DATE:YYYYMMDDHHmmss}}` |
| AddWord macro → script path | `Templates/AddWord.js` |
| Mandala → template | `Templates/Mandala_template.md` |
| Code_Snip → templatePath | `Templates/Snippet_code_template.md` |
| Code_Snip → fileNameFormat | `Clippings/{{date}}-{{value}}` |
| Content_Snip → templatePath | `Templates/Snippet_content_template.md` |
| Content_Snip → fileNameFormat | `Clippings/{{date}}-{{value}}` |
| 不定期任务 → captureTo | `Templates/Homepage/003_不定期任务.md` |
| 稍后再看 → captureTo | `Templates/Homepage/002_稍后再看.md` |
| 闪念 → captureTo | `Templates/Homepage/004_闪念.md` |
| 影视动画 → captureTo | `Templates/Homepage/006_影视作品.md` |
| 歌单 → captureTo | `Templates/Homepage/005_KTV歌单.md` |
| 项目 → captureTo | `Templates/Homepage/001_项目.md` |
| 书籍 → captureTo | `Templates/Homepage/007_书籍.md` |
| 生活 → captureTo | `Templates/Homepage/008_生活.md` |
| 游戏 → captureTo | `Templates/Homepage/009_游戏.md` |
| Task_to_today → captureTo | `Dairies/{{DATE:}}` |
| Task_to_tomorrow → captureTo | `Dairies/{{DATE:+1}}` |
| Task_to_afterday → captureTo | `Dairies/{{DATE:+2}}` |
| Task_to_selected_day → captureTo | `Dairies/{{VALUE:日期}}` |
| Create_t ~ Create_t7 → captureTo | `Dairies/{{DATE:+N}}` (共7个) |
| 日记模版 → templatePath | `Templates/Daily_note_template.md` |
| No_anki_problem → folders | `["Leetcode"]` |
| Vip_anki_problem → folders | `["Leetcode/会员题"]` |
| Anki_problem → folders | `["Leetcode"]` |
| Anki_Leetcode_hot100 → captureTo | `数据结构/{{value}}` |
| Anki_Leetcode_hot100 → format | 含 `数据结构/{{value}}.cpp` |
| Anki_Leetcode_hot100 → template | `Templates/Anki_leetcode.md` |
| Anki_interview → folders | `["操作系统"]` |
| Anki_interview → templatePath | `Templates/Interview_template.md` |
| Bangumi游戏 → templatePath | `Templates/T-游戏.md` |
| Bangumi游戏 → fileNameFormat | `Projects/game/{{VALUE:CN}}` |
| Bangumi漫画 → templatePath | `Templates/T-漫画.md` |
| Bangumi漫画 → fileNameFormat | `Projects/manga/{{VALUE:CN}}` |
| Bangumi动画 → templatePath | `Templates/T-动画.md` |
| Bangumi动画 → fileNameFormat | `Projects/anime/{{VALUE:CN}}` |
| Bangumi macro → script path | `Templates/ACGbangumiv2.1.js` |
| Bangumi搜索 macro → script path | `Templates/scripts/ACGbangumiv2.1.js` |

**影响**: QuickAdd 是受影响最严重的插件。几乎所有 choice 都硬编码了文件夹路径。重命名任何相关文件夹后，对应的 QuickAdd 命令都会失效。

### 7. `obsidian-excalidraw-plugin/data.json`
```json
"folder": "Excalidraw",
"templateFilePath": "Templates/Excalidraw_template",
"scriptFolderPath": "Excalidraw/Scripts",
"fontAssetsPath": "Excalidraw/CJK_Fonts",
"experimantalFourthFont": "Excalidraw/Fonts/LXGWBrightGB-Regular.ttf"
```
**影响**: Excalidraw 的画板存放目录、模板路径、脚本路径、字体路径。重命名 `Excalidraw` 或 `Templates` 后必须全部修改。

### 8. `ai-task-butler-obsidian-plugin/data.json`
```json
"inboxPath": "Templates/Tasks.md"
```
**影响**: AI Task Butler 的任务收件箱文件路径。重命名 `Templates` 后必须修改。
**注意**: `data.json` 中还存储了已完成任务的历史路径（如 `Templates/Tasks.md:31:...`），这些是历史记录，不影响功能。

### 9. `obsidian-icon-folder/data.json`
文件夹图标映射，直接以文件夹名作为 key：
```json
"Plugins": "LiPuzzle",
"Leetcode": "LiFolderCode",
"Dairies": "LiCalendarDays",
"网络技术": "LiNetwork",
"Templates": "LiLayoutTemplate",
"Excalidraw": "LiPaintbrush",
"数据结构": "LiList",
"语言特性": "LiTableProperties",
"Vocabulary": "LiWholeWord",
"项目": "LiAppWindow",
"Software": "LiAppWindow",
"操作系统": "LiActivitySquare",
"代码模版": "LiClipboardEdit",
"设计模式": "LiSidebarToggleButtonIcon",
"Pandoc": "LiImport",
"Clippings": "LiClipboardX",
"Configs": "LiContainer",
"Attachments": "LiImages",
"Projects": "🈲",
"Temp": "LiRecycle",
"项目/数据库": "LiDatabase",
"论文": "LiNewspaper",
"八股文": "LiTextSearch",
"100-学习": "LiStars"
```
**影响**: 重命名文件夹后，图标映射的 key 会失配，文件夹图标会消失。需要更新所有 key。

### 10. `obsidian-douban-plugin/data.json`
```json
"movieTemplateFile": "Templates/番剧模板.md",
"bookTemplateFile": "Templates/番剧模板.md",
"musicTemplateFile": "Templates/番剧模板.md",
"noteTemplateFile": "Templates/番剧模板.md",
"gameTemplateFile": "Templates/番剧模板.md",
"teleplayTemplateFile": "Templates/番剧模板.md",
"attachmentPath": "Projects/assets"
```
**影响**: 豆瓣插件的模板路径和附件存放路径。重命名 `Templates` 或 `Projects` 后必须修改。

### 11. `obsidian-projects/data.json`
```json
"path": "Projects/anime"
"path": "Projects/manga"
"path": "Projects/game"
```
**影响**: Projects 插件的三个数据源分别指向 `Projects/` 下的子目录。重命名 `Projects` 后必须修改。

### 12. `obsidian-to-anki-plugin/data.json`
`FOLDER_DECKS` 字段包含 30+ 个文件夹到 Anki 牌组的映射：
```json
"FOLDER_DECKS": {
    "代码模版": "",
    "操作系统": "",
    "数据结构": "",
    "网络技术": "",
    "设计模式": "",
    "语言特性": "",
    "Configs": "",
    "Clippings": "",
    "Dairies": "",
    "Excalidraw": "",
    "Pandoc": "",
    "Leetcode": "",
    "Plugins": "",
    "Temp": "",
    "Templates": "",
    "Excalidraw/Fonts": "",
    "Vocabulary": "",
    ...
}
```
同时，`FILE_LINK_FIELDS` 和文件哈希映射中存储了大量以文件夹名开头的文件路径（如 `Dairies/2025-10-17.md`、`Clippings/如何科学刷题？.md`、`语言特性/预处理.md` 等）。

**影响**: `FOLDER_DECKS` 的 key 是文件夹名，重命名后映射失效（虽然值都是空字符串，目前未实际使用牌组分配）。文件哈希映射是历史记录，不影响功能。

### 13. `obsidian-pandoc/data.json`
```json
"pandoc": "F:\\Software\\Pandoc\\pandoc.exe",
"outputFolder": "E:\\Documents\\Obsidian\\Pandoc"
```
**影响**: `outputFolder` 指向另一个 vault `E:\Documents\Obsidian\Pandoc`（不是当前仓库的 `Pandoc` 文件夹）。如果你只重命名当前仓库的 `Pandoc` 文件夹，此设置不受影响。但如果这个路径是笔误，建议一并修正。

### 14. `edit-in-neovim/data.json`
```json
"pathToBinary": "E:\\Software\\Neovim\\bin\\nvim.exe"
```
**影响**: 不涉及仓库内文件夹，不受影响。

---

## 三、脚本文件（需手动更新）

### 15. `Templates/scripts/ACGbangumi-cli.cjs`
```javascript
// 行 1064: 模板路径
path.join(vaultRoot, 'Templates', tinfo.template)
// 行 1077: 输出路径
path.join(vaultRoot, 'Projects', tinfo.folder)
// 行 943: 帮助文本中引用了 Projects/anime、Projects/manga、Projects/game
```
**影响**: 硬编码了 `Templates` 和 `Projects` 文件夹名。重命名后脚本无法找到模板和输出目录。

### 16. `Templates/fetch-game.js`
```javascript
const OUTPUT_DIR = "E:/Documents/Obsidian_/Cpp/Projects/game"
```
**影响**: 硬编码了绝对路径。重命名 `Projects` 后必须修改。

### 17. `Templates/scripts/fetch-game-cli.cjs`
```javascript
const DEFAULT_OUTPUT_DIR = 'E:/Documents/Obsidian_/Cpp/Projects/game';
```
**影响**: 同上，硬编码了绝对路径。

### 18. `Templates/scripts/AddWord.js`
```javascript
const monthPath = `Vocabulary/${monthFile}`;
```
**影响**: 硬编码了 `Vocabulary` 文件夹名。重命名后单词文件会创建到错误位置。

### 19. `Templates/scripts/ACGbangumiv2.1.js`（原始脚本，勿改动）
根据 MEMORY.md 记录，此文件是原始 QuickAdd 版脚本，不应修改。但其内部逻辑通过 `executeChoice` 调用 QuickAdd choices，间接受 QuickAdd 配置影响。

---

## 四、笔记内查询（需搜索替换）

### 20. Dataview FROM 查询
```
数据结构/数据结构.md:  FROM "数据结构"
操作系统/操作系统.md:  FROM "操作系统"
```
**影响**: Dataview 查询中的 `FROM "文件夹名"` 不会自动跟随文件夹重命名。重命名后查询结果为空。

### 21. 其他可能的引用
还建议全局搜索以下模式，检查是否有遗漏：
- Dataview 查询: `FROM "旧文件夹名"`
- Templater 脚本中的 `app.vault.getAbstractFileByPath("旧路径")`
- 笔记中的 `[[旧路径/文件名]]` 形式的 wikilink（Obsidian 会自动更新这些链接，但建议验证）

---

## 五、不受影响的设置

| 设置 | 原因 |
|------|------|
| `graph.json` | 无路径过滤器/颜色组 |
| `core-plugins.json` | 只有插件启用状态 |
| `hotkeys.json` | 热键映射，不含路径 |
| `appearance.json` | 主题设置 |
| `community-plugins.json` | 插件列表 |
| `types.json` | 属性类型定义 |
| `bookmarks.json` | 不存在 |
| `obsidian-git/data.json` | Git 配置不含仓库内路径 |
| `obsidian-tasks-plugin/data.json` | 无硬编码文件夹路径 |
| `dataview/data.json` | 全局设置，无路径 |
| `workspaces-plus/data.json` | 只有工作区元数据 |

---

## 六、修改策略建议

### 推荐操作顺序

1. **关闭 Obsidian**（确保配置文件不会被覆盖）
2. **备份 `.obsidian` 目录**
3. **重命名文件夹**（在文件管理器中操作）
4. **批量修改配置文件**（用文本编辑器的查找替换功能）
5. **修改脚本文件**中的硬编码路径
6. **修改 Dataview 查询**
7. **重新打开 Obsidian** 验证

### 文件夹映射参考

建议在修改前先确定好新旧文件夹名的映射表，例如：

| 旧名 | 新名 |
|------|------|
| Attachments | 000-Attachments |
| Templates | 010-Templates |
| Dairies | 200-Dairies |
| ... | ... |

然后对每个旧名执行全局查找替换，确保不遗漏。

### 注意事项

- **Obsidian wikilink 自动更新**: Obsidian 的 `alwaysUpdateLinks: true` 设置会在 Obsidian 内重命名文件时自动更新链接。但如果你在 Obsidian 外部（文件管理器）重命名文件夹，链接不会自动更新。
- **建议在 Obsidian 内重命名**: 如果可能，直接在 Obsidian 的文件管理器中右键重命名文件夹，这样 wikilink 会自动更新。然后再手动修改 `.obsidian` 下的配置文件。
- **`.obsidian` 目录除外**: 配置文件中的路径引用必须手动修改，Obsidian 不会自动更新这些。
