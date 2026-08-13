# 1 Bootloader 项目面试薄弱点分析与复习优先级
DECK: Bootloader面试题


> **使用说明**：按优先级从高到低复习，🔴 必须掌握，🟡 建议掌握，🟢 加分项。
> 
> 每个薄弱点标注了对应源码位置，方便对照代码复习。

---

## 1.1 复习优先级总览

| 优先级 | 主题 | 题号 | 核心考点 |
|--------|------|------|----------|
| 🔴 P0 | 启动流程全链路 | Q6, Q7, Q14 | SystemInit → data 重定位 → bss 清零 → mymain |
| 🔴 P0 | 中断向量表与切换 | Q16, Q17, Q18 | 向量表结构、VTOR、start_app 汇编 |
| 🔴 P0 | Flash 物理特性 | Q24, Q28 | 解锁钥匙、NOR Flash 只能 1→0 |
| 🔴 P0 | 环形缓冲区 | Q37, Q38, Q39 | 满空判断、volatile、SPSC 无锁 |
| 🔴 P0 | APP 启动流程 | Q51 | relocate_and_start_app 完整链路 |
| 🔴 P0 | volatile 关键字 | Q54 | 三大使用场景 |
| 🔡 P1 | 链接脚本 | Q12, Q13 | scatter 文件、Image$$/Load$$ 符号 |
| 🟡 P1 | 串口设计 | Q32, Q34 | 收发方式选择、配置全流程 |
| 🟡 P1 | Flash 操作抽象层 | Q23 | 策略模式、flash_ops |
| 🟡 P1 | 命令解析 | Q43, Q47 | shell 工作流、msh_split |
| 🟡 P1 | 中断转发机制 | Q19, Q20, Q21 | set_new_vector、trampoline |
| 🟡 P1 | Image 格式 | Q49, Q50 | U-Boot header、大端转换 |
| 🟡 P1 | 项目不足分析 | Q61 | 必须能说出改进点 |
| 🟢 P2 | 波特率计算 | Q33 | BRR 寄存器计算 |
| 🟢 P2 | Flash 细节 | Q25-Q31 | 粒度、对齐、验证 |
| 🟢 P2 | Shell 行编辑 | Q45, Q46 | 历史记录、memmove |
| 🟢 P2 | ZMODEM 协议 | Q59 | 协议对比、流程 |
| 🟢 P2 | OTA 与安全 | Q62, Q63, Q64 | 双 Bank、CRC、签名 |

---

## 1.2 🔴 P0 级薄弱点（必须能脱口而出）

### 1.2.1 启动流程全链路

**你能否在 60 秒内完整画出从上电到 APP 运行的流程？**

关键节点：
- `start.s` Reset_Handler → `BL SystemInit` → `BL mymain`
- `SystemInit`（init.c）：memcpy data 段 + memset bss 段
- `mymain`（main.c）：uart_init → 3 秒倒计时 → relocate_and_start_app
- `relocate_and_start_app`：读 header → 解析 load/size → 搬数据 → set_new_vector → start_app
- `start_app`（汇编）：写 VTOR → 读 SP → 读 PC → BX 跳转

**自测**：默写 start_app 的 4 条汇编指令。

<details>
<summary>答案</summary>

```asm
ldr r3, =0xE000ED08   ; VTOR 地址
str r0, [r3]           ; 写 VTOR = APP 向量表地址
ldr sp, [r0]           ; SP = 向量表[0]
ldr r1, [r0, #4]       ; PC = 向量表[1] = Reset_Handler
BX r1                  ; 跳转
```
</details>

---

### 1.2.2 中断向量表切换机制

**核心问题**：Bootloader 和 APP 的向量表怎么切换？中断怎么转发？

三个关键函数：
- `set_new_vector(load)`：把 APP 向量表地址存到 0x2000FFFC
- `start_app`：写 VTOR + 设置 SP/PC 跳转
- `PendSV_Handler` 等：从 0x2000FFFC 读 APP 向量表地址 → 通过结构体偏移找到 APP 处理函数 → 调用

**易错点**：
- 0x2000FFFC 这个地址是怎么算的？→ 0x20000000 + 0x10000 - 4
- VTOR 寄存器地址？→ 0xE000ED08
- 为什么 USART1 不转发？→ 它是 Bootloader 自己用的

---

### 1.2.3 NOR Flash 物理特性

**一句话总结**：Flash 编程只能把 1 变 0，不能把 0 变 1，所以写前必须擦除（擦除把整页变全 1）。

**必记**：
- 写入粒度：半字（16 位）
- 擦除粒度：页（2KB = 0x800）
- 解锁：KEY1(0x45670123) → KEY2(0xCDEF89AB)，顺序不能反
- 等待完成：轮询 BSY 标志 + 超时

---

### 1.2.4 环形缓冲区三大考点

| 考点 | 答案 |
|------|------|
| 满判断 | `(pW + 1) % SIZE == pR`（牺牲一个单元） |
| 空判断 | `pR == pW` |
| volatile 原因 | pW 在 ISR 改、pR 在主循环改，不加 volatile 编译器会缓存 |
| 无锁原因 | SPSC 模型，单核不会同时执行 |

---

### 1.2.5 volatile 三大场景

1. **中断与主程序共享变量** → 环形缓冲区 pW/pR
2. **内存映射硬件寄存器** → USART SR/DR、FLASH SR/CR
3. **多线程共享变量** → （本项目无此场景，但面试可能问）

