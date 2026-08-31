# 科大讯飞嵌入式软件开发笔试 —— 本地自测用例

本目录对应 [[笔试—科大讯飞嵌入式软件开发笔试]] 中的 3 道编程题，提供
**输入/输出测试文件** 和 **一键检测脚本**，方便写完代码后自行验证。

## 目录结构

```
科大讯飞笔试-测试/
├── README.md                  # 本文件
├── run_tests.bat              # 一键检测入口（Windows 双击/命令行）
├── run_tests.ps1              # 测试脚本本体（被 run_tests.bat 调用）
├── reference/                 # 参考实现（用来验证测试环境是否正确）
│   ├── q1.cpp                 # 题目1 图像卷积
│   ├── q2.cpp                 # 题目2 粒子能量求解
│   └── q3.cpp                 # 题目3 最大连续未修改像素区域
├── q1-convolution/            # 题目1 用例：test1.in / test1.out ...
├── q2-particle-energy/        # 题目2 用例
└── q3-max-region/             # 题目3 用例
```

> 每个题目的 `test1` 都是笔记里的样例，其余为补充的边界用例。
> `.in` 是输入，`.out` 是期望输出。

## 使用方法

前置条件：已安装 **MinGW-w64**，且 `g++` 已加入 PATH。

1. 把你写好的源码放到本目录（或任意位置），例如 `q1_solution.cpp`。
2. 运行（在 cmd 或 PowerShell 中，当前目录任意）：

   ```bat
   run_tests.bat q1 q1_solution.cpp      :: 只测题目1
   run_tests.bat q2 q2_solution.cpp      :: 只测题目2
   run_tests.bat q3 q3_solution.cpp      :: 只测题目3
   ```

   如果懒得每道题手动指定，也可以直接不带参数测全部（默认源文件为 `solution.cpp`）：

   ```bat
   run_tests.bat
   ```

   `all` 表示用**同一个源文件**跑三套用例（适用于写成单程序按输入分发的写法）：

   ```bat
   run_tests.bat all my_solution.cpp
   ```

3. 每条用例输出 `PASS` / `FAIL`，最后给出汇总。失败时会打印期望输出和实际输出方便对照。

### 用参考实现自检

第一次使用建议先验证测试环境本身：

```bat
run_tests.bat q1 reference\q1.cpp
run_tests.bat q2 reference\q2.cpp
run_tests.bat q3 reference\q3.cpp
```

全部应为 `PASS`，说明编译器和用例都正常。

## 说明

- **比对规则**：忽略空白差异（多余空格、Tab、换行都不影响），但**数字序列必须完全一致**。
- **添加用例**：在对应题目目录里加 `testN.in` + `testN.out` 即可，脚本会自动扫描 `test*.in`。
- 每题样例（`test1`）与笔记中的示例输入/输出一致，可直接对照。
- 题目2 的输出要求为整数，测试数据都保证整数解；无唯一解或方程组矛盾时输出 `-1`。
