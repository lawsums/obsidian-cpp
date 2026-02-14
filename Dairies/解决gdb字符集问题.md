你现在在PowerShell中调试 `container_test.cpp` 时，遇到两个核心问题：一是设置断点时的编码转换警告，二是打印 `std::string` 时出现 `Converting character sets: Invalid argument` 错误——这两个问题本质都是**Windows终端（CP65001/UTF-8）与MinGW版GDB的字符集处理不兼容**导致的，我会给你一套“一键修复+永久生效”的解决方案，彻底解决这些编码问题。

### 零、配置 HOME 环境变量
GDB 对于.gdbinit的识别路径是$HOME/.gdbinit, 在windows系统上默认情况下没有HOME这个系统变量

### 一、先临时修复当前GDB会话（立即生效）
在当前GDB交互界面执行以下命令，先解决`std::string`打印错误，不影响后续调试：
```gdb
# 1. 强制设置GDB字符集为UTF-8（核心修复）
set charset UTF-8

# 2. 重新打印str，即可正常显示
p str

# 3. 可选：开启pretty-printing确保容器格式化（防止容器打印异常）
set print pretty on
```
执行后预期输出：
```gdb
$2 = "hello gdb pretty-printer" (size 21)
```
此时你可以继续打印其他容器（`p vec`/`p arr`等），都能正常格式化显示。

### 二、永久修复（所有GDB会话不再出问题）
临时修复只能解决当前会话，要彻底消除编码警告和字符串打印错误，需配置GDB初始化文件和Windows终端编码：

#### 步骤1：创建GDB初始化文件（.gdbinit）
1. 打开Windows文件资源管理器，进入你的用户目录（比如`C:\Users\你的用户名`，比如`C:\Users\ZhangSan`）；
2. 新建一个**无后缀名**的文件，命名为`.gdbinit`（注意开头有`.`，如果系统隐藏后缀，需先开启“显示文件扩展名”）；
3. 用记事本打开`.gdbinit`，写入以下内容并保存：
```
# 强制GDB使用UTF-8字符集，解决Windows编码转换问题
set charset UTF-8
# 启用pretty-printer，确保C++容器格式化打印
set print pretty on
# 关闭冗余的编码警告（可选）
set breakpoint pending on
```

#### 步骤2：设置Windows终端默认编码为UTF-8（彻底适配）
1. 按`Win+i`打开Windows设置，依次点击：**时间和语言** → **语言** → **管理语言设置**；
2. 在弹出的“区域”窗口中，切换到**管理**标签页，点击**更改系统区域设置**；
3. 勾选「使用Unicode UTF-8提供全球语言支持」，点击“确定”，重启电脑生效；
   ![更改系统区域设置](https://img-blog.csdnimg.cn/20230510152217684.png)（若看不到图片，只需按文字步骤操作即可）
4. 重启后，打开PowerShell执行`chcp`，会显示`Active code page: 65001`（UTF-8），说明终端编码已统一。

### 三、验证修复效果
重启电脑后，重新执行编译+GDB指令：
```powershell
cd "g:\Code\PyCharm\Practice\Leetcode\cppStudy\" ; if ($?) { g++ -g container_test.cpp -o container_test } ; if ($?) { gdb ./container_test }
```
然后执行以下操作，验证问题是否解决：
```gdb
# 设置断点（无编码警告）
b test_all_containers

# 运行程序
r

# 单步执行到str初始化后
n
n
n

# 打印str（正常显示）
p str

# 打印vector（正常格式化）
p vec
```
此时不会再出现`CP65001 to UTF-32`警告，`p str`也能正常显示字符串内容。

### 四、兜底方案（若系统UTF-8设置有问题）
如果不想修改系统区域设置，可在启动GDB前，先在PowerShell中执行以下命令临时切换编码：
```powershell
# 切换终端编码为GBK（936），兼容GDB旧版本
chcp 936
# 再执行编译+GDB指令
cd "g:\Code\PyCharm\Practice\Leetcode\cppStudy\" ; if ($?) { g++ -g container_test.cpp -o container_test } ; if ($?) { gdb ./container_test }
```
这种方式下，GDB的编码警告会消失，`p str`也能正常打印（但终端中文可能乱码，仅影响字符串内容为中文的场景）。

### 总结
1. **临时修复**：在GDB中执行`set charset UTF-8`，立即解决`std::string`打印错误；
2. **永久修复**：创建`.gdbinit`文件配置UTF-8 + 开启Windows系统UTF-8支持，彻底消除所有编码警告和错误；
3. **核心原理**：让Windows终端、GDB、MinGW编译器的字符集统一为UTF-8，解决编码转换不兼容问题。

修复后，你调试时设置断点、打印字符串/容器都能正常工作，不会再出现编码相关的错误或警告。