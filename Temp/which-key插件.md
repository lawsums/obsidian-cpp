
---
# 1 AI 建议

### 1.1.1 思路总览

你要做的其实是一个“基于 `.obsidian.vimrc` 的自定义 which-key 插件”，核心分三块：

1. **读配置**：从仓库根目录读 `.obsidian.vimrc`，解析出你关心的映射。
2. **建数据结构**：把 `<leader>` 开头的按键映射组织成一棵“前缀树”（类似 which-key）。
3. **界面交互**：监听某个触发事件（按键 / 命令），弹出一个浮窗，把当前可选的“后续按键 + 描述”列出来。

下面按这三块说具体做法。

---

### 1.1.2 读取 `.obsidian.vimrc`

- `.obsidian.vimrc` 在仓库根目录（vault root），可以直接用 Obsidian 的 `VaultAdapter` 读：

  ```ts
  const vimrcPath = '.obsidian.vimrc';
  const content = await this.app.vault.adapter.read(vimrcPath);
  ```

- 如果你用的是官方的 `Vimrc Support` 插件，它本质上也是读这份文件；你自己的插件不需要依赖它，也可以自己读。
- 为了简单，**先只支持少数几种形式**，比如：
  - `nnoremap <leader>f :MyCommand<CR>`
  - `nmap <leader>p :AnotherCommand<CR>`
- 你可以按行遍历，做个很简单的 parser：
  - 只接受 `nnoremap` / `nmap` 这类关键字开头的行；
  - 把 `<leader>` 后面的键序列取出来（如 `f`、`ff`、`sp` 等）；
  - 可选：约定在行尾用注释添加说明，比如 `nnoremap <leader>f :MyCommand<CR> " 文件搜索`，把注释部分当成 description。

---

### 1.1.3 组织成 which-key 可用的数据结构

- 推荐用一颗 **前缀树（Trie）** / 嵌套对象来表示：

  ```ts
  interface WhichKeyNode {
    label?: string;      // 说明文本
    command?: string;    // 执行的 Vim 命令或 Obsidian 命令 ID
    children: Record<string, WhichKeyNode>;
  }

  const root: WhichKeyNode = { children: {} };
  ```

- 例如：

  - `<leader>f` -> 文件相关
  - `<leader>ff` -> 打开文件搜索
  - `<leader>fb` -> 打开 buffer 列表

  可以变成：

  ```ts
  root.children['f'] = {
    label: '文件相关',
    children: {
      'f': { label: '文件搜索', command: ':MyFileSearch', children: {} },
      'b': { label: 'Buffer 列表', command: ':MyBufferList', children: {} },
    }
  };
  ```

- 解析 `.vimrc` 时：
  - 把 `<leader>` 后的按键按“逻辑键”拆分（`f`、`g`、`<space>`、`<C-n>` 等）；
  - 从 `root` 一层层往下建节点；
  - 在叶子节点上记录 `label` / `command`。

---

### 1.1.4 触发与显示（which-key UI）

#### 1.1.4.1 触发方式选择

**简单路线（推荐起步）：**

- 不强行劫持 Vim 的 `<leader>`，而是自己定义一个命令和快捷键：
  - 例如命令：`prefix-which-key:show`；
  - 绑定快捷键：`Ctrl+Shift+Space`。
- 用户按下快捷键后：
  1. 弹出一个 Modal / 浮窗；
  2. 显示 `root.children` 里所有第一层键（即 `<leader>` 后第一键）；
  3. 监听用户进一步按键，在这个浮窗内部做“多次过滤”，类似 which-key。

这样做的好处：

- 不需要和 Obsidian 的 Vim keymap 深度耦合；
- 实现起来比“真 · which-key”简单很多，先保证能用。

**进阶路线（更接近 Vim which-key）：**

