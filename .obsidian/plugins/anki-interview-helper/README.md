# Anki Interview Helper

优化在 Obsidian 中创建面试 Anki 卡片的流程，配合 [Obsidian to Anki](https://github.com/Pseudonium/Obsidian_to_Anki) 使用。本插件负责「生成」与「生命周期管理」，同步仍由 Obsidian to Anki 完成。

## 功能

### 新建面试题卡片（主流程）

点 Ribbon 图标（图层样式）或命令面板运行「新建面试题卡片」：

1. **选 Deck**：输入关键词模糊搜索历史 Deck（按匹配度 > 未归档优先 > 最近使用排序）；也可直接输入新名称创建新 Deck
2. **输入原始题目**：三种方式可混合使用，内容均可再编辑
   - 直接粘贴面试原话 / 复述 / 补充上下文
   - 点击「选择文件…」用 Obsidian 模糊搜索选取 vault 中的文件，内容自动读入（可反复选择叠加多个文件，来源以标签展示，点 ✕ 移除对应内容）
   - 点击「读取当前页面」把当前激活文件的内容读入；也可在设置中开启「打开向导时自动读取当前文件」
3. **生成卡片**：LLM 自动转换为 `{Q}题面{A}答案{E}` 格式（答案支持 Markdown）
4. **预览编辑**：转换结果可人工修正
5. **确认写入**：卡片追加到 Deck 文件（一个文件 = 一个 Deck，含 `Deck:` 头），并自动打开该文件

### 从当前文件生成卡片

命令面板运行「新建面试题卡片（读取当前文件）」，打开向导并自动读入当前激活文件的内容，适合「正在看某个笔记，顺手转卡片」的场景。

### 扫描回填 Deck 注册表

命令面板运行「扫描回填 Deck 注册表」，遍历 vault 读取文件头部 Deck 标记行（`Deck:` 或历史 `TARGET DECK:` 均识别），把历史 Deck 导入注册表，供模糊搜索补全。归档目录内的文件自动标记为已归档。

## 卡片格式

```
Deck: 牌组名

{Q}光纤传输系统的组成部分有哪些？{A}光发射机、光中继器、光纤、光接收机{E}
{Q}光纤传输的优势有哪些？{A}**传输距离长**、信息容量大、抗电磁干扰能力强{E}
```

对应 Obsidian to Anki 的 Custom Regexp：`\{Q\}([\s\S]+?)(?:\s*\n)?\{A\}([\s\S]+?)\{E\}`

> 本插件生成 `Deck:` 头部。Obsidian to Anki 默认识别 `TARGET DECK:`，请在其设置中把 Deck 标记字符串改为 `Deck`（或保持 `TARGET DECK` 并只对历史文件使用）。

## 配置

| 设置 | 说明 | 默认值 |
|---|---|---|
| 题目根目录 | 所有 Deck 文件平铺存放的目录 | `Anki` |
| 归档目录 | 已掌握题目归档位置 | `Anki/Archive` |
| 打开向导时自动读取当前文件 | 开启后打开向导即读入当前激活文件 | 关 |
| Base URL | OpenAI 兼容 API 地址 | 空 |
| API Key | 留空表示无需鉴权 | 空 |
| 模型名 | 如 deepseek-chat | 空 |
| System Prompt | 卡片转换指令，可编辑 | 内置默认 |

**重要**：请将设置页显示的忽略 glob（默认 `Anki/Archive/**`）添加到 Obsidian to Anki 的忽略列表（设置 → Ignore Files and Folders），使归档目录退出同步。

## 安装与开发

```bash
npm install
npm run dev      # 监听模式，输出到 main.js
npm run build    # 类型检查 + 生产构建
```

将本目录（含 `main.js`、`manifest.json`、`styles.css`）复制到测试 vault 的 `.obsidian/plugins/anki-interview-helper/`，在「第三方插件」中启用。

## 规划

- 第一期（当前）：主流程向导、Deck 注册表、扫描回填、设置页
- 第二期：归档命令（整 Deck 归档 + 光标定位单卡归档）、注册表管理界面
