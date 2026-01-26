
`grep`（Global Regular Expression Print，全局正则表达式打印）是 Linux/Unix 系统中最核心的 **文本搜索工具**，用于在文件或输入流中匹配符合正则表达式的字符串，并输出匹配结果。它支持精准匹配、模糊匹配、递归查找等多种场景，是日常运维、开发、文本处理的必备命令。


## 一、核心功能与基本语法
### 1. 核心作用
- 从文件/管道输入中搜索符合条件的文本（字符串或正则表达式）
- 输出匹配的行内容，支持定位行号、文件名、统计匹配次数等
- 支持反向匹配（排除符合条件的行）、大小写忽略、递归查找等灵活用法

### 2. 基本语法
```bash
grep [选项] "搜索模式" 文件名/目录名
```
- **搜索模式**：可以是普通字符串（如 `hello`）或正则表达式（如 `he..o`、`^hello`）
- **文件名/目录名**：单个文件、多个文件（如 `file1.txt file2.txt`），或目录（需配合 `-r` 递归）
- **选项**：控制搜索行为（下文重点介绍）


## 二、常用核心选项（必背）
| 选项 | 英文含义 | 功能说明 | 示例 |
|------|----------|----------|------|
| `-i` | Ignore case | 忽略大小写（匹配 `Hello`、`HELLO`、`hello` 等） | `grep -i "hello" demo.txt` |
| `-n` | Line number | 显示匹配行的 **行号**（前文需求核心选项） | `grep -n "hello" demo.txt` |
| `-r`/`-R` | Recursive | 递归查找目录下的所有文件（包括子目录） | `grep -rn "hello" ./docs` |
| `-w` | Word match | 全词匹配（只匹配完整单词，不匹配部分包含的情况，如不匹配 `helloworld`） | `grep -w "hello" demo.txt` |
| `-v` | Invert match | 反向匹配：输出 **不包含** 搜索模式的行 | `grep -v "hello" demo.txt`（显示没有 `hello` 的行） |
| `-c` | Count | 统计匹配的 **总行数**（不是匹配次数，一行多匹配算1次） | `grep -c "hello" demo.txt` |
| `-l` | File with match | 只输出 **包含匹配内容的文件名**（不显示具体匹配行） | `grep -rl "hello" ./docs`（列出所有含 `hello` 的文件） |
| `-L` | File without match | 反向输出 **不包含匹配内容的文件名** | `grep -rL "hello" ./docs`（列出不含 `hello` 的文件） |
| `-o` | Only match | 只输出 **匹配的字符串本身**（不显示整行） | `grep -o "hello" demo.txt`（每行只打印 `hello`） |
| `-H` | With filename | 显式显示文件名（递归时默认开启，单个文件时可强制显示） | `grep -Hn "hello" demo.txt`（输出 `demo.txt:3:hello`） |
| `-A n` | After context | 显示匹配行及 **后面n行** 的内容 | `grep -A 2 "hello" demo.txt`（匹配行+后2行） |
| `-B n` | Before context | 显示匹配行及 **前面n行** 的内容 | `grep -B 2 "hello" demo.txt`（匹配行+前2行） |
| `-C n` | Context | 显示匹配行及 **前后各n行** 的内容（常用） | `grep -C 1 "hello" demo.txt`（匹配行+前后1行，上下文） |


## 三、常见使用场景（实战示例）
### 场景1：基础文件搜索（单个/多个文件）
- 搜索单个文件：`grep "hello" demo.txt`（输出含 `hello` 的所有行）
- 搜索多个文件：`grep "hello" file1.txt file2.txt`（同时搜索2个文件，显示文件名+行内容）
- 显示行号：`grep -n "hello" demo.txt`（输出 `3:hello world`，3是行号）

### 场景2：递归查找目录下所有文件
日常最常用场景（比如查找项目中所有包含 `func()` 的代码文件）：
```bash
# 递归查找当前目录（.）下所有文件，含 "hello" 的行，显示文件名+行号
grep -rn "hello" .

# 查找指定目录 /home/user/code，忽略大小写，全词匹配
grep -rniw "hello" /home/user/code
```