- 用插件的 `this.registerDomEvent(document, 'keydown', handler)` 监听按键事件；
- 逻辑是：
  1. 检测当前是否打开了 Vim 模式（可通过 `this.app.vault.getConfig('vimMode')` 等配置判断）；
  2. 如果按下的键是你设置的 `<leader>`（多数人是空格）：记录一个 internal state：`state = 'leader-pressed'`；
  3. 在 `leader-pressed` 状态下拦截后续按键，不直接让 CodeMirror 处理，而是：
     - 弹出 which-key 面板；
     - 在面板里根据按下的按键下钻到下一层节点；
     - 如果到达某个叶子节点，执行对应命令（可以模拟向当前编辑器注入 Vim 命令，或转为 Obsidian 命令）。
- 难点：
  - 要确认当前是在“正常模式（Normal mode）”而不是 Insert/Visual；这就要去访问 Vim 的内部状态（CodeMirror Vim 插件），比较 hack，不是官方公开 API。
  - 按键冲突处理比较麻烦。

**建议**：先实现“通过命令弹出 which-key 菜单”的版本，纯展示 + 手动选择执行，后续再考虑和 `<leader>` 深度绑定。

---

### 1.1.5 界面实现方式

- Obsidian 插件里自带一些常用 UI 组件：
  - `Modal`：全屏居中弹窗；
  - `Popover` / `setPosition` 等可以做悬浮菜单；
  - 或者自己建一个 `div` 插入到 `document.body`，用绝对定位到编辑区附近。
- which-key 菜单里可以这样展示：

  - 左侧：按键（`f` / `b` / `g`…）；
  - 右侧：描述（`文件搜索` / `Buffer 列表` 等）；
  - 支持键盘方向键选择 / 回车确认；
  - 支持再次按字符筛选（类似 FZF）。

- 技术上就是：
  - 用一个 `currentNode: WhichKeyNode` 记录当前层级；
  - 根据 `currentNode.children` 渲染一组列表项；
  - 在 `keydown` 事件中，根据用户输入更新 `currentNode` 并重新渲染。

---

### 1.1.6 执行命令的策略

你有两种主要路线：

- **执行 Vim 命令**：
  - 如果 `.vimrc` 里的命令是 `:MyCommand<CR>` 这种 Vim 命令，需要想办法把这段命令注入到 CodeMirror Vim 的命令行里执行（比较麻烦，需研究现有 `Vimrc Support` 源码）。
- **映射到 Obsidian 命令**（推荐）：
  - 你可以约定：`nnoremap <leader>f :obsidian-command prefix-link:doSomething<CR>`
  - 然后解析时只抽取 `prefix-link:doSomething`，再在你的插件里用 `this.app.commands.executeCommandById(id)` 来调用。
  - 优点：完全走 Obsidian 官方命令系统，兼容性更好。

---

### 1.1.7 开发路径建议（实际操作顺序）

1. **先做一个简单插件骨架**（你已经有 sample，可以直接改）：
   - 插件加载时读取 `.obsidian.vimrc`，打印内容到 console，确认能读到。
2. **写一个超简单 parser**：
   - 只支持 `nnoremap <leader>x :obsidian-command some-plugin:do<CR>` 这一种；
   - 成功构建出一棵 `root` 前缀树。
3. **实现一个命令：`Show Which-key from Vimrc`**：
   - 触发后弹出 Modal；
   - 展示第一层 `<leader>` 后的按键和说明（不必交互，只要看得到就行）。
4. **再增加交互**：
   - 在 Modal 里监听键盘输入，根据输入更新当前节点、刷新列表；
   - 到达叶子节点后调用 `this.app.commands.executeCommandById`。
5. **最后才考虑“自动在按下 leader 时弹出”的行为**：
   - 通过 `registerDomEvent` 监听 `keydown`；
   - 做状态机和模式判断。

---

如果你愿意下一步就动手写，我可以基于你现在的 `main.js` 直接帮你起一个极简版的“读取 `.vimrc` + 弹出 which-key 面板”的骨架代码，你只需要再逐步完善解析和 UI。

---
### 1.1.8 总体思路（针对你这份 vimrc 的“实用 parser 方案”）

