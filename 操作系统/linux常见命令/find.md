
## 常用选项

- Type 文件类型
```lua
find /var/log -type d
```

| 类型字母 | 文件类型描述                         | 示例场景                                          |
| ---- | ------------------------------ | --------------------------------------------- |
| `b`  | 块设备文件（Block special file）      | 硬盘、U 盘等设备文件（/dev/sda）                         |
| `c`  | 字符设备文件（Character special file） | 键盘、鼠标、终端等（/dev/tty）                           |
| `d`  | 目录（Directory）                  | 如 /var/log、/home/user                         |
| `f`  | 普通文件（Regular file）             | 文本文件、二进制程序、日志文件等                              |
| `l`  | 符号链接（Symbolic link）            | 如 /etc/rc.local -> /etc/rc.d/rc.local         |
| `p`  | 命名管道（FIFO/named pipe）          | 进程间通信的管道文件（如 /tmp/my_pipe）                    |
| `s`  | 套接字文件（Socket）                  | 网络 / 进程间通信的套接字（如 /var/run/mysqld/mysqld.sock） |
| `D`  | 门文件（Door，仅部分系统支持，如 Solaris）    | 进程间通信的特殊文件（较少见）                               |

- Name 匹配模式
```bash
find /tmp -name "*.txt"
```


- Mtime 修改时间（以天为单位）
```bash
find /tmp -mtime -7
```

- Size
```shell
find / -type f -size +100M
```

## 高级用法

### ⚙️ 进阶篇（组合条件与执行操作）

**题目 5：组合条件查找 (AND)**

- **场景**：在当前目录 (`.`) 及子目录中，找出所有属于你“当前用户”的、且扩展名为 `.conf` 的配置文件。
    
- **关键条件**：需要同时满足两个条件（用户 AND 扩展名）。
    

**题目 6：组合条件查找 (OR)**

- **场景**：在 `/usr/share` 目录中，找出所有扩展名是 `.jpg` 或者 `.png` 的图片文件。
    
- **关键条件**：满足任一条件即可。
    

**题目 7：否定条件查找**

- **场景**：在 `/etc` 目录中，查找所有**不是**目录的项（即查找普通文件、符号链接等）。
    
- **关键条件**：排除某一类型。
    

**题目 8：查找后执行命令**

- **场景**：查找 `/home` 下所有扩展名为 `.tmp` 的临时文件，并将它们安全删除（在删除前最好先确认）。
    
- **关键条件**：对查找到的结果执行操作 (`-exec`)。
    

---

### 🧩 挑战篇（复杂逻辑与权限）

**题目 9：按权限查找**

- **场景**：在 `/usr/bin` 目录中，找出所有设置了“设置用户ID位（suid）”的程序（这些程序执行时拥有文件所有者的权限，通常有安全含义）。
    
- **关键条件**：按特殊权限位查找 (`-perm`)。
    

**题目 10：深度与排除目录**

- **场景**：在整个系统 (`/`) 中查找名为 `core` 的文件（通常是程序崩溃的内存转储文件），但避免在 `/proc`, `/sys`, `/dev` 这些虚拟文件系统中搜索，以提升速度和减少无关输出。
    
- **关键条件**：控制搜索深度、排除特定目录。

---

**题目 5**：
```bash
find . -type f -user $(whoami) -name "*.conf"
```
*   **解析**：`$(whoami)` 会替换为你的当前用户名。多个条件默认是“与” (AND) 关系。

**题目 6**：
```bash
find /usr/share -type f \( -name "*.jpg" -o -name "*.png" \)
```
*   **解析**：`-o` 表示“或” (OR)。括号 `()` 用于组合条件，但因为 Shell 中括号有特殊含义，所以需要转义为 `\(` 和 `\)`。

**题目 7**：
```bash
find /etc -not -type d
# 或
find /etc ! -type d
```
*   **解析**：`-not` 或 `!` 用于否定条件。

**题目 8**：
```bash
# 先确认查找结果
find /home -type f -name "*.tmp"
# 确认无误后再执行删除 (安全起见，可以先去掉 `-delete` 或换成 `-ok rm {} \;` 逐一确认)
find /home -type f -name "*.tmp" -delete
# 或者使用 -exec
find /home -type f -name "*.tmp" -exec rm {} \;
```
*   **解析**：
    *   `-exec` 后面的 `rm {}` 是待执行的命令，`{}` 代表找到的每个文件，`\;` 是结束符。
    *   使用 `-ok` 替代 `-exec` 可以**在每次操作前交互式确认**，更安全。
    *   现代 `find` 也提供了直接的 `-delete` 动作。

