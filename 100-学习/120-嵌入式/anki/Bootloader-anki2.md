DECK: Bootloader面试题3

{Q}Q9：mymain() 中的 3 秒倒计时是怎么实现的？为什么用 cnt 计数而不是用硬件定时器？{A}mymain() 在 while(delay) 循环中不断调用 getchar_nowait() 检查串口输入；若没有输入则 cnt 自增，cnt 到 200000 时清零、delay--，并回退显示新的倒计时数字。它是软件忙等计时，精度依赖 CPU 主频和编译器优化。Bootloader 对 3 秒没有严格精度要求，用 cnt 可避免配置 SysTick、中断服务函数等额外复杂度。{E}

{Q}Q11：getchar_nowait() 在倒计时循环中的作用是什么？如果用户在倒计时期间不按空格，会发生什么？{A}getchar_nowait() 非阻塞地从 UART 环形缓冲区读取一个字符；没有字符时立即返回，不会卡住倒计时循环。读到空格时进入 shell()；若未按空格，循环持续给 cnt 计数，倒计时结束后调用 relocate_and_start_app(0x08040000) 自动加载并启动 APP。{E}
<!--ID: 1786609121166-->


{Q}Q17：Bootloader 和 APP 各有自己的向量表吗？它们分别放在哪里？如何切换？{A}两者各有一份向量表。Bootloader 向量表由 start.s 定义，链接到 Flash 起始地址 0x08000000；APP 向量表位于 APP 搬移后的 RAM 加载地址 load。切换时，set_new_vector(load) 先把 APP 向量表地址写到 0x2000FFFC；start_app 再将 VTOR(0xE000ED08) 写为 load，从新向量表第 0 项加载 SP、第 1 项加载 Reset_Handler 地址，并通过 BX 跳转。{E}
<!--ID: 1786609121171-->


{Q}Q20：exception.c 中 PendSV_Handler、SysTick_Handler 等中断处理函数如何转发到 APP？{A}这些 Bootloader 中断处理函数先从固定地址 0x2000FFFC 读出 APP 向量表地址，再转换为 struct vectors*，利用成员在结构体中的固定偏移取到 APP 对应的处理函数指针并调用，例如 new_vector->PendSV_Handler()。这是一种 trampoline（跳板）式中断转发。{E}
<!--ID: 1786609121175-->


