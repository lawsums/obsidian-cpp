# AI Task Butler for Obsidian

AI Task Butler 是一个 Obsidian Tasks 辅助插件原型。它把自然语言任务转换成 Obsidian Tasks 兼容的 Markdown，并追加到任务 Inbox。

## 当前能力

- 命令面板：`AI Task Butler: Capture AI task`
- 编辑器命令：把选中文本或当前行捕获为任务
- 命令面板：`AI Task Butler: Insert today task dashboard`
- 捕获弹窗内支持 `语音输入` 按钮；如果当前 Obsidian/Electron 环境不支持 Web Speech，会提示改用文本输入
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

## AI 解析配置

默认情况下插件使用内置离线规则解析，不需要 API Key。

如果要启用真正的 AI 解析：

1. 打开 Obsidian Settings
2. 找到 `AI Task Butler`
3. 把 `AI provider` 改成 `OpenAI-compatible`
4. 填写：
   - `AI endpoint`
   - `AI model`
   - `AI API key`

默认 endpoint 是：

```text
https://api.openai.com/v1/chat/completions
```

插件会要求模型返回严格 JSON，再转换成 Tasks Markdown。AI 请求失败、返回格式错误或 API Key 为空时，会自动回退到离线规则解析，不会阻断任务录入。

注意：API Key 会保存在 Obsidian 本地插件设置里。不要把 `.obsidian/plugins/ai-task-butler/data.json` 分享给别人。

## 提醒说明

当前版本的提醒是插件内轻量实现：

- 只扫描设置里的 Inbox 文件，默认是 `Tasks/Inbox.md`
- 只提醒未完成任务：`- [ ]`
- 只在 Obsidian 打开时运行
- 会弹出 Obsidian Notice，并尽量调用系统 Notification
- 未来可以替换成本地后台服务，实现 Obsidian 关闭后仍提醒

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
