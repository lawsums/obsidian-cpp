# 1 ioctl 与 mmap 用法

> 字符设备驱动的两条「逃课通道」：**ioctl 走控制，mmap 走数据**
> 内核侧头文件：`#include <linux/ioctl.h>`、`#include <linux/fs.h>`、`#include <linux/mm.h>`、`#include <linux/uaccess.h>`
> 用户侧头文件：`#include <sys/ioctl.h>`、`#include <sys/mman.h>`

---

## 1.1 一、先搞清楚什么时候用哪个

| 需求                     | 用什么              | 原因                       |
| ---------------------- | ---------------- | ------------------------ |
| 配置类操作（复位、设波特率、读版本号、点灯） | **ioctl**        | 一次系统调用能传任意结构体，命令号可扩展     |
| 单点读写寄存器 / 少量参数交换       | **ioctl**        | 数据量小，走 `copy_*_user` 完全够 |
| 显存、摄像头采集缓冲、DMA 缓冲、大块数据 | **mmap**         | 只建一次页表，之后是普通内存访问，**零拷贝** |
| 流式数据（音频、串口）            | `read` / `write` | 数据是「流」不是「控制」，语义更自然       |

> [!tip] 一句话区分
> **ioctl 是「点菜」（每次喊一声、传个参数），mmap 是「把厨房搬到你家」（一次映射、随便拿）。**
> 硬件寄存器**单点**操作用 ioctl，**成片**操作用 mmap。

---

## 1.2 二、ioctl

### 1.2.1 函数原型

```c
/* 用户态（glibc，可变参数版本）—— <sys/ioctl.h> */
int ioctl(int fd, unsigned long request, ...);

/* 内核态（file_operations 里）—— <linux/fs.h> */
long (*unlocked_ioctl)(struct file *filp, unsigned int cmd, unsigned long arg);

/* 失败返回 -1 并设置 errno；驱动侧失败返回【负的 errno】 */
```

> [!note] 为什么 `arg` 是 `unsigned long` 而不是 `void *`？
> 因为内核**不能直接解引用用户指针**——必须用 `copy_from_user` / `copy_to_user` 把数据搬到内核再处理。
> 声明成整数既能装指针也能装标量，还避免了内核代码里满天飞的用户指针强转。

### 1.2.2 命令号怎么编（重点，面试爱问）

一个 `ioctl` 命令是 32 位整数，被拆成 4 段：

```
 31 30 | 29                16 | 15        8 | 7         0
+------+---------------------+-------------+------------+
| dir  |        size         |    type     |     nr     |
| 2bit |       14bit         |    8bit     |    8bit    |
+------+---------------------+-------------+------------+
  方向      数据长度(字节)      魔术号(设备)    命令序号
```

```c
#define _IOC(dir, type, nr, size)                       \
    (((dir)  << 30) | ((size) << 16) |                  \
     ((type) <<  8) | ((nr)   <<  0))
```

| 宏 | dir | 语义（**站在用户态看**） |
| --- | --- | --- |
| `_IO(type, nr)` | 无 | 纯命令，不带数据（如复位） |
| `_IOR(type, nr, 数据类型)` | READ | 用户**读**：驱动 → 用户（`copy_to_user`） |
| `_IOW(type, nr, 数据类型)` | WRITE | 用户**写**：用户 → 驱动（`copy_from_user`） |
| `_IOWR(type, nr, 数据类型)` | READ\|WRITE | 双向 |

辅助解析宏：`_IOC_TYPE(cmd)`、`_IOC_NR(cmd)`、`_IOC_SIZE(cmd)`、`_IOC_DIR(cmd)`

> [!danger] 最容易记反的一点
> **方向是从用户态的视角定义的**，不是从驱动的视角。
> - `_IOR` → 用户**读**，所以驱动往里**写**（`copy_to_user`）
> - `_IOW` → 用户**写**，所以驱动从里**读**（`copy_from_user`）
>
> 记法：**`R` 是用户拿到数据，`W` 是用户交出数据。**

