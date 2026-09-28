# 1 Poll 机制（驱动侧 .poll）

> 让字符设备支持 `select` / `poll` / `epoll` 多路复用
> 内核侧头文件：`#include <linux/poll.h>`（`poll_wait` / `POLLIN` / `wait_queue_head_t`）
> 用户侧头文件：`#include <poll.h>`（或 `<sys/select.h>`、`<sys/epoll.h>`）

> [!success] 一句话结论
> **驱动的 `.poll` 只做两件事：① 把当前进程挂进等待队列 ② 返回一次状态掩码。它自己绝不休眠。**
> 真正的「睡眠—唤醒—重试」是内核 `fs/select.c` 里 `do_poll()` 的 `for(;;)` 循环在做的。

---

## 1.1 一、纠正一个最容易错的理解

| | ❌ 常见误解 | ✅ 实际 |
| --- | --- | --- |
| 驱动 `.poll` 里没数据怎么办 | 在驱动里休眠等数据 | **不休眠**。`poll_wait()` 挂完队列立刻返回，函数随后就 `return mask` |
| 休眠在哪 | 驱动的 poll 里 | 内核核心层：所有 fd 扫完都没事件，才 `poll_schedule_timeout()` 睡在等待队列上 |
| 谁来回唤醒 | （没想清楚） | ① 超时（内核高精度定时器）② 驱动里的 `wake_up_interruptible()`（通常在**中断处理函数**或 write 路径中） |
| 「外层会不断调用驱动的 poll」 | — | ✅ **对**。`for(;;)` 每被唤醒一轮，就重新遍历所有 fd、重新调用一次 `vfs_poll()` → 你的 `.poll` |

### 1.1.1 完整调用链

```
用户态  poll() / select() / epoll_wait()
  │
  ▼
内核 fs/select.c   do_sys_poll() → do_poll()          ← 不同版本函数名略有差异
  │
  │  for (;;) ────────────────────────────────────────┐
  │      │                                            │
  │      ├─► vfs_poll(fd) ──► 驱动 .poll()             │ 每轮都重新调用
  │      │        │                                    │
  │      │        ├─ ① poll_wait()   把当前进程挂进 wq     ← 【不休眠】
  │      │        └─ ② 检查状态，return mask            │
  │      │                                            │
  │      ├─ 有 fd 就绪 ──► 把 mask 填进 revents，返回 ──► 用户态醒来
  │      ├─ 超时       ──► return 0 ─────────────────► 用户态醒来
  │      └─ 都没事件   ──► poll_schedule_timeout() 睡在 wq 上
  │                              │
  │                              └── 被唤醒后回到 for 顶部 ──┘
  │                                  唤醒源：① 超时  ② 驱动 wake_up_interruptible()
  ▼
```

> [!tip] 对照你的手写笔记
> ```
> sys_poll:  for(;;) { ret = drv_poll;  if (ret || 超时) return;  else 休眠一会 }
>                                                              ↑ 休眠在这一层
> drv_poll:  A. 把线程放入 wq，但是未休眠   B. 返回 event 状态
> ```
> **这个理解是准确的。** 唯一要补的是：`poll_wait()` 必须**无条件**调用（见 §1.3.1）。

---

## 1.2 二、驱动侧函数原型

```c
#include <linux/poll.h>

unsigned int (*poll)(struct file *filp, struct poll_table_struct *wait);
/* 返回值是【事件掩码】，不是错误码（这一点和 ioctl/mmap 都不一样） */
```

### 1.2.1 返回掩码常用位

| 掩码 | 含义 | 说明 |
| --- | --- | --- |
| `POLLIN` | 可读 | 通常和 `POLLRDNORM` 一起返回 |
| `POLLRDNORM` | 有普通数据可读 | 和 `POLLIN` 成对，是规范写法 |
| `POLLPRI` | 有紧急数据可读 | 带外数据 |
| `POLLOUT` | 可写 | 通常和 `POLLWRNORM` 一起返回 |
| `POLLWRNORM` | 有空间可写 | |
| `POLLERR` | 出错 | 驱动主动置位可**强制唤醒**等待者 |
| `POLLHUP` | 挂断（对端关闭） | 同上 |
| `POLLNVAL` | fd 无效 | 主要由内核核心层置位 |

> [!note] 返回 `0` 就是「当前没事件」
> 驱动只需报告**自己关心的那几位**，用户态在 `revents` 里检查。返回 0 不是错误。

### 1.2.2 `poll_wait` 到底做了什么