**追问**：volatile 不保证原子性！`volatile int i; i++` 不是原子操作。

---

## 1.3 🟡 P1 级薄弱点（建议能答出来）

### 1.3.1 链接脚本与符号

**易混淆**：
- `Image$$RW_IRAM1$$Base` = 运行时 RAM 地址
- `Load$$RW_IRAM1$$Base` = 加载时 Flash 地址
- `Image$$RW_IRAM1$$ZI$$Base` = bss 段 RAM 地址

**为什么 SystemInit 要先执行**：data 段还没拷贝到 RAM，全局变量没有正确初值，C 程序不能正常工作。

---

### 1.3.2 串口收发方式选择

| 方向 | 方式 | 原因 |
|------|------|------|
| 发送 | 轮询 | 数据量小，简单可靠 |
| 接收 | 中断 + 环形缓冲区 | 异步到达，避免丢失 |

---

### 1.3.3 命令分发机制

```
用户输入 → shell() 收字符 → 回车触发 msh_exec()
→ msh_split() 分割参数 → find_cmd() 查找命令
→ cmd->function(argc, argv) 执行
```

`struct command` = name + help + 函数指针（命令模式）

---

### 1.3.4 Image 格式与 APP 启动

- 格式来自 U-Boot legacy image
- 字段是大端存储，需要 `be32_to_cpu` 转换
- APP **不是 XIP**，是搬到 RAM 执行
- `ih_load` = RAM 加载地址，`ih_size` = 数据大小
- 当前代码**没有校验 magic number**（这是一个已知的改进点）

---

### 1.3.5 项目不足（面试必答）

面试官最后大概率会问"你的项目有什么不足"。**必须能说出至少 5 点**：

1. 无 CRC/magic 校验 → 可能跳转到垃圾数据
2. 无双 Bank 备份 → 升级失败变砖
3. 无安全启动/签名验证
4. 无看门狗保护
5. 倒计时不精确（软件计数）
6. RAM 向量表地址有被覆盖风险
7. UART3 转发疑似有 bug
8. Shell 无密码保护
9. 缓冲区溢出风险（cmd_name[20]）
10. 无 Flash 写保护管理

---

## 1.4 🟢 P2 级薄弱点（加分项）

### 1.4.1 波特率计算

```
BaudRate = f_PCLK / (16 × USARTDIV)
USARTDIV = DIV_Mantissa + DIV_Fraction/16
115200 = 8000000 / (16 × USARTDIV) → USARTDIV = 4.34
→ DIV_Mantissa = 4, DIV_Fraction = 5
→ BRR = (4 << 4) | 5 = 0x45
实际波特率 = 8000000 / (16 × 4.3125) = 115942
误差 0.64%，可接受
```

---

### 1.4.2 Flash 操作细节

- 写入前检查 4 字节对齐（因为用 word 编程）
- 写入后回读验证（read-back verify）
- PageErase 步骤顺序：PER → AR → STRT，不能颠倒
- 错误标志：PGERR（编程错误）、WRPERR（写保护错误）、EOP（操作完成）

---

### 1.4.3 Shell 行编辑

- 上/下键：浏览历史（cmd_history[5][80]）
- 退格：memmove 整体前移 + 回显修正
- 中间插入：memmove 整体后移 + 回显
- 输入状态机：WAIT_NORMAL → WAIT_SPEC_KEY → WAIT_FUNC_KEY

---

### 1.4.4 ZMODEM vs XMODEM/YMODEM

| 特性 | XMODEM | YMODEM | ZMODEM |
|------|--------|--------|--------|
| 块大小 | 128B | 128/1024B | 1024B |
| 校验 | 简单校验和 | CRC-16 | CRC-32 |
| 多文件 | 不支持 | 支持 | 支持 |
| 断点续传 | 不支持 | 不支持 | 支持 |
| 流控 | 无 | 无 | 协议层 |

---

## 1.5 错题集模板

> 每次模拟面试后，将答错的题填入此表，按优先级复习。

| 日期 | 题号 | 错误类型 | 正确答案要点 | 已掌握 |
|------|------|----------|-------------|--------|
| | | | | ☐ |
| | | | | ☐ |
| | | | | ☐ |

**错误类型分类**：
- **概念错误**：理解有误，需重新学习
- **遗漏要点**：方向对但不完整，需补充
- **源码不熟**：知道概念但说不出代码细节
- **追问卡壳**：基础题答了但追问深入就答不上

---

## 1.6 模拟面试建议

### 1.6.1 第一轮（基础摸底，约 15 分钟）
只问 🔴 P0 题：Q1, Q2, Q6, Q7, Q16, Q17, Q18, Q24, Q28, Q37, Q38, Q39, Q49, Q51, Q54, Q61

### 1.6.2 第二轮（深入追问，约 30 分钟）
在 P0 基础上加 P1 题，每题追问 1-2 个问题

### 1.6.3 第三轮（查漏补缺）
P2 题全部过一遍，确保没有知识盲区

---

## 1.7 Anki 错题卡片（第一轮待复习）

> 导入格式：`{Q}题目{A}答案{E}`。收录范围：明确回答“不知道”的题、空白题，以及答得不完整或存在关键错误的核心题。已掌握的题不重复收录。