> [!warning] 两个硬限制
> 1. `size` 只有 14 位 → **单个命令最大传 16383 字节**，大数据量别走 ioctl
> 2. `type`（魔术号）只有 8 位，全局唯一性靠约定 → 自己选一个之前先查内核文档
>    `Documentation/userspace-api/ioctl/ioctl-number.rst`

### 1.2.3 公共头文件：内核和用户态共用

把命令号定义写成一份头文件，内核模块和用户程序都 `#include` 它，避免两边写错对不上。

```c
/* mydev.h —— 只放纯声明，内核态和用户态都能编 */
#ifndef _MYDEV_H
#define _MYDEV_H

#include <linux/ioctl.h>   /* uapi 头，用户态也能包含 */

#define MYDEV_MAGIC   'k'  /* 8 位魔术号，选定后不要改 */

struct mydev_reg {
    unsigned int reg;
    unsigned int val;
};

#define MYDEV_RESET      _IO(MYDEV_MAGIC, 0)                    /* 无参数 */
#define MYDEV_GET_VER    _IOR(MYDEV_MAGIC, 1, int)              /* 用户读 */
#define MYDEV_SET_REG    _IOW(MYDEV_MAGIC, 2, struct mydev_reg) /* 用户写 */
#define MYDEV_XCHG_REG   _IOWR(MYDEV_MAGIC, 3, struct mydev_reg)/* 双向 */

#endif /* _MYDEV_H */
```

> [!tip] `<linux/ioctl.h>` vs `<sys/ioctl.h>`
> - 公共头文件一律用 **`<linux/ioctl.h>`**：它是 uapi 头，用户态也能编；反过来 `<sys/ioctl.h>` 在**内核态不存在**，写进去就编译不过。
> - 用户态的 `.c` 文件里仍然要 `#include <sys/ioctl.h>` 来拿到 `ioctl()` 的函数声明。
> - 万一报 `_IOR` 未定义，补一句 `#include <linux/ioctl.h>` 即可（`_IO*` 宏来自 `<asm-generic/ioctl.h>`）。

### 1.2.4 用户态调用

```c
/* user_ioctl.c */
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>     /* ioctl() 声明 */
#include "mydev.h"

int main(void)
{
    int fd = open("/dev/mydev", O_RDWR);
    if (fd < 0) { perror("open"); return 1; }

    /* _IOR：第三参传【变量的地址】，驱动往这里 copy_to_user */
    int ver = 0;
    if (ioctl(fd, MYDEV_GET_VER, &ver) < 0) {
        perror("MYDEV_GET_VER");
        close(fd);
        return 1;
    }
    printf("驱动版本 = %d\n", ver);

    /* _IOW：传结构体地址 */
    struct mydev_reg r = { .reg = 0x10, .val = 0xABCD };
    if (ioctl(fd, MYDEV_SET_REG, &r) < 0)
        perror("MYDEV_SET_REG");

    /* _IOWR：进出都用同一个结构体 */
    r.val = 0x1111;
    if (ioctl(fd, MYDEV_XCHG_REG, &r) < 0)
        perror("MYDEV_XCHG_REG");
    printf("交换回来的旧值 = 0x%X\n", r.val);

    /* _IO：不带 arg */
    if (ioctl(fd, MYDEV_RESET) < 0)
        perror("MYDEV_RESET");

    close(fd);
    return 0;
}
```

> [!warning] 永远别忘取地址
> `ioctl(fd, MYDEV_GET_VER, &ver)` ✅ ｜ `ioctl(fd, MYDEV_GET_VER, ver)` ❌
> 传值的话，内核会把 `ver` 的数值当成地址去 `copy_to_user` → 大概率 `EFAULT` 或直接崩。

### 1.2.5 驱动侧实现