{Q}Q22：start.s 中 SVC_Handler 用汇编实现的原理是什么？[r0, #0x2c] 偏移量代表什么？{A}SVC_Handler 先从 0x2000FFFC 读出 APP 向量表地址，再执行 ldr r0, [r0, #0x2c] 取出 APP 的 SVC_Handler 地址，最后 bx r0 跳转。0x2c 是 SVC 在 Cortex-M3 向量表中的字节偏移：第 11 个表项乘以每项 4 字节，等于 44 字节。{E}
<!--ID: 1786609121179-->


{Q}Q24：Flash 写入前为什么先解锁？FLASH_KEY1 和 FLASH_KEY2 的作用是什么？{A}STM32 Flash 控制器默认置 LOCK 位，防止程序跑飞或野指针误擦写非易失 Flash。擦写前必须按顺序向 KEYR 写入 FLASH_KEY1=0x45670123 和 FLASH_KEY2=0xCDEF89AB，硬件识别正确序列后清除 LOCK 位，允许擦写；顺序或值错误则保持锁定。操作完成后应重新置 LOCK 位。{E}
<!--ID: 1786609121183-->


{Q}Q34：数据发送 putchar 用的是轮询还是中断？接收呢？为什么这样设计？{A}发送采用轮询：putchar 等待 USART SR 寄存器的 TXE(bit7) 置位后写 DR。接收采用 RXNE 中断：USART1_IRQHandler 调用 usart1_txrx()，将 DR 数据写入环形缓冲区，主循环再读取。原因是 Bootloader 输出量小，发送轮询实现简单；用户输入是异步到达的，接收中断配合环形缓冲区可以降低主循环忙碌时丢数据的风险。{E}
<!--ID: 1786609121187-->


{Q}Q46：行编辑中的光标移动、中间插入和中间删除如何实现？memmove 的作用是什么？{A}光标左移通过输出退格并减少 line_curpos，右移通过回显当前位置字符并增加 line_curpos。中间插入时，用 memmove 将光标后的字符串整体向后移动 1 字节，再写入新字符；中间删除时，用 memmove 将光标后的字符串整体向前移动 1 字节。memmove 能正确处理源和目标内存重叠，适合在同一行缓冲区内移动字符。{E}
<!--ID: 1786609121190-->


{Q}Q64：如果给 Bootloader 增加密钥校验以防止恶意固件，你会如何设计？{A}采用非对称数字签名：构建固件时先对镜像计算 SHA-256 哈希，再用开发者私钥签名；Bootloader 将公钥固化在受保护 Flash 区域，读取镜像后先校验 magic 和 CRC，再对哈希验签，只有验签成功才跳转。可进一步保存单调递增的版本号实现防回滚。资源受限时可选 ECDSA 等较轻量的算法；仅用 AES/HMAC 的对称方案会带来密钥保护风险。{E}
<!--ID: 1786609121194-->


{Q}Q27：FLASH_WaitForLastOperation() 的作用是什么？它轮询哪个标志位？超时怎么处理？{A}它在发起 Flash 擦写后等待操作结束：循环读取 FLASH_SR 的 BSY 位，BSY=1 表示控制器忙；等待结束后还要检查 PGERR、WRPERR 等错误标志。若计数达到超时上限仍为忙，则返回超时错误，调用方不能继续下一步擦写。{E}
<!--ID: 1786609121198-->


{Q}Q28：Flash 写入前为什么先擦除？NOR Flash 的物理特性是什么？{A}NOR Flash 擦除后单元为 1，编程只能把 1 写成 0，不能直接把 0 恢复为 1；因此目标区域若含有需要从 0 变回 1 的位，必须先按页擦除，再写入新数据。{E}
<!--ID: 1786609121202-->


{Q}Q30：FLASH_PageErase() 中 PER、AR、STRT 的设置顺序能颠倒吗？为什么？{A}不能随意颠倒。正确顺序是等待空闲并解锁后，先置 CR.PER 选择页擦除模式，再向 AR 写入目标页地址，最后置 CR.STRT 触发操作。若先触发或地址/模式未准备好，硬件可能按错误条件执行或操作失败。{E}
<!--ID: 1786609121206-->


{Q}Q32：UART 初始化需要做哪些配置？{A}依次完成：使能 USART1 与 GPIOA 时钟；配置 PA9 为复用推挽输出、PA10 为输入；根据 PCLK 计算并设置 BRR；设置 CR1 的 UE、TE、RE，得到 8N1 格式；使能 RXNEIE 接收中断；最后在 NVIC 中使能 USART1 IRQ。{E}
<!--ID: 1786609121210-->


{Q}Q33：115200 波特率如何由 8MHz 时钟得到 BRR=0x45？{A}USARTDIV=8000000/(16*115200)=4.3403。整数部分 DIV_Mantissa=4，小数部分 0.3403*16 约等于 5，因此 DIV_Fraction=5，BRR=(4<<4)|5=0x45；实际波特率约 115942，误差约 0.64%，可接受。{E}
<!--ID: 1786609121214-->


{Q}Q35：putchar 轮询 SR 的哪个 bit？含义是什么？{A}轮询 USART_SR 的 TXE 位，即 bit7。TXE=1 表示发送数据寄存器 DR 已空，可以写入下一字节；写 DR 后 TXE 会清零，等硬件把数据移入移位寄存器后再置位。{E}
<!--ID: 1786609121218-->


{Q}Q36：8N1 是什么？CR1 中 UE、M、PCE、TE、RE 分别表示什么？{A}8N1 表示 8 位数据、无校验、1 位停止位。CR1 中 UE(bit13) 使能 USART，M(bit12)=0 选择 8 位字长，PCE(bit10)=0 关闭奇偶校验，TE(bit3) 使能发送器，RE(bit2) 使能接收器；停止位由 CR2 配置。{E}
<!--ID: 1786609121222-->


{Q}Q51：relocate_and_start_app() 的完整流程是什么？APP 是 XIP 吗？{A}先从 APP Flash 存储区读取 U-Boot image_header_t，使用 be32_to_cpu 解析 ih_load 和 ih_size；再通过 flash_ops->read 把镜像数据从 Flash 搬到 ih_load 指向的 RAM；随后 set_new_vector(load) 保存新向量表地址，最后 start_app(load) 设置 VTOR、SP 和 PC 并跳转。APP 不是 XIP，而是在 RAM 执行。{E}
<!--ID: 1786609121226-->


{Q}Q52：IH_MAGIC 是什么？当前代码是否校验？应该如何改进？{A}IH_MAGIC=0x27051956，是 U-Boot legacy image 头的魔数，用于识别合法镜像。当前代码未先校验它就解析并跳转，存在把垃圾数据当镜像的风险；应在解析 load/size 前校验 magic，并配合 header CRC、data CRC、地址范围和大小上限检查。{E}
<!--ID: 1786609121230-->


{Q}Q53：copy_app 和 fp->read() 从 Flash 读取有什么区别？{A}copy_app 通常直接按内存映射地址把数据复制到 RAM，只适用于可直接寻址且布局固定的存储；fp->read() 经 flash_ops 抽象层读取，调用者不依赖具体 Flash 驱动，更易替换为其他芯片或外部 Flash。本项目选择后者以实现驱动解耦。{E}
<!--ID: 1786609121236-->


{Q}Q55：函数指针在项目中如何使用？体现了什么设计模式？{A}struct command 的 function 字段保存命令处理函数，find_cmd 后通过函数指针统一分发；struct flash_ops 的 read/write/erase 保存不同 Flash 驱动实现，调用者通过统一接口操作。这分别体现命令模式和 C 语言中的策略模式/运行时多态。{E}
<!--ID: 1786609121240-->


{Q}Q57：memcpy 实现中为什么判断 tmp <= s || tmp > s + count？{A}这是判断源和目的区是否不重叠。若不重叠可正向逐字节复制；若重叠且目的地址落在源区之后，正向复制会覆盖尚未读取的源数据，必须从末尾向前复制。具备这种重叠处理能力的语义实际等同于 memmove。{E}
<!--ID: 1786609121244-->


{Q}Q58：str2hex 支持哪些格式？"0x1B" 和 "1B" 是否相同？{A}str2hex 将十六进制文本转为数值，支持可选的 0x/0X 前缀，以及 0-9、a-f、A-F 字符。因此 "0x1B" 和 "1B" 都解析为十六进制 0x1B，即十进制 27。{E}
<!--ID: 1786609121249-->


{Q}Q59：ZMODEM 的基本原理是什么？为何选择它而非 XMODEM/YMODEM？{A}ZMODEM 通过帧头、数据块、CRC-32、确认与错误恢复传输文件，并支持流式传输和断点续传。相较 XMODEM 的小块停等和 YMODEM 的有限增强，ZMODEM 吞吐更高、抗中断能力更强，适合串口传输较大的固件镜像。{E}
<!--ID: 1786609121254-->


{Q}Q60：escape_sequence_table 的作用是什么？ZMODEM 为什么要字符转义？{A}该表标记需要转义的控制字符。ZMODEM 将这些字节编码后发送，接收端再还原，避免控制字符被终端、串口链路或协议帧边界误解释，从而保证二进制固件数据透明传输。{E}
<!--ID: 1786609121258-->


{Q}Q1：请简述 Bootloader 的整体架构与模块划分。{A}项目由启动与运行时初始化、UART 驱动、环形缓冲区、Shell/命令解析与分发、Flash 抽象层及 STM32 具体驱动、Flash 命令、ZMODEM 文件传输、U-Boot 镜像头解析、APP 搬运与启动跳转、向量表及异常转发组成。主链路是 UART 收到命令后经 Shell 分发到 Flash、rz 或 go 等功能模块。{E}
<!--ID: 1786609121262-->


{Q}Q2：为什么需要 Bootloader？它解决了什么问题？{A}直接用下载器烧录虽能运行，但现场设备不便连接调试器，且固件升级失败后缺少恢复路径。Bootloader 固化在独立区域，提供 IAP/串口升级、镜像接收、校验、失败恢复和自动启动 APP 的能力；产品级还会配合 A/B 分区、回滚和签名验证。烧录失败不等于板子报废，仍可用 SWD/J-Link 或芯片 Boot ROM 恢复。{E}
<!--ID: 1786609121266-->


{Q}Q6：从上电到 APP 运行，完整启动流程是什么？{A}复位后 CPU 从 Bootloader 向量表取初始 SP 和 Reset_Handler；Reset_Handler 依次调用 SystemInit 和 mymain。SystemInit 完成 Bootloader 的 data 段复制和 bss 段清零；mymain 初始化 UART，提供 3 秒 Shell 入口。超时或执行 go 后，relocate_and_start_app 解析 APP image header，将镜像从 Flash 搬到 RAM；set_new_vector 保存 APP 向量表地址，start_app 设置 VTOR、SP、PC 并 BX 跳转到 APP Reset_Handler。{E}
<!--ID: 1786609121270-->


{Q}Q7：SystemInit() 做什么？为什么必须在 mymain() 前执行？{A}本项目的 SystemInit 负责将已初始化全局/静态变量所在的 data 段从 Flash 复制到 RAM，并将未初始化全局/静态变量所在的 bss 段清零。它不负责搬运 APP，也不负责 UART 等外设初始化。若不执行，C 运行时数据初值错误，bss 不为 0，后续 C 代码行为不可预测。{E}
<!--ID: 1786609121274-->


{Q}Q14：为什么 data 段要重定位、bss 段要清零？不做会怎样？{A}data 段的初始值保存在 Flash，但程序运行时需要在 RAM 中读写，因此启动时必须复制到 RAM；bss 段没有镜像初值，C 语言运行时约定其初始值为 0，必须显式清零。这与 APP 向量表或栈指针重定位无直接关系；不做会导致全局/静态变量初值随机或错误。{E}
<!--ID: 1786609121279-->



{Q}Q16：Cortex-M3 向量表前几个表项是什么？{A}向量表第 0 项是初始 MSP，第 1 项是 Reset_Handler；随后依次包括 NMI、HardFault、MemManage、BusFault、UsageFault，保留项后是 SVC、DebugMon、PendSV、SysTick，之后才是外部中断。每项 4 字节，内容是栈顶地址或处理函数地址。{E}


{Q}Q18：start_app() 做什么？0xE000ED08 是什么？{A}start_app 的输入是 APP 向量表地址：先把该地址写入 0xE000ED08 的 VTOR（Vector Table Offset Register），使异常入口改查 APP 向量表；再从向量表[0]加载 SP，从向量表[1]加载 APP Reset_Handler 地址，最后 BX 跳转。仅写 VTOR 不足以启动 APP。{E}


{Q}Q23：struct flash_ops 的结构与抽象目的是什么？{A}flash_ops 至少包含 name 以及 read、write、erase 等函数指针。上层的命令和镜像搬运代码只依赖这组统一接口，STM32 内部 Flash 或其他芯片分别提供具体实现。这是 C 中通过函数指针实现的策略模式，能隔离硬件差异、降低替换驱动的修改范围。{E}


{Q}Q25：STM32F103 的 Flash 最小写入粒度是多少？4 字节对齐检查与它是什么关系？{A}STM32F103 硬件最小编程粒度是半字，即 16 位/2 字节；页擦除粒度为 2KB。项目 stm32_flash_write 的 4 字节对齐检查是上层按 uint32_t/word 处理与回读校验的约束，不表示硬件最小写入粒度变成 4 字节。{E}


{Q}Q49：image_header_t 有哪些关键字段？格式来自哪里？{A}该结构借鉴 U-Boot legacy image 格式。关键字段有 ih_magic、ih_hcrc、ih_time、ih_size、ih_load、ih_ep、ih_dcrc，以及 ih_os、ih_arch、ih_type、ih_comp、ih_name。面试至少要说明 magic 识别镜像、size 描述数据长度、load 是 RAM 加载地址、ep 是入口地址、hcrc/dcrc 分别校验头和数据。{E}


{Q}Q54：volatile 的作用是什么？本项目有哪些使用场景？{A}volatile 告诉编译器变量可能在当前代码流之外改变，每次访问都必须真实读写内存，不得用寄存器缓存或删除访问。本项目中，环形缓冲区读写指针由主循环与 UART ISR 分别修改；USART、FLASH 等内存映射寄存器也必须 volatile。volatile 只保证访问可见性，不保证 i++ 等复合操作的原子性。{E}


{Q}Q61：项目目前有哪些不足？若产品化需要如何改进？{A}当前主要不足：缺少 magic、头 CRC 和数据 CRC 校验；没有 A/B 双分区与回滚；没有签名验签和防回滚；缺少看门狗与升级中断恢复；软件倒计时不精确；0x2000FFFC 可能被 APP 栈覆盖；Shell 无鉴权；存在缓冲区边界和异常转发代码问题。产品化应先补镜像完整性校验、地址范围校验、双 Bank 回滚及签名验证，再完善写保护、看门狗和故障恢复。{E}

