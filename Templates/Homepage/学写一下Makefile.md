```easy-tracker-daily-overview
```
```easy-tracker-year-calendar-heatmap
```
```easy-tracker-buttons
  打卡 | 1
```

---
# 1 目录 

## 1.1 Getting Started / 入门指南

* [x] Why do Makefiles exist? / 为什么会有 Makefile 这种文件呢? ✅ 2026-09-21
* [x] What alternatives are there to Make? / 除了“制作”之外，还有哪些替代方案呢? ✅ 2026-09-21
* [x] The versions and types of Make / Make 的各个版本和类型 ✅ 2026-09-21
* [x] Running the Examples / 运行示例代码 ✅ 2026-09-21
* [x] Makefile Syntax / Makefile 语法 ✅ 2026-09-21
* [x] The essence of Make / “Make”的精髓所在 ✅ 2026-09-21
* [x] More quick examples / 更多快速示例 ✅ 2026-09-21
* [ ]   Make clean / 保持清洁/请保持干净状态

## 1.2 Variables / 变量

* [x] Targets / 目标/对象 ✅ 2026-09-25
    * [x] The all target / 全部目标 ✅ 2026-09-25
    * [x] Multiple targets / 多个目标 ✅ 2026-09-25
* [x] Automatic Variables and Wildcards / 自动变量与通配符 ✅ 2026-09-25
    * [x] `*` Wildcard / `*` 通配符 ✅ 2026-09-25
    * [ ]   `%` Wildcard / `%` 通配符
    * [ ]   Automatic Variables / 自动变量

## 1.3 Fancy Rules / 花哨的规则/繁琐的条例

* [ ]   Implicit Rules / 隐性规则/潜规则
* [ ]   Static Pattern Rules / 静态模式规则
* [ ]   Static Pattern Rules and Filter / 静态模式规则与过滤器
* [ ]   Pattern Rules / 模式规则
* [ ]   Double-Colon Rules / 双冒号使用规则

## 1.4 Commands and execution / 命令与执行

* [ ]   Command Echoing/Silencing / 命令回显/静音功能
* [ ]   Command Execution / 命令执行
* [ ]   Default Shell / 默认外壳程序
* [ ]   Double dollar sign / 双美元符号
* [ ]   Error handling with -k, -i, and - / 使用 -k、-i 和 - 参数进行错误处理
* [ ]   Interrupting or killing make / 中断或终止操作会……
* [ ]   Recursive use of make / 对“make”命令的递归使用
* [ ]   Export, environments, and recursive make / 导出、环境设置以及递归构建过程
* [ ]   Arguments to make / 需要提出的论据/理由

## 1.5 Variables Pt. 2 / 变量第 2 部分

* [ ]   Flavors and modification / 口味与改良方式
* [ ]   Command line arguments and override / 命令行参数与覆盖设置
* [ ]   List of commands and define / 命令列表及定义
* [ ]   Target-specific variables / 特定于目标的变量
* [ ]   Pattern-specific variables / 特定于模式的变量

## 1.6 Conditional part of Makefiles / Makefiles 中的条件语句部分

* [ ]   Conditional if/else / 条件性的 if/else 语句
* [ ]   Check if a variable is empty / 检查某个变量是否为空
* [ ]   Check if a variable is defined / 检查某个变量是否已被定义
* [ ]   `$(MAKEFLAGS)`

## 1.7 Functions / 功能/作用

* [ ]   First Functions / 初始功能/基本功能
* [ ]   String Substitution / 字符串替换
* [ ]   The foreach function / foreach 函数
* [ ]   The if function / if 函数
* [ ]   The call function / 调用函数
* [ ]   The shell function / shell 函数
* [ ]   The filter function / 过滤功能

## 1.8 Other Features / 其他功能/特点

* [ ]   Include Makefiles / 包含 Makefiles 文件
* [ ]   The vpath Directive / vpath 指令
* [ ]   Multiline / 多行文本
* [ ]   `.phony` / .phony

---
# 2 笔记

## 2.1 Automatic Variables and Wildcards / 自动变量与通配符

### 2.1.1 `*` Wildcard / `*` 通配符

「通配符」这一部分统一用 **Wildcard（`*`）** 来做匹配：

- `*` 代表 **任意长度的一串字符**（可以理解成「这一段随便是什么」）；
- 它由 **make 自己展开**，而不是交给 shell 去展开；
- 只匹配 **当前目录中已经存在** 的文件，且不跨目录（不会匹配到 `/`）；
- 匹配到 0 个文件时要注意区分两种情况：
    - 直接写在 **依赖列表** 里的 `*.c` 会 **原样保留**，于是报 `No rule to make target '*.c'` —— 这是最常见的「通配符失效」原因；
    - 写成 `$(wildcard *.c)` 时则返回 **空字符串**，悄无声息地什么都不匹配；
- 常用位置：规则的 **目标 / 依赖列表**，或者 `$(wildcard *.c)` 函数里。