```c
/* mydev.c */
#include <linux/module.h>
#include <linux/fs.h>
#include <linux/miscdevice.h>
#include <linux/uaccess.h>     /* copy_to_user / copy_from_user / access_ok */
#include "mydev.h"

#define MYDEV_NR_REGS 16

static int          g_ver = 3;
static unsigned int g_reg[MYDEV_NR_REGS];

static long mydev_ioctl(struct file *filp, unsigned int cmd, unsigned long arg)
{
    struct mydev_reg r;

    /* ---- 1. 先校验魔术号和编号 ---- */
    if (_IOC_TYPE(cmd) != MYDEV_MAGIC)
        return -ENOTTY;                      /* 不认识的命令统一返回 -ENOTTY */
    if (_IOC_NR(cmd) > 3)
        return -ENOTTY;

    /* ---- 2. 校验用户地址（可选，copy_*_user 内部也会查）---- */
    if ((_IOC_DIR(cmd) & _IOC_READ) &&
        !access_ok((void __user *)arg, _IOC_SIZE(cmd)))
        return -EFAULT;

    /* ---- 3. 分发 ---- */
    switch (cmd) {
    case MYDEV_RESET:                        /* _IO：无数据 */
        memset(g_reg, 0, sizeof(g_reg));
        break;

    case MYDEV_GET_VER:                      /* _IOR：内核 → 用户 */
        if (copy_to_user((void __user *)arg, &g_ver, sizeof(g_ver)))
            return -EFAULT;
        break;

    case MYDEV_SET_REG:                      /* _IOW：用户 → 内核 */
        if (copy_from_user(&r, (void __user *)arg, sizeof(r)))
            return -EFAULT;
        if (r.reg >= MYDEV_NR_REGS)
            return -EINVAL;                  /* 边界检查：一定不能省 */
        g_reg[r.reg] = r.val;
        break;

    case MYDEV_XCHG_REG: {                   /* _IOWR：双向 */
        unsigned int old;
        if (copy_from_user(&r, (void __user *)arg, sizeof(r)))
            return -EFAULT;
        if (r.reg >= MYDEV_NR_REGS)
            return -EINVAL;
        old = g_reg[r.reg];
        g_reg[r.reg] = r.val;                /* 写入新值 */
        r.val = old;                         /* 回填旧值 */
        if (copy_to_user((void __user *)arg, &r, sizeof(r)))
            return -EFAULT;
        break;
    }

    default:
        return -ENOTTY;
    }

    return 0;                                /* 成功返回 0 */
}

static const struct file_operations mydev_fops = {
    .owner          = THIS_MODULE,
    .unlocked_ioctl = mydev_ioctl,
    .compat_ioctl   = compat_ptr_ioctl,      /* 5.5+ 内核自带；见下面说明 */
};
```

#### 1.2.5.1 配套模块骨架（misc 设备，最省事）

```c
static struct miscdevice mydev_misc = {
    .minor = MISC_DYNAMIC_MINOR,   /* 让内核自动分配次设备号 */
    .name  = "mydev",              /* 自动生成 /dev/mydev */
    .fops  = &mydev_fops,
};

static int __init mydev_init(void)
{
    return misc_register(&mydev_misc);
}

static void __exit mydev_exit(void)
{
    misc_deregister(&mydev_misc);
}

module_init(mydev_init);
module_exit(mydev_exit);
MODULE_LICENSE("GPL");
```

#### 1.2.5.2 四条铁律

1. **返回值**：成功 `0`，失败返回**负的 errno**（`-EINVAL` / `-EFAULT` / `-ENOTTY`）。
   `unlocked_ioctl` 的返回值内核**原样透传**，不会帮你取负——用户态看到的就是 `errno = -ret`。
2. **必须 `copy_*_user`**，绝不能直接 `*(int *)arg` 解引用用户指针。
3. **不认识就返回 `-ENOTTY`**，让上层有机会走别的路径，别默默返回 0。
4. **用 `.unlocked_ioctl`，不要用 `.ioctl`**。后者 2.6.36 就被移除了。
   `unlocked` 的意思是「不再持有 BKL 大内核锁」——**不要**为了「补回来」而在整个函数外面套一把大锁，只在真正访问共享数据的地方加锁。

> [!warning] 32 位应用跑在 64 位内核上 → `.compat_ioctl`
> 指针 8 字节 vs 4 字节、`long` 大小不同，用户态传进来的结构体布局可能对不上。
> - 结构体里只有固定宽度类型（`unsigned int` 等）且布局一致 → 直接用内核给的 `compat_ptr_ioctl`（**5.5+** 才有）
> - 布局不一致 → 自己写 `.compat_ioctl`，里面用 `compat_ptr()` 转指针，并分开处理两个版本的结构体
> - 不实现的话，32 位程序可能收到 `-ENOTTY` 或读到错位的数据