你这份 `.vimrc` 里，大致分三类：

- **映射类**：`nmap / nnoremap / vmap / vnoremap / imap / map / unmap / nunmap / vunmap`
- **Ex 命令别名类**：`exmap xxx obcommand ...`、`exmap xxx surround [[ ]]`
- **设置类**：`set clipboard=unnamed` 等

做 which-key，“**第一版**”只需要：

1. **解析出可视化价值比较高的按键映射**（一般是前缀键，比如 `<Space>xx`、`,c`、`gD`、`[[`、`s"` 等）。
2. **把这些按键序列拆成一串 token**（前缀树的路径）。
3. **为每个映射找到一个“动作描述”**：  
   - 优先用行尾注释（`" xxx`）；  
   - 没有注释的话，从 `exmap` 或 Obsidian 命令推一个描述。

下面给你一个可以直接照着实现的“具体方案 + 样例代码”。

---

### 1.1.9 只关心哪些行？

**先过滤掉这些：**

- 空行
- 只包含注释的行：`^\s*"` 开头
- `set`、`unmap / nunmap / vunmap` 之类不产生新映射的行

**只保留这些：**

- **映射行**（我们要进 which-key 的核心）：

  ```vim
  nnoremap <Space>w :w<CR>
  nmap <Space>th :toggleTheme<CR>
  nmap ,c :insertColumn<CR>
  nmap gD :newTabLink<CR>
  map s" :surround_double_quotes<CR>
  map [[ :surround_wiki<CR>
  ```

- **exmap 行**（当作“动作的名字索引”，帮助生成描述）：

  ```vim
  exmap toggleTheme obcommand theme:switch
  exmap diary obcommand daily-notes
  exmap surround_wiki surround [[ ]]
  exmap openInVscode obcommand open-vscode:open-vscode
  ```

---

### 1.1.10 先把 `exmap` 收集成一个“动作表”

**目标：**

- 得到一个 `exCommands` 字典：

  ```ts
  exCommands["toggleTheme"]      -> { raw: "obcommand theme:switch" }
  exCommands["diary"]           -> { raw: "obcommand daily-notes" }
  exCommands["surround_wiki"]   -> { raw: "surround [[ ]]" }
  exCommands["openInVscode"]    -> { raw: "obcommand open-vscode:open-vscode" }
  ```

**解析方式（伪代码 / TS 示例）：**

```ts
interface ExCommandInfo {
  raw: string;         // 整个 RHS，比如 "obcommand theme:switch"
  description?: string; // 可选：后续你可以自己填说明
}

function parseExmapLine(line: string, exCommands: Record<string, ExCommandInfo>) {
  // 去掉前后空白
  const trimmed = line.trim();
  // exmap 名字 RHS ["注释..."]
  // 允许行尾有注释，用 " 分隔
  const [beforeComment] = trimmed.split(/"\s*/); // 忽略注释部分
  const m = /^exmap\s+(\S+)\s+(.+)$/.exec(beforeComment);
  if (!m) return;

  const name = m[1];   // 例如 "toggleTheme"
  const rhs = m[2];    // 例如 "obcommand theme:switch"
  exCommands[name] = { raw: rhs };
}
```

---

### 1.1.11 解析映射行（nmap/nnoremap/vmap/map …）

**我们关心的信息：**

- `mode`：`n` / `v` / `i` / `plain`（map）
- `lhs`：按键序列（如 `<Space>th`、`,c`、`gD`、`s"`、`[[`）
- `rhs`：Vim 命令（如 `:toggleTheme<CR>`、`:diary<CR>`、`:surround_wiki<CR>`）
- `comment`：行尾注释（如果有）

**推荐做法：**

1. 行按 `"` 分成代码 + 注释两部分：

   ```ts
   const [codePart, commentPart] = line.split(/"\s*(.*)/);
   const comment = commentPart?.trim(); // 可为空
   ```