| 写法 | 含义 | 用在哪 |
| --- | --- | --- |
| `*.c` | 匹配所有**已存在**的 `.c` 文件 | 依赖列表、`$(wildcard ...)` |
| `%` | 模式占位符，匹配**非空**的一段字符 | 模式规则 `%.o: %.c`、静态模式规则 |
| `$@` `$<` `$^` `$?` | 自动变量（目标、首个依赖、全部依赖……） | 规则内部的命令行 |

> 一句话区分：`*` 是 **文件通配符**（按现有文件匹配），`%` 是 **模式通配符**（按名字形状匹配，不要求文件已存在）。

### 2.1.2 技巧：批量创建同前缀 / 同后缀的文件

想验证 `*` 究竟匹配到了什么，往往需要一批名字有规律的文件。在 Shell（bash）里可以用「**前缀 + 大括号包裹的序列 + 后缀**」一次性生成：

```bash
# 共同前缀 log，不同数字后缀：log1.c ~ log9.c
touch log{1..9}.c

# 序列在中间，前后都有内容：test_1.txt ~ test_5.txt
touch test_{1..5}.txt

# 共同后缀 .md，不同字母前缀：a.md b.md c.md
touch {a,b,c}.md

# 指定步长，生成 1 3 5 7 9
touch log{1..9..2}.c

# 需要前导零就补零：file01.c ~ file09.c
touch file{01..09}.c
```

要点：

- 大括号展开（**brace expansion**）是 **shell 在命令执行前** 完成的，所以 `touch log{1..9}.c` 等价于手写 `touch log1.c log2.c ... log9.c`；
- 文件要先建好，Makefile 里的 `*.c` / `$(wildcard *.c)` 才能匹配到它们（呼应上面那条：`*` 只认已经存在的文件）；
- 这是 **bash** 的特性，Windows 的 **PowerShell / cmd 不支持** `{1..9}`。在 PowerShell 里等价写法是：

```powershell
1..9 | ForEach-Object { New-Item "log$_.c" }
```

### 2.1.3 Automatic Variables / 自动变量

自动变量（automatic variables）由 make 为 **每条规则的配方（recipe）** 自动填好，
只在配方里有值，直接写 `$@`、`$<` 这种形式即可（写成 `$(@)` 也行，含义不变）。

```make
hey: one two
	# Outputs "hey", since this is the target name
	echo $@
	# Outputs all prerequisites newer than the target
	echo $?
	# Outputs all prerequisites
	echo $^
	# Outputs the first prerequisite
	echo $<
	touch hey

one:
	touch one

two:
	touch two

clean:
	rm -f hey one two
```

| 自动变量 | 含义 | 上面例子中的值 |
| --- | --- | --- |
| `$@` | 当前规则的 **目标名** | `hey` |
| `$<` | **第一个** 依赖 | `one` |
| `$^` | **所有** 依赖（**去重**，按依赖列表顺序，空格分隔） | `one two` |
| `$?` | **比目标更新** 的依赖（按时间戳比较） | 目标不存在时 = `one two`；只改过 `two` 之后 = `two` |

几个容易踩的点：

- **`$?` 和 `$^` 一开始看不出区别**：`hey` 还不存在时，所有依赖都算「比目标新」，
  所以 `$?` 输出也是 `one two`。先 `make hey` 跑一遍，再 `touch two` 后重新 `make hey`，
  才能看到 `$?` 变成 `two`、而 `$^` 仍然是 `one two`。
- **`$?` 是增量更新的关键**：典型用法是只把变化过的目标文件重新打包/链接，
  例如 `ar rcs libfoo.a $?`（只更新有改动的 `.o`），而 `$^` 会把所有依赖都带上。
- **配方里的 `#` 不是 make 的注释**：make 把整行原样交给 shell，由 shell 把它当注释处理。
  但 make 依然会 **回显（echo）** 这一行，所以上面例子运行时会把注释文字也打印出来。
  想让注释别回显，写成 `@# 注释`。
- **想在配方里用 shell 自己的变量，要写两个 `$`**：`echo $$HOME`，
  否则单个 `$` 会被 make 拿去做自动变量 / 变量展开。
- 这些变量 **只在配方里有意义**，写在依赖列表里是无效的。

顺带同族的几个：

| 自动变量 | 含义 |
| --- | --- |
| `$+` | 所有依赖，**不去重**（`$^` 会去掉重复项，`$+` 保留） |
| `$*` | 模式规则（如 `%.o: %.c`）里 `%` 匹配到的那部分，即「词干 / stem」 |
| `$(@D)` `$(@F)` | `$@` 的 **目录部分** / **文件名部分**（`<`、`^`、`*`、`?` 同理可加 `D` / `F`） |

典型搭配：

```make
# 编译规则：$< 是源文件，$@ 是目标文件
%.o: %.c
	$(CC) -c $< -o $@

# 链接：$^ 是全部 .o，$@ 是可执行文件名
app: main.o util.o
	$(CC) $^ -o $@
```

> 小结：**`$@` = 给谁做，`$<` = 第一个从哪来，`$^` = 全部从哪来，`$?` = 哪些变新了。**

---

* 2026-09-21 - 1
* 2026-09-25 - 1