### 1.2.6 ioctl 常见坑

- [ ] `_IOR` / `_IOW` 方向写反（代码能跑，但语义完全相反，后人读代码必踩）
- [ ] 用户态第三参忘取地址 `&`
- [ ] 结构体里**带指针成员**时，图省事 `copy_from_user` 整个结构体 → 拷进来的是用户地址，内核解引用它等于踩空（要么分段拷贝，要么用 `compat` 版本）
- [ ] 忘了边界检查，用户传个 `reg = 9999` 直接越界写内核内存
- [ ] 魔术号随手写，和别的驱动撞车
- [ ] 单个命令塞超过 16383 字节的数据
- [ ] 32/64 位环境没管 `.compat_ioctl`
- [ ] 忘了在 `switch` 的 `default` 里返回 `-ENOTTY`

---

## 1.3 三、mmap

### 1.3.1 为什么要 mmap

`read` / `write` 每次都要：**用户缓冲 ↔ 内核缓冲** 两次拷贝，外加一次系统调用 + 一次上下文切换。
一块 4MB 的显存刷一帧就是 4MB 的额外拷贝。

`mmap` 的做法是：**在内核里把设备的物理页直接挂到当前进程的页表上**。
之后用户拿到的指针就是普通内存地址，读写它 = 直接读写那块物理内存，**零拷贝、零系统调用**。

### 1.3.2 用户态用法

```c
#include <sys/mman.h>

void *mmap(void  *addr,    /* 想映射到哪个用户地址，一般传 NULL 让内核挑 */
           size_t length,  /* 映射长度，内核会向上取整到页大小 */
           int    prot,    /* 保护权限 */
           int    flags,   /* 映射类型 */
           int    fd,      /* 设备/文件 fd */
           off_t  offset); /* 文件内偏移，【必须是页大小的整数倍】 */

int munmap(void *addr, size_t length);            /* 解除映射 */
int msync(void *addr, size_t length, int flags);  /* 同步回设备/文件 */
```

| `prot` | 含义 | `flags` | 含义 |
| --- | --- | --- | --- |
| `PROT_READ` | 可读 | `MAP_SHARED` | **改动对其他进程和驱动可见**（驱动映射必选） |
| `PROT_WRITE` | 可写 | `MAP_PRIVATE` | 写时复制，改动只在本进程可见 ❌ 驱动看不到 |
| `PROT_EXEC` | 可执行 | `MAP_ANONYMOUS` | 匿名映射，忽略 fd（纯内存） |
| `PROT_NONE` | 不可访问 | `MAP_POPULATE` | 预建页表，避免首次访问缺页 |
|  |  | `MAP_LOCKED` | 锁定在物理内存，禁止换出 |

```c
/* user_mmap.c */
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>

#define BUF_SIZE (4096 * 4)

int main(void)
{
    int fd = open("/dev/mydev", O_RDWR);
    if (fd < 0) { perror("open"); return 1; }

    void *p = mmap(NULL, BUF_SIZE,
                   PROT_READ | PROT_WRITE,
                   MAP_SHARED,          /* 必须 SHARED，驱动才看得到 */
                   fd, 0);
    if (p == MAP_FAILED) {              /* 注意：失败返回 MAP_FAILED，不是 NULL */
        perror("mmap");
        close(fd);
        return 1;
    }

    /* 下面就是普通内存访问了，不再有任何系统调用 */
    unsigned int *buf = (unsigned int *)p;
    buf[0] = 0x12345678;
    printf("读回 = 0x%08X\n", buf[0]);

    msync(p, BUF_SIZE, MS_SYNC);        /* 需要立刻可见/落盘时调用 */
    munmap(p, BUF_SIZE);                /* 一定要配对释放 */
    close(fd);
    return 0;
}
```