```c
static inline void poll_wait(struct file *filp,
                             wait_queue_head_t *queue,   /* 驱动自己的等待队列头 */
                             poll_table *wait)           /* 核心层传进来的 poll_table */
{
    if (wait && wait->_qproc && queue)
        wait->_qproc(filp, queue, wait);    /* ← 只有这一件事 */
}
```

它**只负责挂队列**，不睡眠、不检查数据、不返回状态。真正干活的 `_qproc` 是谁，取决于走哪条路径：

| 调用路径 | `poll_table->_qproc` | 实际干了什么 |
| --- | --- | --- |
| `select` / `poll` | `__pollwait` | 把 `poll_wqueues` 里的一项挂到驱动给的等待队列上 |
| `epoll`（**注册**那一次） | `ep_ptable_queue_proc` | 挂上去的是 `ep_poll_callback`，之后驱动 `wake_up` 会触发它，把 epitem 丢进就绪链表 |
| `epoll`（**扫描**就绪链表时） | `NULL` | `poll_wait()` 变成**空操作**，只取状态 |

> [!warning] 由此推出一个重要结论：epoll 下 `poll_wait()` 只真正生效一次
> epoll 的「挂队列」发生在 `epoll_ctl()` 那一刻（`ep_insert` → `vfs_poll`，此时 `_qproc != NULL`）；
> 之后 `epoll_wait()` 重新调用你的 `.poll` 时，内核传进来的 poll table 里 `_qproc` 是 `NULL`（`ep_send_events_proc()` 里 `init_poll_funcptr(&pt, NULL)`），`poll_wait()` 相当于啥也没干。
>
> **驱动代码一个字都不用改**——这恰恰是 `.poll` 这个统一回调的设计目的。但你要知道这件事，才不会在「为什么 epoll 场景下没走挂队列的逻辑」上卡住。

---

## 1.3 三、标准模板（韦东山 gpio_key 那一版）

```c
#include <linux/poll.h>

static DECLARE_WAIT_QUEUE_HEAD(gpio_key_wait);

static int is_key_buf_empty(void)
{
    return (g_key_head == g_key_tail);
}

/* ★ 全部代码就这么多 */
static unsigned int gpio_key_drv_poll(struct file *fp, poll_table *wait)
{
    poll_wait(fp, &gpio_key_wait, wait);              /* ① 挂队列，不休眠 */
    return is_key_buf_empty() ? 0 : (POLLIN | POLLRDNORM);  /* ② 报告状态 */
}
```

### 1.3.1 为什么必须**无条件**调用 `poll_wait`

```c
/* ❌ 错误写法：想着「反正有数据时不用等，就不用挂了」 */
if (is_key_buf_empty())
    poll_wait(fp, &gpio_key_wait, wait);
return is_key_buf_empty() ? 0 : (POLLIN | POLLRDNORM);
```

会踩这个 race：

```
进程 A: 检查 → 缓冲区空 → poll_wait 挂队列 → return 0 → 睡下      ✅ 正常
进程 B: 检查 → 缓冲区【不】空 → 没挂队列 → return POLLIN → 读走数据
        此时队列里一个等待者都没有
        之后又有按键中断 → wake_up_interruptible(&wq) → 空的，没人醒
进程 B 下一轮 poll：缓冲区空 → 挂队列 → 睡下 → 谁来唤醒？没人 → 【永久睡死】
```

**正确顺序是「先挂号，再看病」**：先把进程挂进队列，再检查状态。这样检查完之后即使立刻来中断，`wake_up` 也一定能找到你。

> [!tip] 顺带一提：不需要判断 `wait` 是不是 NULL
> `poll_wait()` 内部已经有 `if (wait && wait->_qproc && queue)` 判空了，驱动里直接调用即可。

### 1.3.2 读队列 / 写队列要分开

```c
struct mydev_dev {
    wait_queue_head_t rq;   /* 可读等待队列 */
    wait_queue_head_t wq;   /* 可写等待队列 */
    bool data_ready;
    bool space_free;
};

static unsigned int mydev_poll(struct file *filp, poll_table *wait)
{
    struct mydev_dev *dev = filp->private_data;   /* open 时设置 */
    unsigned int mask = 0;

    poll_wait(filp, &dev->rq, wait);
    poll_wait(filp, &dev->wq, wait);

    if (dev->data_ready)
        mask |= POLLIN | POLLRDNORM;
    if (dev->space_free)
        mask |= POLLOUT | POLLWRNORM;

    return mask;
}
```

