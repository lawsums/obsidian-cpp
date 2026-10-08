这是 Linux 的 `mmap(2)` 手册页，讲的是 **内存映射**。我帮你把核心内容梳理成几块。

## 0.1 一句话理解 mmap

`mmap()` 把一个**文件**（或设备）直接映射到进程的**虚拟地址空间**里。映射之后，你读写这块内存，就等于读写文件，不用再调用 `read()` / `write()`。

典型的用途：
- 把文件当数组一样访问
- 多个进程共享同一块内存
- 分配大块匿名内存（不关联文件）

## 0.2 函数原型

```c
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
int munmap(void *addr, size_t length);
```

- `mmap` 创建映射，成功返回映射区起始地址，失败返回 `MAP_FAILED`（即 `(void *) -1`）
- `munmap` 解除映射，成功返回 0，失败返回 -1

## 0.3 参数逐个看

**`addr`** — 你希望映射到哪个地址
- 传 `NULL`：让内核自己选（**最可移植的做法**）
- 传非 NULL：只是给内核一个“提示”，内核可能选附近的地址，不保证完全按你说的来

**`length`** — 映射长度，必须大于 0

**`prot`** — 这块内存的访问权限，取以下值的按位或：
- `PROT_READ` 可读
- `PROT_WRITE` 可写
- `PROT_EXEC` 可执行
- `PROT_NONE` 不可访问

**`flags`** — 映射类型和行为，必须**恰好包含**下面三者之一：
- `MAP_SHARED`：共享映射，改动对其他进程可见，也会写回文件
- `MAP_PRIVATE`：私有写时复制（COW），改动只有本进程可见，**不写回文件**
- `MAP_SHARED_VALIDATE`（Linux 4.15+）：类似 `MAP_SHARED`，但会校验未知 flag，不认识的 flag 直接报 `EOPNOTSUPP`

**`fd`** — 文件描述符。匿名映射时被忽略（但可移植写法要求传 -1）

**`offset`** — 从文件的哪个位置开始映射，**必须是页大小的整数倍**

## 0.4 常用的附加 flags

| flag | 作用 |
|---|---|
| `MAP_ANONYMOUS` | 不关联文件，内容初始化为 0，常用于分配内存 |
| `MAP_FIXED` | 强制映射到 `addr` 指定的确切地址，会覆盖已有映射，**危险** |
| `MAP_FIXED_NOREPLACE` | 类似 `MAP_FIXED`，但遇到冲突不覆盖，报 `EEXIST`（更安全） |
| `MAP_POPULATE` | 预先填充页表，减少后续缺页阻塞 |
| `MAP_LOCKED` | 锁定内存，类似 `mlock`，防止换出 |
| `MAP_HUGETLB` | 使用大页 |
| `MAP_NORESERVE` | 不预留交换空间 |
| `MAP_STACK` | 标记为栈用途，目前 Linux 上是空操作 |
| `MAP_32BIT` | 映射到进程地址空间前 2GB（仅 x86-64） |

## 0.5 关键机制

**页对齐**：映射以页为单位。文件大小不是页整数倍时，最后一页多出来的部分补零，往这部分写入**不会写回文件**。

**fork 后保留**：`mmap` 映射的内存在 `fork()` 后依然存在，属性相同。

**fd 可立即关闭**：`mmap` 返回后，`fd` 可以马上 `close`，映射不会失效。

**文件大小变化**：映射期间改变文件大小，对应区域的行为是**未定义的**。

## 0.6 常见错误

| errno | 原因 |
|---|---|
| `EACCES` | 文件不可读，或 `MAP_SHARED`+`PROT_WRITE` 但 fd 不是读写打开 |
| `EINVAL` | `length` 为 0、offset 未页对齐、flags 里没有 `MAP_PRIVATE`/`MAP_SHARED` |
| `ENOMEM` | 内存不足，或映射数量超限 |
| `ENODEV` | 文件系统不支持内存映射 |
| `EPERM` | 要求 `PROT_EXEC` 但文件系统是 no-exec 挂载 |

## 0.7 手册里反复强调的重点：MAP_FIXED 很危险

只有在**该地址范围已经被另一个映射预留过**时，用 `MAP_FIXED` 才是安全的。否则它会强行覆盖已有映射，多线程程序很容易因此破坏自己的地址空间。

手册举了个典型场景：线程 A 通过 `/proc/pid/maps` 找空闲地址，线程 B 同时占用了这个地址（甚至只是 `dlopen` 加载了一个库），A 再用 `MAP_FIXED` 映射就会把 B 的映射干掉。Linux 4.17 起可以用 `MAP_FIXED_NOREPLACE` 规避这个问题。

## 0.8 示例程序在做什么

手册末尾那个示例程序，功能是：**打印文件指定范围的内容**。

流程：
1. `open` 打开文件，`fstat` 获取文件大小
2. 把用户给的 offset **向下对齐到页边界**（`pa_offset`），因为 `mmap` 的 offset 必须页对齐
3. `mmap` 映射所需页，`PROT_READ` + `MAP_PRIVATE`
4. 用 `write` 把 `addr + offset - pa_offset` 处的 `length` 字节输出到 stdout
5. `munmap` 解除映射，`close` 关闭文件

这里有个细节：因为映射必须从页边界开始，但用户想读的起点可能不是页边界，所以要映射 `length + offset - pa_offset` 这么长，再用指针偏移 `offset - pa_offset` 定位到真正想读的位置。

## 0.9 glibc 与内核的差异

手册描述的是 **glibc 的 `mmap()` 包装函数**。最初它调用同名系统调用，但从 Linux 2.4 起系统调用被 `mmap2(2)` 取代，现在 glibc 的 `mmap()` 实际调用的是 `mmap2(2)`，并调整了 offset 的值。

如果你是在写 C 代码要用 `mmap`，或者想对比它和 `read`/`write` 的适用场景，可以告诉我具体方向，我再展开。