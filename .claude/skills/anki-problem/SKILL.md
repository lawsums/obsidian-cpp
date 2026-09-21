---
name: anki-problem
description: 触发 Obsidian QuickAdd 的 Anki_problem 指令，把一道 LeetCode 题抓成 Obsidian 笔记（Leetcode/<题号>.<中文标题>.md + 同名 .cpp + 题图）。当用户说"跑一下 Anki_problem""触发 Anki_problem""执行 Anki 题目指令""用 QuickAdd 建一道题""把这道题抓成笔记"或直接给出一个 leetcode.cn 链接要求建题时使用。注意：本 skill 只负责"触发那个 QuickAdd 指令"，笔记内容的二次整理走 leetcode-organizer。
---

# Anki_problem（触发 QuickAdd 建题指令）

把一个 LeetCode 中文站题目链接，变成 `Leetcode/` 下的题目笔记。**本质是代替用户在命令面板里点 `QuickAdd: Anki_problem`**，不是重新实现一遍抓题逻辑。

## 它到底做什么

QuickAdd 的 `Anki_problem` 是一个 **Template 类型** choice，模板是 `Templates/Leetcode_problem_template.md`。渲染时（Templater）依次：

1. 读**剪贴板**里的 URL（`tp.system.clipboard()`）
2. 调 `Templates/scripts/getLeetcodeProblem.js` → 请求 `https://leetcode.cn/graphql` 拿中英文题目数据
3. 把 `![...](url)` 的题图下载到 `assets/leetcode_imgs/<题号>_<原文件名>`
4. `tp.file.rename(<questionId>.<translatedTitle>)` 改名
5. 生成同名 `.cpp`（`#include <bits/stdc++.h>` + 官方 cpp codeSnippet）
6. 注入 nvim / VSCode 的 `button` 代码块

## 前置条件

| 依赖 | 要求 | 检查方式 |
| --- | --- | --- |
| `obsidian-advanced-uri` | 已启用（≥1.46.0） | `.obsidian/community-plugins.json` |
| `quickadd` | 已启用，choice 的 `command: true` | `.obsidian/plugins/quickadd/data.json` |
| Obsidian | 最好处于运行状态 | `Get-Process Obsidian` |
| 剪贴板 | `https://leetcode.cn/problems/<slug>/` | 脚本会校验 |

**命令 ID**：`quickadd:choice:7f2392c8-cda6-45e2-98ee-702bfff75a17`

> 这个 UUID 在 `data.json` 的 `choices → Anki相关 → Anki_problem` 里。如果哪天改了 choice 名字，ID 不变；**只在删除重建 choice 时才会变**——变了要同步更新脚本的 `-CommandId`。

## 用法

一条命令，脚本自己完成"校验链接 → 触发 → 轮询确认"：

```powershell
# 用剪贴板里的链接
powershell -NoProfile -File .claude/skills/anki-problem/fire-anki-problem.ps1

# 显式指定链接（脚本会帮你写进剪贴板，因为模板只读剪贴板）
powershell -NoProfile -File .claude/skills/anki-problem/fire-anki-problem.ps1 -Url "https://leetcode.cn/problems/two-sum/"

# 只发送、不等结果
powershell -NoProfile -File .claude/skills/anki-problem/fire-anki-problem.ps1 -NoWait
```

> 用 `powershell`（5.1），**不要用 `pwsh`** —— 本机没装 PowerShell 7，`pwsh` 会直接 CommandNotFound。
> 脚本只用 5.1 兼容语法（`[uri]::EscapeDataString` / `Get-Clipboard` / `-File`），两边都能跑。

退出码：`0` 成功（已确认新笔记落地），`1` 超时失败。

## 执行步骤（给 Claude）

1. **确定链接**：用户消息里给了 `leetcode.cn` 链接就传给 `-Url`；没给就用剪贴板（模板本来就是读剪贴板的）。
   - 如果用户给的是 **leetcode.com**，先转成中文站再传：`/problems/<slug>/` 部分一样，域名换成 `leetcode.cn`。
   - 如果链接不是 LeetCode 题目页（比如是题解页 `/solutions/...`），先提示用户换链接。
2. **跑脚本**，把输出原样读一遍。
3. **成功**：用 wikilink 汇报，如 `已生成 [[931.下降路径最小和 II]]`，并顺带说明 `.cpp` 是否已生成。
4. **失败**：按下面的表排查，**不要**退化成自己手写笔记——那是 `leetcode-organizer` 的活。

## 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 触发后弹出输入框，要你填文件名 | QuickAdd 的 `fileNameFormat.enabled = false` 会退化成 `{{value}}`，触发输入提示 | 本 skill 已把配置改成 `enabled: true` / `format: {{DATE:YYYYMMDDHHmmss}}`。**但如果没重载 QuickAdd，旧配置仍在内存里** → 见下节 |
| 超时无新笔记，且弹窗在等输入 | 同上；或 Obsidian 没响应 | 回车关掉弹窗，然后重载 QuickAdd |
| 超时无新笔记，无弹窗 | Obsidian 没跑 / advanced-uri 被禁用 / URI 被系统吞了 | 手动在命令面板跑一次 `QuickAdd: Anki_problem` 验证管线本身是否正常 |
| 报错 "无效的 LeetCode 中文版 URL" | 用了 leetcode.com 链接 | 换 `leetcode.cn` |
| 笔记生成了但题图是外链 | 图片下载失败 | 检查 `assets/leetcode_imgs/` 是否可写 |
| 笔记生成了但没有 `.cpp` | 该题 `codeSnippets` 里没有 `cpp`，或题干无 cpp 模板 | 手动补，或走 `leetcode-organizer` |

## 关于那次配置改动（需要重载一次）

本 skill 建立时改过一处（已备份到 `data.json.bak-anki`）：

```jsonc
// choices → Anki相关 → Anki_problem
"fileNameFormat": {
  "enabled": true,                      // 原来是 false
  "format": "{{DATE:YYYYMMDDHHmmss}}"   // 原来是 ""
}
```

原因：`enabled: false` 时 QuickAdd 用默认格式 `{{value}}`，而 `{{VALUE}}` 会弹输入框阻塞流程。改成时间戳后**不再弹窗**，初始文件名无所谓——模板第 28 行的 `tp.file.rename()` 随后会把它改成 `<题号>.<标题>`。

⚠️ **改的是磁盘上的 `data.json`，Obsidian 正在运行时内存里还是旧配置。**

让改动生效（任选其一）：

- **推荐**：设置 → 第三方插件 → 关掉 QuickAdd 再打开（重新 `loadData()`，读的正是磁盘）
- 或：重启 Obsidian

> 别在重载之前去点 QuickAdd 的设置界面——那会用内存里的旧值覆盖磁盘上的新值。真要回滚，把 `data.json.bak-anki` 覆盖回去再重载。

## 边界

- 本 skill **只管触发**，不做笔记内容的整理（写 Notes/Solution、补多解法、调 frontmatter）。用户要求"整理这道题的内容"时用 `leetcode-organizer`。
- 传 `-Url` 会**覆盖系统剪贴板**（模板的硬性要求）。如果用户剪贴板里有别的重要东西，先说明再覆盖。
- 不建复习任务。Anki 卡片由用户在 Anki 侧手动处理。