2. 用正则匹配映射：

   ```ts
   const mapRe = /^(nnoremap|nmap|vnoremap|vmap|imap|map)\s+(\S+)\s+(.+)$/;
   const m = mapRe.exec(codePart.trim());
   if (!m) return; // 不是映射
   const mode = m[1];
   const lhs = m[2];  // 如 "<Space>th"、",c"、"gD"、"s\""、"[["
   const rhs = m[3];  // 如 ":toggleTheme<CR>"
   ```

3. 再从 `rhs` 里抽出“动作名字”：

   - 你这份 vimrc 里基本都是 `:something<CR>` 格式；
   - 其中 `something` 有三种情况：
     1. 直接就是 `w` / `q` 这类 Vim 内建；
     2. 是你前面定义的 `exmap` 名字（如 `toggleTheme` / `diary` / `surround_wiki`）；
     3. 直接是 Obsidian ex 命令（`obcommand ...`，你这里都藏在 `exmap` 里，属于情况 2）。

   ```ts
   function parseRhsCommand(rhs: string): { exName?: string; raw: string } {
     // 去掉 <CR>、前后空白和冒号
     const cleaned = rhs.replace(/<CR>/g, "").trim().replace(/^:/, "");
     // 如果是 exmap 名字，就用 exName 记录下来
     // 这里先不做严格校验，在后面根据 exCommands 再判断
     return { exName: cleaned, raw: cleaned };
   }
   ```

---

### 1.1.12 只保留“前缀键”映射（适合 which-key）

你的 vimrc 里既有：

- “纯替换”导航：`nnoremap gJ J`、`nnoremap J 6gj`、`nnoremap K 6gk` —— 不太适合 which-key 菜单；
- “结构化前缀”：`<Space>...`、`,c`、`,r`、`gD`、`[[`、`s"`, `su` 等 —— 很适合 which-key。

**建议做一个简单的过滤函数**：

```ts
function isInterestingForWhichKey(lhs: string): boolean {
  // 1. 空格前缀（你大量使用的）
  if (lhs.startsWith("<Space>")) return true;
  // 2. 逗号前缀（表格、主题等）
  if (lhs.startsWith(",")) return true;
  // 3. g 开头的 “go xxx” 系列
  if (lhs.startsWith("g")) return lhs.length > 1;
  // 4. s 开头的 surround 系列
  if (lhs.startsWith("s")) return lhs.length > 1;
  // 5. "[[" 这种特殊 map
  if (lhs === "[[" ) return true;

  // 其他的暂时先不放进 which-key，之后你再按需扩展
  return false;
}
```

---

### 1.1.13 将 `lhs` 拆成按键 token（用于前缀树）

**目标：**

- 把类似 `<Space>th` 变成：`["<Space>", "t", "h"]`
- `,c` 变成：`[",", "c"]`
- `gD` -> `["g", "D"]`
- `s"` -> `["s", "\""]`
- `[[` -> `["[", "["]`

**一个实用的拆分方法：**

```ts
function splitLhsToTokens(lhs: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < lhs.length) {
    if (lhs[i] === "<") {
      // 解析 <...> 结构，比如 <Space> <C-x> <A-p>
      const end = lhs.indexOf(">", i);
      if (end !== -1) {
        tokens.push(lhs.slice(i, end + 1)); // 包含 <>
        i = end + 1;
      } else {
        // 不完整就当普通字符处理
        tokens.push(lhs[i]);
        i++;
      }
    } else {
      tokens.push(lhs[i]);
      i++;
    }
  }
  return tokens;
}
```

---

### 1.1.14 构建 which-key 前缀树

**数据结构：**

```ts
interface WhichKeyNode {
  label?: string;      // 描述，比如 "切换主题"、"日记：今天"
  command?: string;    // 要执行的 Obsidian 命令或 exmap 名
  children: Record<string, WhichKeyNode>;
}

const root: WhichKeyNode = { children: {} };
```

**插入一条映射：**

