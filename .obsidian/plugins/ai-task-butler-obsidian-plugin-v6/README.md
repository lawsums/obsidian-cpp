# AI Task Butler for Obsidian

AI Task Butler 是一个 Obsidian Tasks 辅助插件原型。它把自然语言任务转换成 Obsidian Tasks 兼容的 Markdown，并追加到任务 Inbox。

## 当前能力

- 命令面板：`AI Task Butler: Capture AI task`
- 命令面板：`AI Task Butler: Quick voice task`
- 编辑器命令：把选中文本或当前行捕获为任务
- 命令面板：`AI Task Butler: Insert today task dashboard`
- 命令面板：`AI Task Butler: Test AI task parser`
- 右侧边栏：`AI Task Butler: Open Task Butler navigation`，默认只显示今天任务
- 导航栏支持自定义起止日期、前后移动日期范围、未来 7 天、显示已完成任务
- 导航栏内可勾选完成；右键任务行可推迟计划日期、调用 Tasks 插件编辑、跳转原文、复制任务内容或切换完成
- 捕获弹窗内支持 `语音输入` 按钮；可使用 Web Speech、OpenAI 转写或阿里云 Qwen-ASR
- 可选 OpenAI-compatible AI 解析；未配置或失败时自动使用离线规则解析
- 默认写入：`Tasks/Inbox.md`
- 支持 Tasks Emoji Format：
  - `⏳ YYYY-MM-DD` 计划日期
  - `🛫 YYYY-MM-DD` 开始日期
  - 新建任务不生成 `📅` 截止日期，避免影响“推迟一天”后的今天分组
  - `➕ YYYY-MM-DD` 创建日期
  - `🔁 every day` 每日循环
  - `🔺 ⏫ 🔼 🔽 ⏬` 优先级
- 支持稳定块 ID：`^task-*`
- 新建任务只写入 Obsidian Tasks 可识别的元数据，不再写入私有闹铃标记

## 安装

1. 在 Obsidian vault 中创建插件目录：
   `.obsidian/plugins/ai-task-butler/`
2. 把本目录里的文件复制进去：
   - `manifest.json`
   - `main.js`
   - `styles.css`
3. 重启 Obsidian，或在 Community plugins 页面刷新插件列表。
4. 启用 `AI Task Butler`。

## 任务导航栏

点击左侧功能区新增的任务列表图标，或在命令面板运行 `AI Task Butler: Open Task Butler navigation`，即可在右侧打开可停靠的 Task Butler 导航栏。

