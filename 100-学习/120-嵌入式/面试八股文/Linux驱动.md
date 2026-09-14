# 1 Linux驱动

> 嵌入式面试八股文 · Linux 驱动方向

---

## 1.1 一、字符设备与 file_operations

### 1.1.1 file_operations 结构体的作用和各成员函数的实现

**难度**：简单 ｜ **来源**：龙旗科技 ｜ **分类**：Linux驱动
（浏览 312 · 练习 105 · 收藏 9）

#### 1.1.1.1 参考答案

`file_operations` 是**驱动与用户空间交互的接口表**，定义了设备文件支持的所有操作。

| 成员函数 | 作用 |
|---|---|
| `open` | 打开设备，做初始化 |
| `release` | 关闭设备，释放资源 |
| `read` | 从设备读数据到用户空间，用 `copy_to_user()` |
| `write` | 从用户空间写数据到设备，用 `copy_from_user()` |
| `ioctl` | 自定义控制命令 |
| `mmap` | 内存映射 |
| `poll` | 实现非阻塞 IO 的多路复用 |

> 简单说：它就是**驱动的操作菜单**，用户态通过系统调用来"点菜"。

### 1.1.2 file_operations 中 read/write 的作用和实现要点

**难度**：简单 ｜ **来源**：小米 ｜ **分类**：Linux驱动
（浏览 266 · 练习 113 · 收藏 19）

#### 1.1.2.1 参考答案

`file_operations` 中的 `read` 和 `write` 是**驱动与用户空间交互的核心接口**。

- **read 函数**：用户调用 `read()` 系统调用时触发，驱动负责从设备/缓冲区取数据，通过 `copy_to_user()` 拷贝到用户空间 buffer。返回实际读取的字节数。
- **write 函数**：用户调用 `write()` 时触发，通过 `copy_from_user()` 从用户空间取数据，写入设备/缓冲区。返回实际写入的字节数。

**实现要点：**

1. 必须用 `copy_to_user` / `copy_from_user`，**不能直接 `memcpy`**，因为用户空间和内核空间地址不通
2. 要检查返回值，处理拷贝失败的情况
3. 注意处理偏移量 `*f_pos` 的更新
4. 考虑并发访问时的互斥保护

### 1.1.3 file_operations 结构体的关键函数有哪些？

**难度**：简单 ｜ **来源**：小米 ｜ **分类**：Linux驱动
（浏览 268 · 练习 106 · 收藏 14）

#### 1.1.3.1 参考答案

`file_operations` 中的关键函数：

- **`.open`**：设备打开时调用
- **`.release`**：设备关闭时调用
- **`.read`**：用户空间读数据，用 `copy_to_user()` 传数据
- **`.write`**：用户空间写数据，用 `copy_from_user()` 接收
- **`.unlocked_ioctl`**：处理自定义控制命令
- **`.mmap`**：将设备内存映射到用户空间
- **`.poll`**：支持 select/poll/epoll 多路复用

> 不是所有函数都要实现，根据驱动需要选择性实现即可。

### 1.1.4 file_operations 里 poll/mmap 的作用及 select/poll/epoll 与驱动交互

**难度**：简单 ｜ **来源**：华勤通信 ｜ **分类**：Linux驱动
（浏览 320 · 练习 102 · 收藏 23）

#### 1.1.4.1 参考答案

**poll：**

- 让驱动支持 `select` / `poll` / `epoll` IO 多路复用
- 实现：调用 `poll_wait()` 注册等待队列，返回就绪状态掩码
- 数据可读返回 `POLLIN`，可写返回 `POLLOUT`

**mmap：**

- 将设备内存 / DMA 缓冲区**直接映射**到用户空间
- 用户空间直接读写，无需 `read` / `write` 系统调用，**零拷贝**
- 实现：`remap_pfn_range()` 建立页表映射

**与用户空间的交互流程：**

```text
用户调用 epoll_wait
    → 内核调用驱动的 poll
    → 无数据则睡眠
    → 有数据唤醒并返回
```

---

## 1.2 二、内核模块加载

### 1.2.1 insmod 和 modprobe 的区别，modprobe 如何自动加载依赖模块？

**难度**：简单 ｜ **来源**：华勤通信 ｜ **分类**：Linux驱动
（浏览 256 · 练习 103 · 收藏 15）

#### 1.2.1.1 参考答案

**insmod 和 modprobe 的区别：**

**insmod：**

- 直接加载指定路径的 `.ko` 文件
- 不处理依赖关系，缺少依赖会失败
- 适合开发调试

**modprobe：**

- 从 `/lib/modules/$(uname -r)/` 标准路径查找模块
- 自动加载依赖模块
- 依赖信息来自 `modules.dep` 文件（`depmod` 生成）
- 适合生产环境