```ts
function insertMapping(
  root: WhichKeyNode,
  tokens: string[],
  opts: { exName?: string; comment?: string; exCommands: Record<string, ExCommandInfo> }
) {
  let node = root;
  for (const t of tokens) {
    if (!node.children[t]) {
      node.children[t] = { children: {} };
    }
    node = node.children[t];
  }

  // 生成 label：优先用行尾注释，其次用 exmap/命令信息
  let label = opts.comment;
  if (!label && opts.exName) {
    // 1. 如果是 exmap 名
    const ex = opts.exCommands[opts.exName];
    if (ex) {
      // 简单策略：用名字驼峰拆分 + raw 里的一些关键信息
      label = opts.exName; // 先直接用名字，后面你可以自己美化
    } else {
      // 2. 不是 exmap，而是比如 "w"、"q" 或别的命令
      label = opts.exName;
    }
  }

  node.label = label;
  // 命令本身就存 exName 即可，执行时你再判断：是 exmap 还是直接 obcommand
  if (opts.exName) {
    node.command = opts.exName;
  }
}
```

---

### 1.1.15 结合你的 vimrc 的几个具体例子

以这几行为例：

```vim
nnoremap <Space>w :w<CR>
nnoremap <Space>th :toggleTheme<CR>
nmap ,c :insertColumn<CR>
nmap gd :followLink<CR>
map s" :surround_double_quotes<CR>
map [[ :surround_wiki<CR>
```

- `nnoremap <Space>w :w<CR>`
  - tokens: `["<Space>", "w"]`
  - exName: `"w"`（普通 Vim 保存命令）
  - label: `"w"`（或者你手动在 vimrc 里加注释 `" 保存"`，parser 就用注释）

- `nnoremap <Space>th :toggleTheme<CR>`
  - tokens: `["<Space>", "t", "h"]`
  - exName: `"toggleTheme"` → 在 `exmap` 里能找到
  - label: `"toggleTheme"`（你后面可以在插件里把它翻译成“切换主题”）

- `nmap ,c :insertColumn<CR>`
  - tokens: `[",", "c"]`
  - exName: `"insertColumn"` → 对应 `exmap insertColumn obcommand table-editor-obsidian:insert-column`
  - label: `"insertColumn"`（可以自己映射成“表格：插入列”）

- `nmap gd :followLink<CR>`
  - tokens: `["g", "d"]`
  - exName: `"followLink"`
  - label: `"followLink"`

- `map s" :surround_double_quotes<CR>`
  - tokens: `["s", "\""]`
  - exName: `"surround_double_quotes"`
  - label: `"surround_double_quotes"`（可以展示为 `surround "..."`）

- `map [[ :surround_wiki<CR>`
  - tokens: `["[", "["]`
  - exName: `"surround_wiki"`
  - label: `"surround_wiki"`（比如“包裹为 wiki 链接”）

---

### 1.1.16 你可以照着的“整体流程”

1. **读取 `.obsidian.vimrc` 文本**。
2. 第一遍遍历所有行：  
   - 找到所有 `exmap`，用 `parseExmapLine` 填充 `exCommands`。
3. 第二遍遍历所有行：  
   - 跳过注释、空行、`set`、`unmap` 等；  
   - 用 `mapRe` 匹配 `nmap/nnoremap/vmap/imap/map`；  
   - 用 `isInterestingForWhichKey(lhs)` 过滤掉不想进 which-key 的映射；  
   - 用 `splitLhsToTokens(lhs)` 得到 token 数组；  
   - 用 `parseRhsCommand(rhs)` 得到 `exName`；  
   - 调用 `insertMapping(root, tokens, { exName, comment, exCommands })`。
4. 最终得到 `root: WhichKeyNode`，可以直接拿去驱动 which-key UI：  
   - 第一层展示 `root.children` 的键；  
   - 按下某个键就进入对应子节点，展示下一层。

---

如果你愿意，下一步我可以帮你把这套解析逻辑直接写成一个独立的 `parseVimrcToWhichKeyTree(content: string)` 函数（完整 TS 版），你只要在 Obsidian 插件里调用它并把 `root` 用在 Modal 里渲染就行。