> [!note] 为什么分开
> 有数据可读时只该唤醒「等读」的进程，有空间可写时只该唤醒「等写」的进程。
> 用同一个队列的话，每次 `wake_up` 都会把无关的进程全部唤醒 → **惊群**，白跑一轮又睡回去。

---

## 1.4 四、谁来 `wake_up`（另一半机制）

驱动里光有 `.poll` 不够，**必须有人在状态变化时唤醒等待队列**，否则用户态永远等不到。

```c
/* ★ 典型位置一：中断处理函数 */
static irqreturn_t key_isr(int irq, void *dev_id)
{
    int key = read_key_hw();

    if (!key_buf_full()) {
        g_keys[g_head] = key;
        g_head = (g_head + 1) % KEY_BUF_MAX;
    }

    wake_up_interruptible(&g_key_wait);   /* ★ 唤醒睡在 poll/select/epoll 上的进程 */
    return IRQ_HANDLED;
}

/* ★ 典型位置二：write 路径（写完之后「可读」条件成立了） */
static ssize_t mydev_write(struct file *filp, const char __user *buf,
                           size_t len, loff_t *off)
{
    if (copy_from_user(g_buf, buf, len))
        return -EFAULT;
    g_data_ready = true;
    wake_up_interruptible(&g_rq);         /* ★ 把等读的进程叫醒 */
    return len;
}
```

| 函数                               | 唤醒范围                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| `wake_up_interruptible(&q)`      | 只唤醒 `TASK_INTERRUPTIBLE`（**select/poll/epoll 走的就是可中断睡眠，够用**） |
| `wake_up(&q)`                    | 可中断 + 不可中断都唤醒（范围更大，可能顺带叫醒不该醒的进程）                             |
| `wake_up_interruptible_all(&q)`  | 唤醒该队列上全部可中断睡眠者                                               |
| `wake_up_interruptible_sync(&q)` | 唤醒时不让被唤醒者抢占当前 CPU（降低延迟敏感场景的抖动）                               |

> [!warning] 唤醒函数要和睡眠方式**匹配**
> `poll` / `select` / `epoll` 让进程进入的是可中断睡眠，所以驱动里用 `wake_up_interruptible()` 最合适。
> 反过来，如果同一份代码里有人用**不可中断**的 `wait_event()` 睡（注意 `wait_event_interruptible()` 才是可中断版），你用 `wake_up_interruptible()` 去叫他就叫不醒——这是驱动里最经典的一类「卡死」。

### 1.4.1 `read` 里的等待要复用同一个队列

`.poll` 报了 `POLLIN` 之后，用户态通常会接着 `read()`。这时 `read` 自己也可能需要等：

```c
static ssize_t key_read(struct file *fp, char __user *buf, size_t len, loff_t *off)
{
    int key;

    if (key_buf_empty()) {
        if (fp->f_flags & O_NONBLOCK)         /* 非阻塞：poll 语义下应该走 EAGAIN */
            return -EAGAIN;
        if (wait_event_interruptible(g_key_wait, !key_buf_empty()))
            return -ERESTARTSYS;              /* 被信号打断 */
    }

    key = g_keys[g_tail];
    g_tail = (g_tail + 1) % KEY_BUF_MAX;

    if (copy_to_user(buf, &key, sizeof(key)))
        return -EFAULT;
    return sizeof(key);
}
```

> [!danger] 两处必须用**同一个** `wait_queue_head_t`
> `.poll` 里 `poll_wait` 挂的是 `g_key_wait`，`read` 里 `wait_event_interruptible` 等的也是 `g_key_wait`，
> 中断里 `wake_up` 唤醒的还是 `g_key_wait`。三处只要有一处写成别的队列，就会表现成「poll 说可读，read 却卡住」。

---

## 1.5 五、用户态怎么用

```c
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <poll.h>          /* poll() / struct pollfd */

int main(void)
{
    int fd = open("/dev/gpio_key", O_RDWR | O_NONBLOCK);
    if (fd < 0) { perror("open"); return 1; }

    struct pollfd fds[1];
    fds[0].fd     = fd;
    fds[0].events = POLLIN;        /* 我想监听「可读」 */

    for (;;) {
        int ret = poll(fds, 1, 5000);      /* 超时 5000ms；传 -1 = 无限等待 */
        if (ret < 0) {
            if (errno == EINTR)            /* 被信号打断，重试 */
                continue;
            perror("poll");
            break;
        }
        if (ret == 0) {
            printf("超时，没按键\n");
            continue;
        }
        if (fds[0].revents & POLLIN)       /* ★ 必须具体判位，不能只看 revents != 0 */
            printf("有按键事件\n");
    }

    close(fd);
    return 0;
}
```