> [!danger] 三个必踩的坑
> 1. **失败判断**：`mmap` 失败返回 `(void *)-1` = `MAP_FAILED`，不是 `NULL`。写 `if (p == NULL)` 会漏判。
> 2. **`offset` 必须页对齐**：不是页大小整数倍直接 `EINVAL`。页大小取 `sysconf(_SC_PAGESIZE)`，一般 4096。
> 3. **必须 `MAP_SHARED`**：用 `MAP_PRIVATE` 的话你的写入只落在本进程的 COW 副本里，驱动那边毫无变化——「映射了但写不进去」的经典现场。

### 1.3.3 驱动侧 `.mmap` 实现

```c
int (*mmap)(struct file *filp, struct vm_area_struct *vma);
/* 成功返回 0，失败返回负 errno */
```

`vma`（virtual memory area）里现成的信息：

| 字段 | 含义 |
| --- | --- |
| `vma->vm_start` / `vma->vm_end` | 用户虚拟地址区间，`size = vm_end - vm_start`（已按页对齐） |
| `vma->vm_pgoff` | 用户传的 `offset >> PAGE_SHIFT`（**单位是页**，不是字节） |
| `vma->vm_page_prot` | 由 `prot` 推导出的页属性（可读可写、缓存策略） |
| `vma->vm_flags` | `VM_SHARED` / `VM_READ` / `VM_WRITE` / `VM_IO` … |
| `vma->vm_private_data` | 驱动可挂私有数据（`open` 时设置） |

核心 API：

```c
#include <linux/mm.h>

int remap_pfn_range(struct vm_area_struct *vma,
                    unsigned long addr,   /* 用户虚拟起始地址 = vma->vm_start */
                    unsigned long pfn,    /* 物理页帧号 = 物理地址 >> PAGE_SHIFT */
                    unsigned long size,   /* = vma->vm_end - vma->vm_start */
                    pgprot_t      prot);  /* = vma->vm_page_prot */
```

#### 1.3.3.1 例一：映射设备寄存器（ioremap 的那块区域）

```c
/* probe 里拿到并保存的物理地址（来自 DTS / platform_resource） */
#define MYDEV_REG_PHYS   0x10000000UL
#define MYDEV_REG_SIZE   0x1000

static int mydev_mmap(struct file *filp, struct vm_area_struct *vma)
{
    unsigned long size = vma->vm_end - vma->vm_start;
    unsigned long pfn;

    if (size != MYDEV_REG_SIZE)
        return -EINVAL;

    /* 【关键坑】ioremap 之后的虚拟地址不能用 virt_to_phys 反推物理地址！
       必须在 probe 里单独保存一份原始 phys。 */
    pfn = MYDEV_REG_PHYS >> PAGE_SHIFT;

    /* 寄存器不能被 cache，否则读到旧值 / 写丢失 */
    vma->vm_page_prot = pgprot_noncached(vma->vm_page_prot);

    if (remap_pfn_range(vma, vma->vm_start, pfn, size, vma->vm_page_prot))
        return -EAGAIN;

    return 0;
}
```

#### 1.3.3.2 例二：映射一块 kmalloc 出来的缓冲

```c
#define MYDEV_BUF_SIZE (PAGE_SIZE * 4)
static void *g_buf;   /* probe 里 kmalloc(MYDEV_BUF_SIZE, GFP_KERNEL) */

static int mydev_mmap(struct file *filp, struct vm_area_struct *vma)
{
    unsigned long size   = vma->vm_end - vma->vm_start;
    unsigned long offset = vma->vm_pgoff << PAGE_SHIFT;   /* pgoff 是页，乘回来变字节 */

    if (offset + size > MYDEV_BUF_SIZE)
        return -EINVAL;                    /* 越界检查不能省 */

    /* 显存 / 大块缓冲常用 write-combining：写快，读慢 */
    vma->vm_page_prot = pgprot_writecombine(vma->vm_page_prot);

    if (remap_pfn_range(vma, vma->vm_start,
                        virt_to_phys(g_buf + offset) >> PAGE_SHIFT,
                        size, vma->vm_page_prot))
        return -EAGAIN;

    return 0;
}
```

