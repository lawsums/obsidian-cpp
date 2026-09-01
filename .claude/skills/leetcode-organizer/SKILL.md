---
name: leetcode-organizer
description: 整理 LeetCode 题目到 Obsidian 的 Leetcode/ 目录（如「1511.统计作战单位数.md」）。核心规则两条：用户给的「代码」放进 ## 0.3 Solution，用户讲的「解题思路/算法分析」放进 ## 0.2 Notes；同时负责 frontmatter、标签、按钮块、.cpp 文件，以及模板题多解法的结构化整理。当用户要求"把这道题整理到 notes 里""整理一下这个 LeetCode 题目""把这个题目的代码和解法整理进笔记"时使用。
---

# LeetCode Organizer（LeetCode 题目笔记整理）

把一道 LeetCode 题整理进 Obsidian 的 `Leetcode/` 目录，遵循该目录统一的笔记模板（0.1 题目 / 0.2 Notes / 0.3 Solution + .cpp 嵌入）。本 skill 只整理**单题笔记**，不建复习任务。

## 目标位置与文件

- **目录**：`Leetcode/`
- **笔记命名**：`<编号>.<题名>.md`，如 `1511.统计作战单位数.md`
- **同名笔记存在**：先 `Read` 全文，在保留原有结构（编号风格、按钮块、已填内容）的前提下**补充/重组**，不覆盖已有内容。
- **配套文件**：同名 `.cpp`（C++ 源码），笔记末尾用 `![[<编号>.<题名>.cpp]]` 嵌入。

## 笔记结构约定（Leetcode/ 目录模板）

```
---
Date: YYYY-MM-DD
Link: https://leetcode.com/problems/<slug>/
Category:
- <算法标签1>
- <算法标签2>
...
Difficulty: Easy | Medium | Hard
SimilarQuestions:
- <相似题1>
Completed: false
---

#标签1 #标签2 ...   ← 与 Category 对齐，末尾留一个空格

```button      ← nvim 打开（已有笔记则原样保留）
name <font color="#548dd4">nvim打开</font>
type link
action file:///E%3A%5C...
```

```button      ← VSCode 打开
name <font color="#4e937a">VSCode打开</font>
type link
action file:///code%20%22...
```

`button-anki-open`   `button-anki-update`

DECK: 面试题-hot100

## 0.1 <编号>.<题名>
<题目描述：题干 / 示例 / 提示，原文保留>

## 0.2 Notes
<解题思路 / 算法分析 / 多解法对比 —— 用户讲解的内容放这里>

## 0.3 Solution
<代码 —— 用户给的代码放这里>

![[<编号>.<题名>.cpp]]

END
```

## 两条核心规则（用户最在意的）

1. **代码 → `## 0.3 Solution`**
   - 用户给了代码（Python / C++ / 伪代码），一律收进 Solution 部分，代码块原样保留，不删改逻辑，只可加注释。
2. **讲解思路 → `## 0.2 Notes`**
   - 用户讲的解题思路、算法推导、复杂度分析、多解法对比，一律写进 Notes 部分，**不要**混进 Solution 代码块里。
   - 若用户同时给了代码和讲解：代码进 Solution，讲解进 Notes，两者都保留。

## Notes 部分怎么写（## 0.2）

- 用 `### 0.2.1`、`### 0.2.2`… 作为子节标题，按逻辑分组（如：解法总览 / 核心思路 / 关键推导 / 复杂度）。
- 关键概念用 `==高亮==` 标出（本库习惯用 `==`，不是 `**`）。
- 多解法/复杂度对比优先用**表格**；要点用**无序列表**；正确性/一句点透的话用 `> 引用`。
- 模板题（如树状数组）若用户提到多解法，整理成对比表：

  | 解法 | 时间复杂度 | 空间复杂度 | 说明 |
  | --- | --- | --- | --- |

- 用户讲思路时用到的"动词"要落到笔记上：如「前缀树状数组一开始为空，边走边增量更新」「后缀树状数组一开始含全部元素，边走边减量更新」→ 写成两条带 `==初始为空==` / `==初始包含所有元素==` 高亮的要点。

## Solution 部分怎么写（## 0.3）

- 保持 `## 0.3 Solution ` 标题（注意末尾有一个空格，与库内一致）。
- 单解法：直接一个代码块。模板代码可保留来源注释，如 `# 模板来源 https://leetcode.cn/circle/discuss/mOr1u6/`。
- 多解法：用 `**解法一：<名称>—— 说明**`、`**解法二：<名称>**` 作为代码块前的小标题，例如：
  - `**解法一：值域树状数组（不离散化）—— 本笔记做法**`
  - `**解法二：离散化 + 树状数组 —— 教科书最优解法**`