> [!warning] 用户态三个易错点
> 1. **`revents` 要按位判**：写 `if (fds[0].revents)` 会把 `POLLERR` / `POLLHUP` 也当成「有数据可读」。
> 2. **返回后要重置**：`poll()` 返回后 `revents` 才有值，每次调 `poll()` 前如果改过 `events` 才需要重设；`revents` 由内核清零。
> 3. **`EINTR` 要处理**：被信号打断时返回值是 -1，不是超时，直接当错误退出会莫名「poll 失败」。

### 1.5.1 `poll` / `select` / `epoll` 对比（用户态视角）

| | `select` | `poll` | `epoll` |
| --- | --- | --- | --- |
| 头文件 | `<sys/select.h>` | `<poll.h>` | `<sys/epoll.h>` |
| fd 数量上限 | **1024**（`FD_SETSIZE`） | 无硬上限 | 无硬上限 |
| 每次调用要传 | 三个 fd 位图 + 最大 fd | `pollfd` 数组 | 什么都不用传，只传就绪数组 |
| 每轮内核开销 | **O(n)** 重扫所有 fd + 拷位图 | **O(n)** 重扫所有 fd + 拷数组 | **O(就绪数)**，靠回调进就绪链表 |
| 返回后 | 要遍历所有 fd 找谁就绪 | 遍历数组看 `revents` | 拿到的就是就绪列表 |
| 触发模式 | 水平触发 | 水平触发 | 水平 + **边缘触发 EPOLLET** |
| 适合 | 老代码、fd 很少 | fd 数量中等 | 高并发（成千上万连接） |

> [!tip] 关键共同点：**三者最终都调用驱动的同一个 `.poll` 回调**
> 驱动只需实现一次 `.poll`，`select` / `poll` / `epoll` 通吃。
> 差别只在「谁来睡、醒来之后怎么重新扫描」——这是内核核心层的事，驱动不用管。

---

## 1.6 六、完整最小示例

```c
/* key_drv.c —— 按键驱动：中断存数据 + poll 通知用户态 */
#include <linux/module.h>
#include <linux/fs.h>
#include <linux/miscdevice.h>
#include <linux/poll.h>
#include <linux/uaccess.h>
#include <linux/interrupt.h>

#define KEY_BUF_MAX 16
#define KEY_IRQ     100          /* 示例用，实际从 DTS 拿 */

static DECLARE_WAIT_QUEUE_HEAD(g_key_wait);   /* ★ 唯一的等待队列 */
static int g_keys[KEY_BUF_MAX];
static int g_head, g_tail;

static bool key_buf_empty(void) { return g_head == g_tail; }
static bool key_buf_full(void)  { return (g_head + 1) % KEY_BUF_MAX == g_tail; }

/* ---------- ★ 驱动侧 poll：挂队列 + 报告状态，就这两件事 ---------- */
static unsigned int key_poll(struct file *fp, poll_table *wait)
{
    poll_wait(fp, &g_key_wait, wait);          /* ① 无条件挂队列，不休眠 */
    return key_buf_empty() ? 0 : (POLLIN | POLLRDNORM);   /* ② 报告状态 */
}

/* ---------- read：空则按阻塞/非阻塞分别处理 ---------- */
static ssize_t key_read(struct file *fp, char __user *buf, size_t len, loff_t *off)
{
    int key;

    if (key_buf_empty()) {
        if (fp->f_flags & O_NONBLOCK)
            return -EAGAIN;
        if (wait_event_interruptible(g_key_wait, !key_buf_empty()))
            return -ERESTARTSYS;               /* 和 poll 用同一个队列 */
    }

    key = g_keys[g_tail];
    g_tail = (g_tail + 1) % KEY_BUF_MAX;

    if (copy_to_user(buf, &key, sizeof(key)))
        return -EFAULT;
    return sizeof(key);
}

/* ---------- 中断：存数据 + 唤醒 ---------- */
static irqreturn_t key_isr(int irq, void *dev_id)
{
    int key = 1;                               /* 示例：实际读 GPIO 得到键值 */

    if (!key_buf_full()) {
        g_keys[g_head] = key;
        g_head = (g_head + 1) % KEY_BUF_MAX;
    }

    wake_up_interruptible(&g_key_wait);        /* ★ 唤醒所有等这个队列的进程 */
    return IRQ_HANDLED;
}

static const struct file_operations key_fops = {
    .owner   = THIS_MODULE,
    .read    = key_read,
    .poll    = key_poll,
    .llseek  = no_llseek,
};

static struct miscdevice key_misc = {
    .minor = MISC_DYNAMIC_MINOR,
    .name  = "gpio_key",                       /* → /dev/gpio_key */
    .fops  = &key_fops,
};

static int __init key_init(void)
{
    int ret = misc_register(&key_misc);
    if (ret)
        return ret;
    return request_irq(KEY_IRQ, key_isr, IRQF_TRIGGER_FALLING, "gpio_key", NULL);
}

static void __exit key_exit(void)
{
    free_irq(KEY_IRQ, NULL);
    misc_deregister(&key_misc);
}

module_init(key_init);
module_exit(key_exit);
MODULE_LICENSE("GPL");
```