> [!note] `remap_pfn_range` 会自己置上 `VM_IO | VM_PFNMAP | VM_DONTEXPAND | VM_DONTDUMP`
> 所以不需要手动加。但要注意：带 `VM_PFNMAP` 的 vma 里的页**不受引用计数保护**，
> 所以在映射期间驱动**绝对不能 `kfree` 这块内存**，否则用户态一访问就是 use-after-free。

#### 1.3.3.3 三种内存怎么映射（选型表）

| 内存来源 | 推荐做法 | 说明 |
| --- | --- | --- |
| 设备寄存器 / 显存 / 预留物理区 | `remap_pfn_range`，用**原始物理地址** `>> PAGE_SHIFT` | 绝不能用 `ioremap` 后的虚拟地址去 `virt_to_phys` |
| `kmalloc` / `__get_free_pages`（物理连续） | `remap_pfn_range(virt_to_phys(...) >> PAGE_SHIFT)` 或逐页 `vm_insert_page()` | 映射期间不能释放 |
| `vmalloc`（虚拟连续、物理不连续） | **只能**逐页 `vm_insert_page(vma, addr, vmalloc_to_page(p))` | 物理不连续，`remap_pfn_range` 会错 |
| DMA 一致性缓冲（`dma_alloc_coherent`） | `dma_mmap_coherent(dev, vma, cpu_addr, dma_handle, size)` | 最省心，cache / IOMMU 都帮你处理好了 |

> [!danger] 同一段 vma 里不能混用 `remap_pfn_range` 和 `vm_insert_page`
> 前者会产生 `VM_PFNMAP`（裸物理页，无引用计数），后者要求普通页（有引用计数）。
> 两者互斥，混用会直接 BUG。

### 1.3.4 缓存策略速查

| 用途 | 页属性函数 | 特点 |
| --- | --- | --- |
| 设备寄存器 | `pgprot_noncached()` | 完全关闭 cache，读写直通总线，最慢但最安全 |
| 显存 / 大块写多读少 | `pgprot_writecombine()` | 写合并，写得快；读会变慢 |
| 普通内存（DMA 描述符等） | 保持默认 `vma->vm_page_prot` | 走 cache |

### 1.3.5 mmap 常见坑

- [ ] 用户态判断写成 `== NULL`（应该判断 `== MAP_FAILED`）
- [ ] `offset` 没页对齐 → `EINVAL`
- [ ] 用了 `MAP_PRIVATE` → 驱动看不到改动
- [ ] 驱动里拿 `ioremap` 之后的虚拟地址做 `virt_to_phys` → pfn 完全错，跑起来数据乱或直接崩
- [ ] 用户态映射长度和驱动里检查的 `size` 不一致 → 驱动返回 `EINVAL`
- [ ] `remap_pfn_range` 已经把 vma 变成 `VM_PFNMAP` 了，还去 `vm_insert_page` / `get_user_pages`
- [ ] `.mmap` 成功时返回了正数（必须是 `0`）
- [ ] 映射了 kmalloc 的 buffer，驱动里却 `kfree` 了 → use-after-free
- [ ] `munmap` 忘了调用 → 进程没退出前一直占着
- [ ] 用户态和驱动同时改这块内存 → 需要自己加锁 / 用 `read`、`write` 语义来同步（`mmap` 本身不提供任何同步）

---

## 1.4 四、实战：用 `/dev/fb0` 把 ioctl + mmap 串起来

FrameBuffer 是最标准的「**ioctl 拿参数 + mmap 拿显存**」组合，两个知识点一次跑通。