**题目 9**：
```bash
find /usr/bin -type f -perm /4000
```
*   **解析**：`-perm` 用于匹配权限。`4000` 是 suid 位的八进制值。`/4000` 表示“任何匹配该权限位的文件”（现代写法）。有些系统也使用 `-perm +4000`（旧写法）。

**题目 10**：
```bash
find / -path /proc -prune -o -path /sys -prune -o -path /dev -prune -o -name core -type f 2>/dev/null
```
*   **解析**：这是组合逻辑的经典应用。
    *   `-path /proc -prune` 表示如果路径匹配 `/proc` 就“修剪”（排除）它。
    *   `-o` 是“或”，将排除条件和查找条件连接。
    *   最后的 `-name core -type f` 是真正要查找的内容。
    *   `2>/dev/null` 将“权限拒绝”等错误信息重定向，使输出更清爽。

---

### ✨ 举一反三与思路拓展

完成这些题目后，你可以尝试以下思路设计更多练习：
1.  **组合时间与大小**：找出 `~/Downloads` 目录下超过 30 天未访问且大于 50 MB 的文件。
2.  **查找空文件或目录**：清理项目时，找出所有大小为 0 的空文件。
3.  **按内容查找**：结合 `find` 与 [[grep]]，在所有 `.java` 文件中搜索 `public class` 关键字。
4.  **权限与所有权**：找出系统里所有不属于任何已知用户或用户组的“孤儿文件”。

如果在练习中遇到任何问题，或者想针对某个题目进行更深入的探讨，随时可以问我。


## Help 文档

用法：find [-H] [-L] [-P] [-O级别] [-D 调试选项] [路径...] [表达式]

默认路径为当前目录；默认表达式为 -print。
表达式可以包含：操作符、选项、测试以及动作。

操作符（优先级递减；未使用其他操作符时隐含使用 -and）：
      ( 表达式 )   ! 表达式   -not 表达式   表达式1 -a 表达式2
      表达式1 -and 表达式2   表达式1 -o 表达式2   表达式1 -or 表达式2
      表达式1 , 表达式2

位置选项（总是为真）：
      -daystart -follow -nowarn -regextype -warn

Normal options (always true, specified before other expressions):
      -depth -files0-from FILE -maxdepth LEVELS -mindepth LEVELS
      -mount -noleaf -xdev -ignore_readdir_race -noignore_readdir_race

测试（N 可以是 +N 或 -N 或 N）：
      -amin N -anewer 文件 -atime N -cmin N -cnewer 文件 -context 上下文
      -ctime N -empty -false -fstype 类型 -gid N -group 名称 -ilname 匹配模式
      -iname 匹配模式 -inum N -iwholename 匹配模式 -iregex 匹配模式
      -links N -lname 匹配模式 -mmin N -mtime N -name 匹配模式 -newer 文件
      -nouser -nogroup -path 匹配模式 -perm [-/]权限模式 -regex 匹配模式
      -readable -writable -executable
      -wholename 匹配模式 -size N[bcwkMG] -true -type [bcdpflsD] -uid N
      -used N -user 名字 -xtype [bcdpfls]

动作：
      -delete -print0 -printf 格式 -fprintf 文件 格式 -print 
      -fprint0 文件 -fprint 文件 -ls -fls 文件 -prune -quit
      -exec 命令 ; -exec 命令 {} + -ok 命令 ;
      -execdir 命令 ; -execdir 命令 {} + -okdir 命令 ;

其他常用选项：
      --help                   显示此帮助信息并退出
      --version                显示版本信息并退出

-D 选项有效的参数为：
exec, opt, rates, search, stat, time, tree, all, help
使用 "-D help" 以查看选项描述，或阅读 find(1)

也请阅读 https://www.gnu.org/software/findutils/ 中的文档。
您可以使用 https://savannah.gnu.org/bugs/?group=findutils 上的 GNU findutils 错误报告页面
报告 "find" 程序中的错误，以及跟踪错误修复进度。
如果您无法浏览网页，请发送电子邮件至 <bug-findutils@gnu.org>。
