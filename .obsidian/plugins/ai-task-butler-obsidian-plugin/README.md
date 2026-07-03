# AI Task Butler for Obsidian

AI Task Butler 是一个 Obsidian Tasks 辅助插件原型。它把自然语言任务转换成 Obsidian Tasks 兼容的 Markdown，并追加到任务 Inbox。

## 当前能力

- 命令面板：`AI Task Butler: Capture AI task`
- 命令面板：`AI Task Butler: Quick voice task`
- 编辑器命令：把选中文本或当前行捕获为任务
- 命令面板：`AI Task Butler: Insert today task dashboard`
- 命令面板：`AI Task Butler: Test AI task parser`
- 捕获弹窗内支持 `语音输入` 按钮；可使用 Web Speech、OpenAI 转写或阿里云 Qwen-ASR
- 可选 OpenAI-compatible AI 解析；未配置或失败时自动使用离线规则解析
- 默认写入：`Tasks/Inbox.md`
- 支持 Tasks Emoji Format：
  - `⏳ YYYY-MM-DD` 计划日期
  - `📅 YYYY-MM-DD` 截止日期
  - `🛫 YYYY-MM-DD` 开始日期
  - `➕ YYYY-MM-DD` 创建日期
  - `🔺 ⏫ 🔼 🔽 ⏬` 优先级
- 支持稳定块 ID：`^task-*`
- 支持轻量提醒：任务行包含 `⏰ YYYY-MM-DD HH:mm` 时，Obsidian 打开期间会弹出提醒
- 命令面板：`AI Task Butler: Scan due reminders now`
- 命令面板：`AI Task Butler: Test reminder notification`

## 安装

1. 在 Obsidian vault 中创建插件目录：
   `.obsidian/plugins/ai-task-butler/`
2. 把本目录里的文件复制进去：
   - `manifest.json`
   - `main.js`
   - `styles.css`
3. 重启 Obsidian，或在 Community plugins 页面刷新插件列表。
4. 启用 `AI Task Butler`。

## 使用示例

输入：

```text
明天下午三点提醒我给张三发合同，很重要 #work
```

生成：

```markdown
- [ ] 给张三发合同 #work ⏫ ⏳ 2026-07-01 ⏰ 2026-07-01 15:00 ➕ 2026-06-30 ^task-20260630-a1b2c3d4
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

## 提醒说明

当前版本的提醒是插件内轻量实现：

- `⏰ YYYY-MM-DD HH:mm` 不是 Obsidian Tasks 原生闹铃语法，而是 AI Task Butler 自己识别的提醒标记
- 只扫描设置里的 Inbox 文件，默认是 `Tasks/Inbox.md`
- 你可以在插件设置里把 `Inbox path` 改成任意 Markdown 文件，例如 `Daily/Task Inbox.md`
- 只提醒未完成任务：`- [ ]`
- 只在 Obsidian 打开时运行
- 会弹出 Obsidian Notice，并尽量调用系统 Notification
- 未来可以替换成本地后台服务，实现 Obsidian 关闭后仍提醒

如果想测试提醒是否工作：

1. 运行命令 `AI Task Butler: Test reminder notification`
2. 或创建一条当前时间之前、24 小时内的未完成任务：

```markdown
- [ ] 测试提醒 #task ⏰ 2026-06-30 15:00
```

3. 确认这条任务在设置里的 Inbox 文件中
4. 运行命令 `AI Task Butler: Scan due reminders now`

如果任务时间还没到，例如 `⏰ 2026-07-01 15:00`，插件不会提前提醒。

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

- 加桌面通知调度服务。
- 加 MCP adapter，让其他 AI 客户端也能调用捕获、查询、改期和完成任务。
- 支持语音输入。