```c
/* fb_demo.c —— 在屏幕上画一条红线 */
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>     /* ioctl()      */
#include <sys/mman.h>      /* mmap()       */
#include <linux/fb.h>      /* FBIOGET_* / struct fb_var_screeninfo */

int main(void)
{
    int fd = open("/dev/fb0", O_RDWR);
    if (fd < 0) { perror("open /dev/fb0"); return 1; }

    /* ---- ① ioctl：问驱动要屏幕参数 ---- */
    struct fb_var_screeninfo vinfo;
    struct fb_fix_screeninfo finfo;

    if (ioctl(fd, FBIOGET_VSCREENINFO, &vinfo) < 0) {   /* _IOR('F', 0x04, ...) */
        perror("FBIOGET_VSCREENINFO");
        return 1;
    }
    if (ioctl(fd, FBIOGET_FSCREENINFO, &finfo) < 0) {   /* _IOR('F', 0x02, ...) */
        perror("FBIOGET_FSCREENINFO");
        return 1;
    }

    printf("%ux%u, %u bpp, line_length=%u\n",
           vinfo.xres, vinfo.yres, vinfo.bits_per_pixel, finfo.line_length);

    /* ---- ② mmap：把显存映射到用户空间 ---- */
    long screensize = (long)finfo.line_length * vinfo.yres;
    char *fb = mmap(NULL, screensize,
                    PROT_READ | PROT_WRITE,
                    MAP_SHARED, fd, 0);
    if (fb == MAP_FAILED) { perror("mmap"); return 1; }

    /* ---- ③ 之后就是普通内存写了：在第 10 行画一条红线 ---- */
    int bpp = vinfo.bits_per_pixel / 8;
    for (unsigned int x = 0; x < vinfo.xres; x++) {
        long off = (long)10 * finfo.line_length + (long)x * bpp;
        if (bpp == 4)
            *(unsigned int   *)(fb + off) = 0x00FF0000;   /* ARGB8888 红 */
        else if (bpp == 2)
            *(unsigned short *)(fb + off) = 0xF800;       /* RGB565   红 */
    }

    /* 多缓冲切换才需要 FBIOPAN_DISPLAY + vinfo.yoffset；单缓冲直接写即可 */
    munmap(fb, screensize);
    close(fd);
    return 0;
}
```

> [!tip] 这个例子完美印证了方向宏的语义
> `FBIOGET_VSCREENINFO` 的定义就是 `_IOR('F', 0x04, struct fb_var_screeninfo)` —— 用户「**读**」参数，
> 所以用户态第三参传 `&vinfo`，驱动内部 `copy_to_user(info, &fb_var, sizeof(...))`。**方向是站在用户态看的**。
>
> 而显存那种**成片的大数据**，就交给 `mmap`（驱动侧 `.mmap` 里调 `remap_pfn_range`），不再一条条 ioctl 传。

---

## 1.5 五、ioctl vs mmap 对照

| 维度      | ioctl                            | mmap                                 |
| ------- | -------------------------------- | ------------------------------------ |
| 单次数据量   | ≤ 16383 字节（`size` 域 14 位）        | 一整块，按页任意大                            |
| 系统调用次数  | 每次操作一次                           | 一次映射，后续 **0** 次                      |
| 数据拷贝    | `copy_*_user`（两次拷贝）              | **零拷贝**（只建页表）                        |
| 用户态 API | `ioctl(fd, cmd, arg)`            | `mmap` / `munmap` / `msync`          |
| 驱动侧回调   | `.unlocked_ioctl`                | `.mmap`                              |
| 典型用途    | 配置、复位、单点寄存器、版本号                  | 显存、DMA 缓冲、采集缓冲、大块寄存器                 |
| 并发/同步   | 每次都进内核，天然串行                      | 用户态直接写，**需自行加锁**                     |
| 出错的典型症状 | `Inappropriate ioctl for device` | `Cannot allocate memory` / 映射成功但写不进去 |

> [!tip] 记忆方式
> **ioctl = 打电话点菜（每次喊一声，传个参数）**
> **mmap = 把仓库钥匙给你（一次给到，之后随便搬）**

---

## 1.6 六、相关笔记

- [[100-学习/120-嵌入式/面试八股文/Linux驱动.md|Linux 驱动（八股文）]] —— 里面有 `ioremap` / `mmap` / `remap_pfn_range` 的**原理**对比，和本文互为表里
- [[100-学习/120-嵌入式/面试八股文/Linux系统编程.md|Linux 系统编程（八股文）]]
- [[100-学习/120-嵌入式/linux/Socket网络编程.md|Socket 网络编程]]
- [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread 基本用法]]
- [[100-学习/120-嵌入式/linux/多线程Socket服务器.md|多线程 Socket 服务器]]
- [[100-学习/120-嵌入式/linux路线.md|嵌入式 Linux 学习路线]]