- 若笔记已有一个 Python 主解法，用户又给了另一种解法的代码，**追加**为解法二/三，不覆盖原解法。
- 代码块语言标注：Python 用 ```` ```python ````。

## Frontmatter 与标签

- `Link`：改成对应的 leetcode 官方题解/题目 URL（`https://leetcode.com/problems/<slug>/`）。
- `Category`：按题目用到的算法填，与下方标签行保持一致（如：树状数组 / 线段树 / 动态规划 / 离散化…）。
- 标签行：`#标签1 #标签2 ... ` 用空格分隔、末尾留一个空格；新增算法标签时 Category 同步补一项。
- `Difficulty`：Easy / Medium / Hard。
- `Completed`：默认 `false`；用户明确说已做/已过才改 `true`。

## 按钮块（nvim / VSCode）

- **已有笔记**：按钮块**原样保留**，不要动。
- **新建笔记**：按模板生成，`.cpp` 绝对路径做 URL 编码：

```
```button
name <font color="#548dd4">nvim打开</font>
type link
action file:///<URL编码的 .cpp 绝对路径>
```

```button
name <font color="#4e937a">VSCode打开</font>
type link
action file:///code%20%22<URL编码的 .cpp 绝对路径>%22
```
```

编码规则（Windows 路径 → URL）：`\` → `%5C`、`:` → `%3A`、空格 → `%20`、`"` → `%22`、中文等非 ASCII → UTF-8 百分号编码。
例：`E:\Documents\Obsidian_\Cpp\Leetcode\1511.统计作战单位数.cpp`
→ `file:///E%3A%5CDocuments%5CObsidian_%5CCpp%5CLeetcode%5C1511.%E7%BB%9F%E8%AE%A1%E4%BD%9C%E6%88%98%E5%8D%95%E4%BD%8D%E6%95%B0.cpp`

## C++ 文件（.cpp）

- 笔记末尾用 `![[<编号>.<题名>.cpp]]` 嵌入同名 `.cpp`。
- `.cpp` **不存在或为空模板**：补一份与 `## 0.3 Solution` 主解法对应的 C++ 实现（类名/函数签名与题目一致，如 `class Solution { public: int numTeams(...) }`）。
- `.cpp` 已有内容：不动。

## 执行步骤

1. **定位**：优先用 `<linked_note>` / 用户给的路径；否则按 `<编号>.<题名>` 规则找 `Leetcode/` 下的同名笔记。
2. **读现状**：`Read` 目标 `.md`（和 `.cpp`），判断哪些已填、哪些空缺。
3. **分流内容**：把用户消息里的内容分成「代码」和「讲解」两路（核心规则）：
   - 代码 → 准备写入 `## 0.3 Solution`；
   - 讲解 → 准备写入 `## 0.2 Notes`。
4. **整理 Notes**：按上面的格式约定（0.2.x 子节 + 表格 + `==高亮==` + `>` 引用）组织讲解内容。
5. **整理 Solution**：按解法编号 + 代码块组织代码；必要时追加解法二/三。
6. **补元数据**：frontmatter（Link / Category / Difficulty）、标签行、必要时补 `.cpp`。
7. **校验**：`END` 结尾仍在、`![[...cpp]]` 指向存在、代码块闭合、编号风格与其他笔记一致。
8. **汇报**：用 wikilink（如 `[[1511.统计作战单位数]]`）告知改动了哪些文件、内容如何分布。

## 示例

用户（linked_note = `Leetcode/1511.统计作战单位数.md`）：
> "这是树状数组模板题，多做法。效率最高线段树+离散化，我的是值域树状数组（次高），最差暴力三重循环。核心：后缀树状数组初始含全部元素边走边减，前缀树状数组初始为空边走边加。" 并给了一段 Python `numTeams` 代码。

整理结果：
- **讲解** → `## 0.2 Notes`：`0.2.1` 解法总览表（暴力 O(n³) / DP O(n²) / 线段树+离散化 O(n log n) / 值域树状数组 O(n log V) / 树状数组+离散化 O(n log n)）；`0.2.2` 前缀+后缀树状数组核心思路；`0.2.3` 为何可不离散化；`0.2.4` 复杂度。
- **代码** → `## 0.3 Solution`：`**解法一：值域树状数组（不离散化）**` + 用户 Python 代码；再补 `**解法二：离散化 + 树状数组**`。
- **元数据**：Category/标签加「离散化」；空 `.cpp` 补上 C++ 实现。

## 注意

- 本 skill **只整理单题笔记内容**，不创建复习任务；如需建任务走 `create-obsidian-task` / `exam-organizer` 链路。
- 不要改动 `.obsidian/` 配置、其他笔记、或 `力扣 LeetCode.md` 索引（除非用户明确要求）。
- 若用户给的题号与英文站不同（如中文站 1511 = 英文站 Count Number of Teams），**保留用户现有编号**，可顺带提醒用户。
- 编辑时若 clangd 报 `'bits/stdc++.h' not found` 等，属于 Windows 环境缺 GCC 头文件路径，与笔记内容无关，忽略即可。