- **默认范围**：今天至今天；避免一次读取整个任务历史造成侧边栏卡顿。
- **指定天数**：直接选择开始和结束日期；也可使用 `‹`、`›` 前后平移当前范围，或一键切换为“今天”“未来 7 天”。
- **筛选规则**：显示计划日期 `⏳` 或开始日期 `🛫` 落在范围内的任务；每日循环任务从其起始计划日期开始，后续日期范围也会出现。
- **修改任务**：勾选复选框即可切换完成状态。其他编辑功能集中在右键菜单中：
  - **推迟计划日期**：把任务直接调度到今天 / 明天 / 下周，或相对当前日期推迟 1 天 / 1 周，或一键清除计划日期。改写走的是 updateTask({ scheduledDate })，与 Tasks 插件的 `⏳` 字段一致。如果你已经在使用 Obsidian Tasks 的 `Tasks: Postpone` 按钮，它会看到一样的字段。
  - **用 Tasks 插件编辑**：把光标选到任务行（用 setSelection 全选整行以确保 activeEditor 同步），然后调用 `Tasks: Create or edit task` 命令，享受 Obsidian Tasks 的日期、循环、标签等富编辑能力。**如果当前激活的编辑器已经在任务所在文件上，插件不会重复打开它**，不会新开 split，也不会切换 leaf；只有在当前视图不是该文件时，才会在当前活动 leaf 中覆盖打开（仍不会新开分栏）。插件会按顺序尝试 `obsidian-tasks-plugin:edit-task`（Tasks ≥ 7）和 `tasks:edit-task`（旧版兼容）这两个命令 ID，并在命令未找到时扫描 `app.commands.listCommands()` 给出提示。如果 activeEditor 仍未切换到目标视图，会提示用户先手动点击目标笔记。需要先安装 [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 插件；若仍未找到命令，菜单项会显示为禁用。
  - **打开原文**：在主编辑区打开任务所在笔记，并把光标定位到任务行（也会触发 setActiveLeaf）。
  - **复制任务内容**：把整行任务原文写入系统剪贴板，方便贴到其他地方再改。
  - **标记为完成 / 取消完成**：等价于复选框切换，可在不点击 checkbox 的情境下使用。
- **完成 / 未完成 筛选**：`仅显示已完成` 是一个互斥开关 —— 关闭（默认）只显示未完成的任务，开启则**只显示已完成**的任务（不再同时显示两类，方便快速定位误勾的并撤回）。两种模式下都只读取当前日期范围内的任务，因此缩短日期范围（例如改成今天）可以进一步聚焦到"今天"误勾的项。
- **链接 / 标签可点**：任务标题用 Obsidian 内置的 `MarkdownRenderer` 渲染，所以 `[[wikilink]]`、`[外部链接](url)`、`obsidian://` 协议、行内 `` `code` ``、`**强调**` 与 `#tag` 在导航栏里会显示成原生可点击元素，行为与在 Markdown 视图里一致（hover 预览、点击跳转）。渲染绑定到视图级 `Component`，`render()` 重新绘制或 view 关闭时统一卸载，不会泄漏监听。
- **刷新机制**：导航栏**不监听** vault 的每次修改（写普通笔记不会触发刷新），只在明确的时间点刷新：
  1. 调用 Tasks 插件命令时（如 `Tasks: Create or edit task`、Tasks 的 toggle 命令等；通过挂钩 `app.commands.executeCommandById` 实现，插件禁用/卸载时自动还原）；
  2. 在导航栏勾选 / 取消勾选任务完成时（`updateTask` 内部触发）；
  3. 推迟 / 清除计划日期时（`rescheduleTask` / `shiftScheduledDate` 都走 `updateTask`）；
  4. 切换（聚焦）到 Task Butler 侧边栏时（监听 `active-leaf-change`）；
  5. 点击 "刷新" / "新增" 按钮时；采集窗口写入 Inbox 成功后也会自动刷新。

> 导航栏扫描 vault 内所有 Markdown 任务，而不局限于 `Tasks/Inbox.md`。为了避免误写，更新时优先使用 `^task-*` 块 ID 定位；没有块 ID 时会校验原始任务行，若任务已经被其他编辑操作移动或修改，会提示先刷新后重试。

## 使用示例

输入：

```text
明天下午三点提醒我给张三发合同，很重要 #work
```

生成：

```markdown
- [ ] 给张三发合同 #work ⏫ ⏳ 2026-07-01 ➕ 2026-06-30 ^task-20260630-a1b2c3d4
```

在 `Capture AI task` 弹窗中，按 `Enter` 会直接解析并导入 Inbox；需要换行时按 `Shift+Enter`。快捷键只修改弹窗草稿状态，允许先组合优先级与日期、最后再按 Enter 创建：

- `Ctrl+U/H/M/L`：选择最高、高、中、低优先级；再次按同一优先级会恢复为自动判断。
- `Ctrl+Y/T/R`：计划为今天、明天、后天。
- `Ctrl+1` 到 `Ctrl+7`：计划为从今天起最近到来的周一至周日。
- `Ctrl+D`：打开日期选择器，指定任意计划日期；状态栏的“清除”可恢复自动判断。

如需让双链、网址、命令、文件路径或专有文本不被 AI 和本地规则改写，可用反引号包裹。反引号只用于输入保护，不会写入最终任务：

```text
明天整理 `[[项目文档]] https://example.com/a?id=123`
```

会保留为：

```markdown
- [ ] 整理 [[项目文档]] https://example.com/a?id=123 #task ⏳ 2026-07-01
```

循环任务示例：

```text
以后每天晚上提醒我复盘
```

生成：

```markdown
- [ ] 复盘 #task ⏳ 2026-07-06 🔁 every day ➕ 2026-07-06
```

## 快速语音任务

运行命令：

```text
AI Task Butler: Quick voice task
```

流程：

1. 弹窗打开后自动开始录音
2. 检测到人声后继续听
3. 人声平息约 1 秒后自动停止
4. 调用当前配置的 OpenAI 或阿里云转写接口
5. 自动解析成任务并显示预览
6. 按 `Enter` 导入 Inbox
7. 按 `r` 重新录音

这个命令不使用 Web Speech。请先在 `Voice transcription` 里选择：

- `OpenAI gpt-4o-mini-transcribe`
- 或 `Alibaba Qwen-ASR`

并填写对应 API Key。

## AI 任务解析配置

默认情况下插件使用内置离线规则解析，不需要 API Key。

如果要启用真正的 AI 任务转译：

1. 打开 Obsidian Settings
2. 找到 `AI Task Butler`
3. 把 `AI provider` 改成 `OpenAI`、`Alibaba Qwen` 或 `Custom OpenAI-compatible`
4. 填写对应 endpoint、model 和 API key

### OpenAI 任务解析

```text
AI provider: OpenAI
OpenAI task endpoint: https://api.openai.com/v1/chat/completions
OpenAI task model: gpt-4.1-mini
OpenAI task API key: 你的 OpenAI API Key
```

### 阿里云/通义千问任务解析

```text
AI provider: Alibaba Qwen
Alibaba Qwen task endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
Alibaba Qwen task model: qwen-plus
Alibaba Qwen task API key: 你的 DashScope API Key
```

### 自定义 OpenAI-compatible

例如 DeepSeek 或其他兼容 Chat Completions 的模型：

```text
AI provider: Custom OpenAI-compatible
AI endpoint: 对方的 chat completions endpoint
AI model: 对方的模型名
AI API key: 对方的 API Key
```

插件会要求模型返回严格 JSON，再转换成 Tasks Markdown。AI 请求失败、返回格式错误或 API Key 为空时，会自动回退到离线规则解析，不会阻断任务录入。

AI 解析会识别 `每天`、`每日`、`以后每天`、`天天` 等表达，并输出 `recurrence: "every day"`，最终生成 Obsidian Tasks 循环语法 `🔁 every day`。

测试配置：

```text
AI Task Butler: Test AI task parser
```

这个命令会用当前配置解析一条示例任务，并用 Notice 展示生成的 Tasks Markdown。

注意：API Key 会保存在 Obsidian 本地插件设置里。不要把 `.obsidian/plugins/ai-task-butler/data.json` 分享给别人。

## 语音转文字配置

打开 Obsidian Settings -> `AI Task Butler` -> `Voice transcription`。

### OpenAI 转写

选择：

```text
Transcription provider: OpenAI gpt-4o-mini-transcribe
OpenAI transcription endpoint: https://api.openai.com/v1/audio/transcriptions
OpenAI transcription model: gpt-4o-mini-transcribe
OpenAI transcription API key: 你的 OpenAI API Key
```

插件会录制一段音频，停止后用 multipart form-data 上传到 OpenAI 转写接口，读取响应里的 `text`。

### 阿里云 Qwen-ASR

选择：

```text
Transcription provider: Alibaba Qwen-ASR
Alibaba transcription endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
Alibaba transcription model: qwen3-asr-flash
Alibaba transcription API key: 你的 DashScope API Key
```

插件会录制一段音频，停止后把音频转成 base64 data URL，发送给阿里云 OpenAI-compatible chat completions 接口，并读取模型返回的转写文本。

如果出现 `Request failed, status 400`：

- 确认 provider 选的是 `Alibaba Qwen-ASR`
- 确认 API Key 是 DashScope/百炼 API Key
- 确认 endpoint 与区域匹配；中国北京默认是 `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- 确认模型名是 `qwen3-asr-flash`
- 录音不要太短，建议至少 1 秒以上
- 更新到当前插件版本；旧版本曾把额外 text 内容和 format 字段一起发给阿里云，容易触发 400

OpenAI 如果出现 400，优先检查 endpoint 是否是 `/v1/audio/transcriptions`、模型名是否是 `gpt-4o-mini-transcribe`，以及录音是否为空。

### 推荐组合

```text
语音转文字：OpenAI gpt-4o-mini-transcribe 或 阿里云 qwen3-asr-flash
任务理解：OpenAI / 通义千问 / DeepSeek / OpenAI-compatible 文本模型
任务保存：Obsidian Tasks Markdown
```

DeepSeek 可以继续负责“把文字解析成任务”，但它本身不负责语音转文字。

## Tasks 兼容性

当前版本不会写入插件私有的 `⏰ YYYY-MM-DD HH:mm` 标记，也不会扫描或改写已有任务。新建任务只使用 Obsidian Tasks 的开始日期、计划日期、循环、优先级、标签与完成状态格式，因此可继续被 Tasks 插件查询、展示和推迟。

新建任务不生成 `📅` 截止日期。对于“周五前交报告”“截止周三”等表达，插件会将日期作为计划日期写入 `⏳`，使 Tasks 的“推迟一天”操作能直接移动主页中的今天分组。

历史笔记中已有的 `⏰` 或 `📅` 文本不会被本版本自动修改；如需清理，应先备份后再单独处理。

## 语音输入故障排查

如果 `Transcription provider` 选择 `Web Speech`，插件会使用 Obsidian/Electron 内置的 Web Speech 能力，不同系统和 Obsidian 版本支持程度不一样。

如果点击后立刻失败，常见原因是：

- Obsidian 没有麦克风权限
- 系统没有可用输入设备
- 当前 Electron 环境不支持 Web Speech
- Web Speech 服务网络不可用
- 点击后太久没有说话，触发 `no-speech`

插件会尽量显示具体错误。若你的 Obsidian 桌面环境不支持 Web Speech，请改用 OpenAI 或阿里云转写提供商。

## 建议搭配的 Daily Note 查询

可以在任意笔记中运行命令：

```text
AI Task Butler: Insert today task dashboard
```

它会插入以下 Tasks 查询块：

```tasks
not done
happens on today
sort by priority
sort by due
```

```tasks
not done
due before today
sort by due
sort by priority
```

```tasks
not done
priority is above medium
sort by due
```

## 下一步

- 如需提醒，采用“任务正文与提醒元数据分离”的方案：任务行保持标准 Tasks 格式，提醒计划单独保存在插件数据中。
- 加 MCP adapter，让其他 AI 客户端也能调用捕获、查询、改期和完成任务。
- 支持语音输入。