### 场景3：过滤无关文件/目录（优化搜索）
避免搜索日志、依赖目录等无关内容，提升效率：
```bash
# 递归查找当前目录，排除 .log 日志文件和 node_modules 目录
grep -rn "hello" . --exclude="*.log" --exclude-dir="node_modules"

# 排除多个目录：用逗号分隔
grep -rn "hello" . --exclude-dir="node_modules,tmp,dist"
```

### 场景4：正则表达式匹配（模糊/精准匹配）
`grep` 默认支持基础正则，复杂场景可加 `-E` 启用扩展正则（等价于 `egrep`）：
```bash
# 基础正则：匹配以 "hello" 开头的行（^ 表示行首）
grep -n "^hello" demo.txt

# 基础正则：匹配以 "world" 结尾的行（$ 表示行尾）
grep -n "world$" demo.txt

# 基础正则：匹配 "he" 后面跟任意2个字符的字符串（. 表示任意单个字符）
grep -n "he..o" demo.txt（匹配 hello、healo 等）

# 扩展正则（-E）：匹配 "hello" 或 "hi"（| 表示或，扩展正则无需转义）
grep -En "hello|hi" demo.txt
```

### 场景5：结合管道（从命令输出中搜索）
`grep` 可接收管道（`|`）传递的输入，过滤其他命令的输出结果：
```bash
# 查看进程，过滤包含 "nginx" 的进程（常用运维命令）
ps aux | grep "nginx"

# 查看日志文件，实时过滤 "error" 关键字（结合 tail -f 实时监控）
tail -f /var/log/nginx/error.log | grep "error"

# 列出 /etc 目录下的文件，过滤含 "conf" 的文件名
ls /etc | grep "conf"
```

### 场景6：显示匹配行的上下文（查看前后内容）
比如查看日志中报错行的前后环境，方便排查问题：
```bash
# 查看 demo.log 中含 "error" 的行，及前后各2行上下文
grep -C 2 "error" demo.log

# 查看报错行及后面5行
grep -A 5 "error" demo.log
```

### 场景7：统计与去重
```bash
# 统计当前目录下所有文件中含 "hello" 的总行数
grep -rc "hello" .

# 统计含 "hello" 的文件个数（结合 wc -l）
grep -rl "hello" . | wc -l

# 只输出匹配的不重复字符串（结合 sort -u）
grep -o "hello_[0-9]" demo.txt | sort -u
```


## 四、进阶技巧
1. **颜色高亮匹配结果**：大部分 Linux 系统默认支持，若不支持，添加 `--color=auto`：
   ```bash
   grep -rn --color=auto "hello" .
   ```
2. **搜索二进制文件**：默认不搜索二进制文件（如可执行程序、图片），加 `-a` 强制视为文本搜索：
   ```bash
   grep -ra "hello" ./binary_file
   ```
3. **静默模式（仅判断是否存在匹配）**：加 `-q`（Quiet），不输出内容，仅通过退出码判断（0=存在匹配，1=不存在），常用于脚本：
   ```bash
   # 脚本中判断文件是否含 "hello"
   if grep -q "hello" demo.txt; then
       echo "文件包含 hello"
   else
       echo "文件不含 hello"
   fi
   ```


## 五、常见误区
1. 搜索含空格的字符串：需用双引号包裹（如 `grep "hello world" demo.txt`），单引号也可（`'hello world'`），避免被 Shell 解析为多个参数。
2. 递归查找时忽略权限：若目录权限不足，需加 `sudo`（如 `sudo grep -rn "hello" /root`），否则会提示 "Permission denied"。
3. 正则特殊字符转义：基础正则中，`.`、`*`、`|` 等是特殊字符，需用 `\` 转义（如匹配 `hello.com` 需写 `hello\.com`）；扩展正则（`-E`）无需转义。


## 总结
`grep` 的核心价值是 **“精准搜索+灵活过滤”**，记住几个高频组合即可覆盖90%场景：
- 单个文件行号查找：`grep -n "关键词" 文件名`
- 目录递归查找：`grep -rn "关键词" 目录`
- 过滤优化：`grep -rn "关键词" 目录 --exclude=... --exclude-dir=...`
- 管道过滤：`命令 | grep "关键词"`

通过正则表达式和参数组合，`grep` 可应对从简单文本搜索到复杂日志分析、运维监控等各类场景，是 Linux 系统中最强大的文本处理工具之一。