**modprobe 自动加载依赖的原理：**

1. `depmod` 扫描所有 ko 文件的符号导出/导入，生成 `modules.dep`
2. `modprobe` 读取依赖关系，按拓扑顺序先加载依赖模块

> 开发时用 insmod 快速测试，部署时用 modprobe。

---

## 1.3 三、内存映射与地址空间

### 1.3.1 mmap 和 ioremap 的区别，remap_pfn_range 和 ioremap 的区别

#### 1.3.1.1 参考答案

经典问题，考察的是**内核地址空间映射**与**用户地址空间映射**的本质区别。

**一、mmap 与 ioremap 的区别**

| 维度 | ioremap | mmap（驱动中的实现） |
|---|---|---|
| **映射目标** | 物理地址 → **内核虚拟地址** | 物理地址/内核内存 → **用户虚拟地址** |
| **使用者** | 内核代码（驱动自身） | 用户空间应用程序 |
| **地址空间** | 内核空间（3G~4G） | 用户空间（0~3G） |
| **页表** | 修改内核页表 | 修改进程页表 |
| **典型用途** | 驱动访问寄存器、DMA 描述符 | 用户直接读写设备缓冲区/显存 |
| **生命周期** | 驱动模块内，需 `iounmap` | 进程生命周期，`munmap` 释放 |

一句话总结：
- `ioremap` 是**给内核自己用**的，让驱动能访问物理硬件。
- `mmap` 是**给用户用**的，让应用程序绕过 read/write 直接访问硬件。

**二、remap_pfn_range 与 ioremap 的区别**

这两个函数**底层都是建立页表映射**，但服务的地址空间不同。

1. **ioremap 的实质**

```c
void __iomem *ioremap(phys_addr_t phys_addr, size_t size);
```

- 在内核页表中建立 `物理地址 → 内核虚拟地址` 的映射。
- 返回的地址只能在**内核态**使用，用户态拿到也没用（不同地址空间）。
- 通常用于访问寄存器：`writel(val, base + REG_OFFSET);`

2. **remap_pfn_range 的实质**

```c
int remap_pfn_range(struct vm_area_struct *vma,
                    unsigned long addr,      // 用户虚拟地址
                    unsigned long pfn,       // 物理页帧号
                    unsigned long size,
                    pgprot_t prot);
```

- 在**当前进程的页表**中建立 `物理页帧 → 用户虚拟地址` 的映射。
- 必须在驱动的 `mmap` 回调里调用，`vma` 就是用户要映射的那段。
- 映射后，用户程序可以直接用返回的指针访问这段物理内存。

3. **对比表**

| 维度 | ioremap | remap_pfn_range |
|---|---|---|
| **操作页表** | 内核页表 | 进程页表 |
| **映射到** | 内核虚拟地址 | 用户虚拟地址 |
| **调用位置** | 驱动 probe/init | 驱动的 `.mmap` 回调 |
| **参数核心** | 物理地址 phys_addr | 物理页帧号 pfn |
| **配套释放** | `iounmap` | 进程退出自动回收 / `munmap` |
| **能否给用户** | 不能 | 能 |

**三、两者的联系**

它们经常**配合使用**，典型场景：

```text
物理内存（寄存器/DMA缓冲区/显存）
        │
        ├── ioremap ──────► 内核虚拟地址（驱动内部访问）
        │
        └── remap_pfn_range ► 用户虚拟地址（应用直接访问）
```

例如 framebuffer 驱动：
- 驱动用 `ioremap` 拿到显存基址去配置硬件；
- 用户用 `mmap` → 驱动 `.mmap` 回调 → `remap_pfn_range` 把同一块显存映射到用户空间，应用直接画图。

**四、关于 pfn 的补充**

`remap_pfn_range` 的参数是 **pfn（page frame number）**，不是物理地址：

```c
pfn = phys_addr >> PAGE_SHIFT;   // 物理地址右移 12 位（4K 页）
```

- 对于 `vmalloc` 分配的内存，要用 `vmalloc_to_pfn()`；
- 对于 `kmalloc` 的内存，因为物理连续，可以用 `virt_to_phys() >> PAGE_SHIFT`；
- 对于设备寄存器，直接用寄存器物理地址右移。

> 注意：`remap_pfn_range` 映射的是**保留页/IO内存**时通常没问题；如果要映射普通 RAM 且涉及 cache 一致性，需谨慎处理 `pgprot`（如 `pgprot_noncached`）。

**五、一句话记忆**

- **ioremap**：物理地址 → 内核虚拟地址，**驱动自己用**。
- **remap_pfn_range**：物理页帧 → 用户虚拟地址，**给应用用**，是 mmap 的底层实现手段。
- 二者都是建页表，区别只在**建在谁的页表里、映射到谁的地址空间**。