> 模块骨架（`misc_register` / `module_init`）和 `.unlocked_ioctl` 的写法见 [[100-学习/120-嵌入式/linux/ioctl和mmap用法.md|ioctl 与 mmap 用法]]。

---

## 1.7 七、常见坑清单

- [ ] 以为驱动 `.poll` 里会休眠，或者在里面写了 `msleep` / `wait_event` → `poll` 语义直接废掉
- [ ] `poll_wait()` 写在 `if (没数据)` 里面 → 丢唤醒，进程**永久睡死**
- [ ] `.poll` 挂的队列和 `read` 等待的队列、`wake_up` 唤醒的队列**不是同一个**
- [ ] 状态变化了却**忘了 `wake_up`**（尤其是只在中断里改状态，忘了唤醒）
- [ ] 用 `wake_up_interruptible` 去唤醒不可中断睡眠的 `wait_event()` → 叫不醒
- [ ] 读写共用一个等待队列 → 惊群，无关进程被反复唤醒
- [ ] 在 `.poll` 里加锁 / 做耗时操作 → 拖慢整轮扫描（`.poll` 应该尽可能快地返回）
- [ ] 用户态 `if (fds[0].revents)` 不判位，把 `POLLHUP` 当成可读
- [ ] `poll()` 收到 `EINTR` 就退出，不重试
- [ ] `select` 场景下 fd 超过 1024 → 静默截断
- [ ] 用户态开了 `O_NONBLOCK` 却指望 `read` 阻塞等待（应该先 `poll` 再 `read`）

> [!danger] 「poll 说可读，read 却卡住」怎么排查
> 依次问三个问题：
> 1. `.poll` 返回的掩码和 `read` 里判断的条件，是不是**同一个变量**？
> 2. `.poll` 的 `poll_wait` / `read` 的 `wait_event_*` / 中断里的 `wake_up`，**队列是不是同一个**？
> 3. `read` 里有没有正确区分 `O_NONBLOCK`？阻塞模式下有没有用 `wait_event_interruptible` 而不是死循环？

---

## 1.8 八、和 user 空间三种多路复用的对应关系

```text
        ┌──────────┐   ┌──────────┐   ┌──────────┐
用户态   │  select  │   │   poll   │   │  epoll   │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                      vfs_poll(fd)                  ← 统一入口
                            ▼
            驱动唯一需要实现的东西： .poll
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
        ① poll_wait() 挂队列    ② return 事件掩码
                            │
                            ▼
              驱动状态变化时 wake_up_interruptible()
              （中断处理函数 / write 路径 / 定时器 …）
```

---

## 1.9 九、相关笔记

- [[100-学习/120-嵌入式/linux/ioctl和mmap用法.md|ioctl 与 mmap 用法]] —— 同一套 `file_operations` 的另外两个成员
- [[100-学习/120-嵌入式/面试八股文/Linux驱动.md|Linux 驱动（八股文）]] —— `file_operations` 总览与面试答法
- [[100-学习/120-嵌入式/面试八股文/Linux系统编程.md|Linux 系统编程（八股文）]]
- [[300-项目/嵌入式/韦东山课程/路线梳理.md|韦东山课程 · 路线梳理]] —— 本节的课程出处
- [[100-学习/120-嵌入式/linux/Socket网络编程.md|Socket 网络编程]]
- [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread 基本用法]]
- [[100-学习/120-嵌入式/linux路线.md|嵌入式 Linux 学习路线]]
