# 1 多线程 Socket 服务器

> 从「单线程 accept」改造为「一连接一线程」的并发服务器
> 配套：[[100-学习/120-嵌入式/linux/Socket网络编程.md|Socket网络编程]] ｜ [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread基本用法]]

---

## 1.1 一、先回答两个 TODO

### 1.1.1 `htonl` 和 `htons` 有什么区别？

`h` = host（主机序），`n` = network（网络序），`to` = 转成。

| 函数 | 全称 | 处理位数 | 用于 |
| --- | --- | --- | --- |
| `htons` | **h**ost **to** **n**etwork **s**hort | **16 位** | `sin_port` 端口号 |
| `htonl` | **h**ost **to** **n**etwork **l**ong | **32 位** | `sin_addr.s_addr` IPv4 地址 |
| `ntohs` / `ntohl` | 反向 | 16 / 32 位 | 收数据时转回主机序 |

> [!tip] 口诀：**s 管端口，l 管地址。**
> 端口是 16 位 → `htons`；IPv4 地址是 32 位 → `htonl`。
> 注意 64 位机上 `htonl` 的参数依然是 **32 位**，别把 `long` 传进去。

**那 `htonl(INADDR_ANY)` 是不是多此一举？**

是——但不影响。因为 `INADDR_ANY` 定义为 `0x00000000`，零的字节序在大小端下完全一样：

```c
#define INADDR_ANY  ((in_addr_t) 0x00000000)

htonl(INADDR_ANY) == INADDR_ANY   // 成立
```

所以下面两种写法都对：

```c
address.sin_addr.s_addr = htonl(INADDR_ANY);   // 你写的，对称好看
address.sin_addr.s_addr = INADDR_ANY;          // 简写，等价
```

但**一旦换成具体 IP 就必须转**：

```c
inet_pton(AF_INET, "127.0.0.1", &address.sin_addr);  // ✅ 推荐，内部已转网络序
address.sin_addr.s_addr = htonl(0x7f000001);          // ✅ 手动写也行
address.sin_addr.s_addr = 0x7f000001;                 // ❌ 小端机上变成 1.0.0.127
```

> [!note] `sin_family = AF_INET` 不需要转换
> `sin_family` 只是内核本地使用的常量，不走网络，不用 `htons`。

### 1.1.2 怎么创建一个新线程来接收？

你写的 `pthread_create(NULL, NULL, handle_read, NULL)` 有**两个 bug**：

```c
pthread_create(NULL, NULL, handle_read, NULL);
//             ↑ bug1        ↑ bug2
```

- **bug1**：第一个参数是 `pthread_t *` 的**传出参数**，内核要往里写线程 ID。传 `NULL` 会让内核往地址 0 写 → **段错误 / 返回 EFAULT**。必须传真实变量地址。
- **bug2**：`handle_read` 没有接收 fd，线程起来了也不知道该读写哪个连接。

正确形态：

```c
pthread_t tid;
pthread_create(&tid, NULL, handle_read, /* 把 fd 传进去 */);
pthread_detach(tid);   // 或者 join
```

---

## 1.2 二、你的代码逐条 Review

### 1.2.1 🔴 会崩 / 功能性错误

| # | 位置 | 问题 | 修法 |
| --- | --- | --- | --- |
| 1 | `pthread_create(NULL, ...)` | 第一个参数不能是 `NULL` | 传 `&tid` |
| 2 | `socklen_t clnt_socklen;` | **未初始化**，`accept` 需要它作为输入（值-结果参数） | `= sizeof(clnt_address)` |
| 3 | `handle_read()` 收不到 fd | 线程不知道操作哪个 socket | 用 `arg` 传 |
| 4 | `int clnt_fd` 是循环内局部变量 | 传给线程后下一轮被覆盖 | `malloc` 一份拷贝，或转成 `intptr_t` |
| 5 | 线程没 `detach` 也没 `join` | 线程**结束后**资源不回收 → 僵尸线程泄漏（见 1.2.5） | `pthread_detach(tid)` |
| 6 | 没有 `close(clnt_fd)` | fd 泄漏，跑一会儿就 `EMFILE` | 线程结束时 `close` |
| 7 | `accept` 失败就 `return 1` | 单个连接出错**拖垮整个服务器** | 改 `continue` |

### 1.2.2 🟡 健壮性缺失

| # | 问题 | 说明 |
| --- | --- | --- |
| 8 | 没处理 `SIGPIPE` | 客户端提前断开后 `write` 触发 `SIGPIPE`，**默认动作是杀死进程** |
| 9 | 没处理 `EINTR` | `accept`/`read` 被信号打断返回 -1，应重试而不是当错误 |
| 10 | 没检查 `pthread_create` 返回值 | 建线程失败会静默丢连接 |
| 11 | 没设 `SO_REUSEADDR` | 重启服务器时 `bind` 报 `EADDRINUSE` |
| 12 | 没做 `-lpthread` | 见第五节编译命令 |

### 1.2.3 🟢 代码风格 / 习惯

| # | 问题 | 建议 |
| --- | --- | --- |
| 13 | `#include <bits/types.h>` | glibc **内部私有头**，禁止直接包含；非 glibc 平台根本不存在。`socklen_t` 由 `<sys/socket.h>` 提供 |
| 14 | `int fd;` 用全局变量 | 完全没必要，还容易和线程里的局部 fd 混淆。改成 `main` 里的 `lfd`，连接 fd 靠参数传 |
| 15 | `void *handle_read();` | C 里空括号 = 参数未指定，失去类型检查。写 `void *handle_read(void *arg);` |
| 16 | `while(true)` 之后的 `return 0;` | 死代码，编译器可能警告 |
| 17 | `argc/argv` 没用 | 可以拿来接端口号参数 |

> [!danger] 第 3/4 条是「一连接一线程」最容易翻车的地方
> `int clnt_fd` 在 `while` 循环里，每轮 `accept` 都会**覆盖同一个栈变量**。
> 如果你写成 `pthread_create(&tid, NULL, handle_read, &clnt_fd)`：
> - 线程 A 拿到的是 `&clnt_fd`
> - 循环下一轮 `accept` 把 `clnt_fd` 改成 B 的 fd
> - 线程 A 醒来读的是 **B 的连接**，数据错乱
>
> 这就是 [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread基本用法]] 里说的「传循环变量地址」陷阱。

### 1.2.4 关于 `pthread_*` 的错误处理

`pthread_*` 系列**不设置 `errno`**，而是直接返回错误码，所以 **不能 `perror`**：

```c
int ret = pthread_create(&tid, NULL, handle_read, pfd);
if (ret != 0) {
    fprintf(stderr, "pthread_create: %s\n", strerror(ret));  // ✅
    // perror("pthread_create");                              // ❌ 输出不准
}
```

### 1.2.5 澄清：`while(true)` 的线程什么时候会结束？那还需要 `detach` 吗？

> 先明确一点：**说「线程结束」不是说它会自己结束，而是说它迟早会结束——而那一刻需要有人回收资源。**

`while(true)` 保证的是「线程不会因为循环条件为假而退出」。它退出的路径只有一条：
**`read` 返回 `<= 0` → `break` → `return NULL`。**

那 `read` 什么时候会返回？

| 情况 | `read` 返回 | 触发条件 |
| --- | --- | --- |
| 客户端正常关闭（`close()` / 正常退出） | `0` | 收到 **FIN** |
| 客户端进程被 `kill -9` / 崩溃 | `-1`，`errno = ECONNRESET` | 收到 **RST** |
| 客户端断电 / 拔网线 | **一直阻塞** | 既没 FIN 也没 RST |

前两种是日常必然发生的。所以「客户端断开」这件事只是**早晚问题**——每创建一个线程，就必然有它对应的「结束」那一刻。

#### 1.2.5.1 两个问题要分开看

| 阶段 | 占用什么 | `detach` / `join` 能解决吗 |
| --- | --- | --- |
| 线程**运行中** | 用户态栈（默认 8MB 虚拟）+ 内核 `task_struct` + 打开的 fd | ❌ **不能**。只能靠限制线程总数 → 线程池 |
| 线程结束**之后** | 线程描述符 + 栈内存 + 返回值存放区 | ✅ **就是** `detach` / `join` 的作用 |

我 review 里说的第 5 条，指的是**第二行**：线程已经跑完 `return NULL` 了，但没 `join` 也没 `detach`，glibc 就不会回收它。

#### 1.2.5.2 glibc 里的具体机制

- 线程的**栈和 TCB 是同一块 `mmap` 出来的内存**
- joinable 线程退出时，这块内存**不立即释放**——因为要留着给 `pthread_join` 取返回值、读退出状态
- 只有 `pthread_join()` 被调用（或线程本身是 detached 状态），这块内存才回收 / 放进栈缓存复用
- **既不 join 也不 detach** → 每来一个客户端就漏一块，直到进程退出

> [!warning] 为什么你现在「感觉不到」问题
> 因为当前测试场景是：客户端连上、发几条、断开，连接数个位数。
> 一旦出现下面任一情况，泄漏就会变得显眼——`top` 里 VSZ 持续上涨，最后 `pthread_create` 开始返回 `EAGAIN`：
> - 连接数上千（压测 / 长时间运行）
> - **或者你加上了那个空闲超时定时器**
>
> 所以：**空闲超时是「让线程能更早结束」的优化，`detach` 是「线程结束后能被回收」的必须。两者互相独立、不能替代——而且前者会让后者变得更紧迫。**

#### 1.2.5.3 结论

`while(true)` 和 `detach` **完全不冲突**：

- `while(true)` 决定线程**活着的时候干什么**
- `detach` 决定线程**死了之后谁来收尸**

三个 `detach` 的等价写法，任选其一：

```c
/* 1. 创建后立刻 detach（最常用） */
pthread_t tid;
pthread_create(&tid, NULL, handle_read, pfd);
pthread_detach(tid);

/* 2. 线程自己 detach 自己（线程函数第一行） */
void *handle_read(void *arg) {
    pthread_detach(pthread_self());
    ...
}

/* 3. 创建时用属性设为分离态（省掉一次函数调用） */
pthread_attr_t attr;
pthread_attr_init(&attr);
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
pthread_create(&tid, &attr, handle_read, pfd);
pthread_attr_destroy(&attr);
```

> [!note] 什么时候反而**不该** detach？
> 当你需要线程的**返回值**或者需要**等待它跑完**的时候，就该用 `join`。
> 比如「主线程要把 100 个任务分给 100 个线程，然后统计结果」——这时必须 `join`。
> 而「一连接一线程」这种各自独立、主线程不关心结果的场景，`detach` 最合适。

### 1.2.6 为什么线程里传的是 `cfd`，而不是 `lfd`？

**因为它们是两个完全不同的东西，而且一个 `lfd` 会对应很多个 `cfd`。**

| | `lfd`（监听套接字） | `cfd`（连接套接字） |
| --- | --- | --- |
| 怎么来的 | `socket()` 创建 | `accept()` 返回，**每 accept 一次就新建一个** |
| 身份 | 服务器自己的，**不属于任何客户端** | 代表**某一台特定客户端**的这条连接 |
| 数量 | 全程只有 1 个 | 有几个客户端就有几个 |
| 用途 | 只负责「等人来敲门」 | 真正收发数据 |
| 对它 `read` / `write` | **会直接失败**，永远读不到数据 | 正常读写 |

打个比方：

- `lfd` = 公司**前台总机**，只负责接听、转接
- `cfd` = 转接之后你和某个客户之间的**专线**
- 谈业务要用专线。拿总机去谈业务，总机只会说「请问您找哪位」

所以线程里必须拿 `cfd`——因为**每个线程负责的是「某一个客户端」这条连接**，而 `lfd` 谁都代表不了。

#### 1.2.6.1 为什么你会记得「两边都用服务端的 fd」？

**原因一：单连接的 demo 里，数字看起来是对称的。**

```
服务端：lfd = 3,  cfd = 4      ← 读写用的是 cfd = 4
客户端：sockfd = 3             ← 读写用的是自己的 3
```

看着都像"在用 fd"，但服务端用的从来是 `cfd`，不是 `lfd`。

**原因二（更关键）：fd 是「进程内」的编号，没有跨进程意义。**

```
服务端进程                        客户端进程
  文件描述符表                      文件描述符表
  [0] 标准输入                      [0] 标准输入
  [1] 标准输出                      [1] 标准输出
  [2] 标准错误                      [2] 标准错误
  [3] → lfd                        [3] → sockfd ──┐
  [4] → cfd  ────────────────────────┘            │
                同一条 TCP 连接的两端
```

**服务端的 fd=4 和客户端的 fd=3 描述的是同一条连接**——但 `4` 和 `3` 只是各自进程「文件描述符表里的第几项」，纯属巧合。你没法把服务端的 fd 号发给客户端用。

所以你记忆里的「两边都用服务端的 fd」，准确说法应该是：**两边读写的是同一条连接的两端**。

#### 1.2.6.2 如果多个线程都去读 `lfd` 会怎样？

这正是必须用 `cfd` 的另一个理由：

- `lfd` 是**共享的**，主线程和所有工作线程都看得见
- 假设 10 个线程都去 `read(lfd)`：
  - 首先**读不到任何数据**（对监听套接字做 `read` 会直接失败，`errno` 为 `EINVAL` / `ENOTCONN`）
  - 就算能读到，也**无法区分这份数据属于哪个客户端**
- 所以 `lfd` 只能在主线程里 `accept`，**每个线程必须持有自己的 `cfd`**

> [!tip] 一句话总结
> `lfd` 是「前台」，`cfd` 是「专线」。前台只有一个，专线一人一条。
> **`accept` 的作用就是「交给你一条新专线」——它返回的 `cfd` 就是这条专线。**

### 1.2.7 `pthread_detach` 会阻塞吗？主循环会不会变成「一次只能处理一个连接」？

**不会阻塞。`pthread_detach` 是立即返回的。**

你担心的那个会阻塞的函数叫 **`pthread_join`**。两个名字只差一个字母，行为却完全相反：

| | 是否阻塞 | 干什么 |
| --- | --- | --- |
| `pthread_join(tid, &ret)` | ✅ **阻塞**，一直等到目标线程结束才返回 | 等它 + 收尸 + 取返回值 |
| `pthread_detach(tid)` | ❌ **立即返回** | 只打个标记：「这线程结束后自己回收，不用等我」 |

所以你的循环实际是这个节奏——**主线程从不停下来等任何一个客户端**：

```
主线程:   accept ──> create ──> detach ──> accept ──> create ──> detach ──> ...
                      │  立刻返回            │
线程A:                └─> handle_read 阻塞在自己的 read ────────> 收到数据 → 处理
线程B:                                         └─> handle_read 阻塞在自己的 read ──> ...
```

1. `accept` 返回一个客户端
2. `pthread_create` 造出一条新线程，**立即返回**
3. `pthread_detach` 打个标记，**立即返回**
4. 主线程回到 `accept`，继续等下一个客户端
5. 与此同时，线程 A、B、C… 都在**并行**跑各自的 `handle_read`

> [!warning] 但如果把 `detach` 换成 `join`，你担心的「串行」就真的发生了
> ```c
> pthread_create(&tid, NULL, handle_read, pfd);
> pthread_join(tid, NULL);   // ❌ 卡在这里，直到这个客户端断开！
> ```
> `join` 会一直等 `handle_read` 返回，而 `handle_read` 要等客户端断开才返回。
> 结果：**客户端不断开 → `join` 不返回 → 主循环回不到 `accept` → 第二个客户端连不上**（只能躺在 backlog 队列里干等）。
>
> 这才是真正的「一次只能处理一个连接」。**所以这个场景必须用 `detach`，不能用 `join`。**
> 你的直觉是对的，只是把 `detach` 和 `join` 记混了。

#### 1.2.7.1 那「并发」到底是谁提供的？

不是 `detach` 提供的，是 **`pthread_create` 提供的**。

- `pthread_create` 有点像 `fork`：**调用它的那一刻，一条新的执行流就诞生了**，它和主线程同时跑、各跑各的
- `detach` 只是**改了个属性**（结束后是否自动回收内存），跟「要不要等它」完全无关

#### 1.2.7.2 那它算「像 `poll` 一样异步」吗？

不太一样，但你的直觉方向是对的——两者都是「实现并发的路子」，只是思路相反：

| | `poll` / `epoll` | `pthread_create` + 阻塞 read |
| --- | --- | --- |
| 模型 | **单线程 + 事件驱动** | **多线程 + 阻塞式** |
| 谁管连接 | 一个线程管所有连接 | 一个线程管一个连接 |
| 线程卡在 `read` 上 | 不允许（会拖垮所有连接） | ✅ 无所谓，因为**别的线程在跑** |
| 代码难度 | 要写状态机，难 | 顺序式写法，简单 |
| 代价 | 复杂 | 线程多、内存和切换开销大 |

「一连接一线程」属于右边这一列：**卡在自己的 `read` 上不是问题，因为并发是靠「多条线程同时卡着」实现的**。

> [!tip] 主线程卡在 `accept` 上算浪费吗？
> 不算。它在等的就是「新客户端」，这是它唯一的职责。
> 已有连接的收发全由各自的工作线程负责，跟主线程卡不卡无关。
> 这也正是「一连接一线程」的含义：**主线程只做接待，不干活。**

---

## 1.3 三、修正后的完整代码

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>        // close / read / write
#include <signal.h>        // signal / SIGPIPE / SIG_IGN
#include <pthread.h>
#include <sys/socket.h>    // socket bind listen accept
#include <netinet/in.h>    // sockaddr_in INADDR_ANY
#include <arpa/inet.h>     // htons htonl ntohs inet_ntop

#define PORT       8080
#define BUF_SIZE   1024

/* 注意：参数必须有 void *，返回值是 void * */
void *handle_read(void *arg);

int main(void) {
    /* 客户端提前断开时，write 会触发 SIGPIPE，默认动作是【杀死进程】。
       忽略它，让 write 返回 -1 并置 errno = EPIPE，我们才有机会处理。 */
    signal(SIGPIPE, SIG_IGN);

    /* ---------- 1. 创建监听 socket ---------- */
    int lfd = socket(AF_INET, SOCK_STREAM, 0);
    if (lfd < 0) {
        perror("socket");
        return 1;
    }

    /* 端口复用：避免 TIME_WAIT 期间重启报 EADDRINUSE */
    int opt = 1;
    setsockopt(lfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    /* ---------- 2. bind ---------- */
    struct sockaddr_in address;
    memset(&address, 0, sizeof(address));          // 顺带清零 sin_zero
    address.sin_family      = AF_INET;             // 不需要字节序转换
    address.sin_port        = htons(PORT);         // 16 位 → htons
    address.sin_addr.s_addr = htonl(INADDR_ANY);   // 32 位 → htonl（值为 0，转不转等价）

    if (bind(lfd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind");
        return 1;
    }

    /* ---------- 3. listen ---------- */
    if (listen(lfd, SOMAXCONN) < 0) {              // 转成被动套接字
        perror("listen");
        return 1;
    }
    printf("server listening on port %d ...\n", PORT);

    /* ---------- 4. accept 循环：一个连接一个线程 ---------- */
    while (true) {
        struct sockaddr_in clnt_address;
        socklen_t clnt_len = sizeof(clnt_address);   // 【必须初始化】

        int cfd = accept(lfd, (struct sockaddr *)&clnt_address, &clnt_len);
        if (cfd < 0) {
            if (errno == EINTR) continue;    // 被信号打断 → 重试
            perror("accept");
            continue;                        // 单个连接出错，服务器继续活
        }

        char ip[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &clnt_address.sin_addr, ip, sizeof(ip));
        printf("client %s:%d connected (fd=%d)\n",
               ip, ntohs(clnt_address.sin_port), cfd);

        /* 关键：fd 必须【值传递】给线程，不能传 &cfd */
        int *pfd = malloc(sizeof(int));      // 每个连接独立一份
        if (pfd == NULL) {
            perror("malloc");
            close(cfd);
            continue;
        }
        *pfd = cfd;

        pthread_t tid;
        int ret = pthread_create(&tid, NULL, handle_read, pfd);
        if (ret != 0) {
            /* pthread_* 返回错误码而非设置 errno，不能用 perror */
            fprintf(stderr, "pthread_create: %s\n", strerror(ret));
            close(cfd);
            free(pfd);
            continue;
        }

        pthread_detach(tid);   // 线程结束自动回收，主线程无需 join
    }

    close(lfd);
    return 0;   // 实际上不可达
}

/* ---------- 线程函数：负责一个连接的全部收发 ---------- */
void *handle_read(void *arg) {
    int fd = *(int *)arg;   // 先把值取出来
    free(arg);              // 谁 malloc 谁 free，取完立刻释放，避免泄漏

    char buf[BUF_SIZE];

    while (true) {
        ssize_t n = read(fd, buf, sizeof(buf) - 1);
        if (n < 0) {
            if (errno == EINTR) continue;   // 被信号打断 → 重试
            perror("read");
            break;
        }
        if (n == 0) {                        // 对端正常关闭
            printf("fd %d 断开\n", fd);
            break;
        }

        buf[n] = '\0';
        printf("[fd %d] %s", fd, buf);

        /* echo：原样发回去 */
        if (write(fd, buf, n) < 0) {
            perror("write");
            break;
        }
    }

    close(fd);          // 【必须】否则 fd 泄漏
    return NULL;
}
```

### 1.3.1 另一种传 fd 的写法（不用 malloc）

```c
#include <stdint.h>

/* 创建时：把 int 塞进指针 */
pthread_create(&tid, NULL, handle_read, (void *)(intptr_t)cfd);

/* 线程里：取出来 */
void *handle_read(void *arg) {
    int fd = (int)(intptr_t)arg;
    ...
}
```

> [!tip] 两种写法怎么选
> - `intptr_t` 法：**无内存分配**，更高效，但依赖「int 能塞进指针」这个前提
> - `malloc` 法：**更直观、零依赖**，代价是一次小的堆分配
> - 教学中推荐 `malloc` 法，因为「谁 malloc 谁 free」的归属关系一眼可见

---

## 1.4 四、还可以怎么改进

### 1.4.1 加 `SO_REUSEADDR`（上面已加）

不加的话，服务器重启时前一次连接的 `TIME_WAIT` 状态会让 `bind` 失败：

```
bind: Address already in use
```

### 1.4.2 `SIGPIPE` 的另一种处理

除了 `signal(SIGPIPE, SIG_IGN)`，也可以在发送时用 `MSG_NOSIGNAL`：

```c
send(fd, buf, n, MSG_NOSIGNAL);   // 只对这一处生效，不发 SIGPIPE
```

### 1.4.3 「一连接一线程」的局限

| 优势 | 劣势 |
| --- | --- |
| 逻辑直观，隔离性好 | 线程 = 内核资源，一个约 8MB 栈（虚拟） |
| 阻塞式编程，代码简单 | 上万连接 → 上万线程 → 上下文切换爆炸（C10K 问题） |
| 适合连接数少、每连接重负载 | 不适合高并发短连接 |

**进阶方向**（按顺序）：

```
一连接一线程  →  线程池（固定 N 个线程 + 任务队列）
              →  IO 多路复用（select / poll / epoll）
              →  epoll + 线程池 / Reactor 模式
```

线程池就是把「`pthread_create`」换成「往任务队列 `push`（加锁 + 条件变量）」，正好用到 [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread基本用法]] 里的互斥锁和条件变量。

### 1.4.4 短读短写

`read`/`write` 返回值可能**小于请求长度**，严格来说要循环读写：

```c
/* 写满 n 字节 */
size_t written = 0;
while (written < n) {
    ssize_t w = write(fd, buf + written, n - written);
    if (w <= 0) { /* 出错处理 */ break; }
    written += w;
}
```

> 小数据量 + 阻塞 socket 下大概率一次写完，但**不能假设**。

### 1.4.5 其他

- 加 `SIGINT` 处理，`Ctrl+C` 时优雅关闭（关闭 `lfd`、等待线程退出）
- 用 `getopt` 让端口号可配置，而不是硬编码 `8080`
- 打印日志用 `syslog` 或带时间戳，多线程 `printf` 输出会交错
- 需要线程安全的话，对共享的状态加互斥锁

### 1.4.6 空闲超时：「多少秒没消息就自动断开」（你提到的优化点）

> 你说的「做一个定时器自动检测多少秒没消息」——**好消息是不用自己造定时器**。
> 内核已经替你在 socket 上做了这件事，只要一个 `setsockopt`。

#### 1.4.6.1 方式一：应用层接收超时（`SO_RCVTIMEO`）

关心的是「**客户端有没有发数据**」。

```c
#include <sys/time.h>       // struct timeval

/* 放在 handle_read 拿到 fd 之后、进入 while 之前 */
struct timeval tv;
tv.tv_sec  = 30;            // 30 秒收不到数据，read 就返回
tv.tv_usec = 0;
setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

/* 之后 read 的表现 */
while (true) {
    ssize_t n = read(fd, buf, sizeof(buf) - 1);
    if (n < 0) {
        if (errno == EAGAIN || errno == EWOULDBLOCK) {
            /* ↓ 这就是「超时」：空闲太久了 */
            printf("fd %d 空闲超时，关闭连接\n", fd);
            break;                  // 结束线程
            // continue;            // 或者「续命」，再等下一轮
        }
        if (errno == EINTR) continue;
        perror("read");
        break;
    }
    ...
}
```

> [!tip] 关键点：`SO_RCVTIMEO` **不会**把 fd 变成非阻塞
> `read` 依然会阻塞，只是最多阻塞 `tv_sec` 秒。
> 超时后返回 -1 且 `errno = EAGAIN`（或 `EWOULDBLOCK`，两者在 Linux 上值相同），
> 所以判断超时要用 `errno == EAGAIN || errno == EWOULDBLOCK`。

#### 1.4.6.2 方式二：TCP keepalive（`SO_KEEPALIVE`）

关心的是「**连接本身还在不在**」——专门对付「拔网线 / 客户端断电」那种没有 FIN 也没有 RST 的情况。

```c
#include <netinet/tcp.h>

int on = 1;
setsockopt(fd, SOL_SOCKET, SO_KEEPALIVE, &on, sizeof(on));

int idle     = 60;    // 空闲多少秒后开始探测（系统默认 7200 = 2 小时！）
int interval = 10;    // 每隔多少秒探一次（默认 75）
int count    = 3;     // 连续多少次无响应就判定断开（默认 9）
setsockopt(fd, IPPROTO_TCP, TCP_KEEPIDLE,  &idle,     sizeof(idle));
setsockopt(fd, IPPROTO_TCP, TCP_KEEPINTVL, &interval, sizeof(interval));
setsockopt(fd, IPPROTO_TCP, TCP_KEEPCNT,   &count,    sizeof(count));
```

#### 1.4.6.3 三种「检测」机制对照

| 机制 | 解决什么 | 触发后 `read` 的表现 | 需要自己写逻辑吗 |
| --- | --- | --- | --- |
| `SO_RCVTIMEO` | 客户端**连着但不发数据** | `-1`，`errno = EAGAIN` | 需要（判断 errno） |
| `SO_KEEPALIVE` | 客户端**已经消失但没发 FIN**（拔网线、断电） | `-1`，`errno = ETIMEDOUT` | 不需要，内核全包 |
| 应用层心跳协议 | 业务级存活检测（TCP 层探测可能被中间 NAT/防火墙糊弄） | 由你自己的协议定义 | 需要（实现心跳包） |

> [!warning] 顺序建议：三者不是替代关系，而是**叠加**的
> - **`SO_KEEPALIVE`**：一定要开，且把 `TCP_KEEPIDLE` 从 2 小时改小。否则拔网线的客户端会让线程**卡死 2 小时**——这正是「`while(true)` 也不是永远不会结束」的反面例子
> - **`SO_RCVTIMEO`**：按业务定，一般用于「聊天类长连接」踢掉挂机用户
> - 两者同时开，`read` 谁先到就谁先返回，`errno` 不同，可以分辨

#### 1.4.6.4 加了这个之后，`detach` 更不能漏

`SO_RCVTIMEO` 会让「客户端连着但静默」的连接也能结束线程 → 线程结束频率大幅上升 → 僵尸线程泄漏会**肉眼可见**。

这也是为什么说 **1.2.5 和这一节要一起看**：超时是为了「让线程能死」，`detach` 是为了「让线程死后不占地方」。

---

## 1.5 五、怎么测试这个服务器

> 分五层递进：**能连上 → 真是并发 → 扛得住量 → 不泄漏 → 底层确认**。
> 大多数人只做了第一层，看到 echo 回来了就以为成了——**但单线程串行也能 echo**，所以第二层才是关键。

### 1.5.1 第 0 步：确认测试环境

| 场景 | 服务器在哪 | 客户端连的 IP |
| --- | --- | --- |
| WSL / 虚拟机里跑 | Linux 环境内 | `127.0.0.1`（本机回环） |
| 开发板 | 板子上 | 板子的真实 IP，如 `192.168.1.100` |
| 从 Windows 连 WSL2 | WSL 内 | 通常 `localhost` 能通；不行就用 `hostname -I` 拿 IP |

```bash
# 看本机 IP（跨机测试时要用）
ip addr          # 或 ifconfig / hostname -I
```

### 1.5.2 编译与启动

```bash
# 编译：注意 -lpthread
gcc server.c -o server -lpthread -Wall -Wextra

# 运行
./server
# server listening on port 8080 ...
```

> [!tip] 一定要开 `-Wall -Wextra`
> 它会帮你揪出「`pthread_create` 返回值没检查」「变量未初始化」这类问题——正是前面 review 里的第 2、10 条。

### 1.5.3 第一层：能不能连上（连通性）

`nc`（netcat）最顺手：

```bash
nc 127.0.0.1 8080
```

连上后敲几个字回车，**看到自己敲的内容被 echo 回来 = 通了**。退出用 `Ctrl+C` 或 `Ctrl+D`。

`telnet` 也行（`nc` 没装时）：

```bash
telnet 127.0.0.1 8080
```

服务端这时应该打印：

```
client 127.0.0.1:51234 connected (fd=4)
[fd 4] hello
```

**连不上时怎么判断：**

| 现象 | 含义 |
| --- | --- |
| `Connection refused` | 服务器没在跑，或端口写错了 |
| 卡住半天没反应 | 服务器在跑但没走到 `accept`（可能卡在 bind/listen 前） |
| `No route to host` | 跨机测试时网络不通 / 防火墙拦截 |

### 1.5.4 第二层：验证「真的是多线程」⚠️ 重点

**这是最容易被自己骗过去的一层。** 单线程串行服务器一样能 echo，所以「echo 成功了」**证明不了并发**。

#### 1.5.4.1 方法一：两个 `nc` 同时开着

```
终端1：nc 127.0.0.1 8080      ← 连上后【不要退出】，就挂着
终端2：nc 127.0.0.1 8080      ← 敲字
```

- 终端2 **立刻**有回显 → 并发 ✅
- 终端2 **卡住不响应** → 还是串行 ❌

> [!warning] 为什么要「不退出」？
> 单线程串行服务器在第一个客户端**断开之前**，根本回不到 `accept`。
> 所以只有让第一个连接**一直占着**，才能测出第二个能不能进来。

#### 1.5.4.2 方法二：直接看线程数

```bash
ps -T -p $(pidof server)          # -T 列出线程，每行一个 SPID
top -H -p $(pidof server)         # -H 显示线程
cat /proc/$(pidof server)/status | grep Threads
ls /proc/$(pidof server)/task     # 目录项个数 = 线程数
```

**每连一个客户端，线程数应该 +1；断开后应该 -1**（因为 detach 生效了）。

```
$ ps -T -p $(pidof server)
  PID  SPID TTY      STAT   TIME COMMAND
 1234  1234 pts/0    Sl+    0:00 ./server      ← 主线程
 1234  1235 pts/0    Sl+    0:00 ./server      ← 客户端 A 的线程
 1234  1236 pts/0    Sl+    0:00 ./server      ← 客户端 B 的线程
```

#### 1.5.4.3 方法三：看连接状态

```bash
ss -tnp | grep 8080
```

每个客户端应该有一条 `ESTABLISHED` 连接。

### 1.5.5 第三层：一次性开很多客户端

#### 1.5.5.1 bash 脚本：开 100 个客户端

```bash
# 每个客户端连上、发一句话、挂住 30 秒
for i in $(seq 1 100); do
    (echo "client $i" | nc -q 30 127.0.0.1 8080 >/dev/null) &
done
wait
```

> [!note] `nc` 有两个版本，参数不一样
> - `netcat-openbsd`（Ubuntu 默认）：`-q 30` = EOF 后再等 30 秒；`-N` = EOF 就立刻断开
> - `netcat-traditional`：`-w 30` = 超时 30 秒
>
> 用 `nc -h` 看一眼，或者直接 `apt install netcat-openbsd`。

另开终端观察：

```bash
watch -n 1 'cat /proc/$(pidof server)/status | grep Threads'
```

线程数应该冲到接近 100。

#### 1.5.5.2 观察资源占用

```bash
top -H -p $(pidof server)      # 逐线程看 CPU / 内存
ps -o pid,nlwp,rss,vsz -p $(pidof server)   # nlwp = 线程数
```

> [!tip] 这里能直观看到「一连接一线程」的代价
> 100 个连接的 VSZ 会涨到 **800MB 左右**（100 × 8MB 虚拟栈）。
> 但 RSS（真实占用）远小于此——因为栈是**按需分配**的，没用到就不占物理内存。
> 这就是为什么「线程数不能无限涨」，也是线程池要解决的问题。

#### 1.5.5.3 验证 fd 不泄漏（检查你的 `close`）

```bash
# 记下当前 fd 数量
ls /proc/$(pidof server)/fd | wc -l

# 反复跑几十轮「连接→断开」
for i in $(seq 1 50); do
    echo "hi" | nc -N 127.0.0.1 8080 >/dev/null
done

# 再看一次
ls /proc/$(pidof server)/fd | wc -l
```

| 结果 | 结论 |
| --- | --- |
| 两次数字**基本一致** | `close(cfd)` 生效 ✅ |
| 数字**持续上涨** | 忘 `close` 或忘 `detach`，资源在泄漏 ❌ |

### 1.5.6 第四层：写个可控的 C 客户端

`nc` 够用，但不方便做「多次收发」「精确控制断开时机」「批量脚本化」。自己写一个更顺手：

```c
// client.c —— 连上后发 N 条消息，然后正常关闭
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main(int argc, char **argv) {
    const char *ip = (argc > 1) ? argv[1] : "127.0.0.1";
    int port = (argc > 2) ? atoi(argv[2]) : 8080;
    int times = (argc > 3) ? atoi(argv[3]) : 3;   // 发几条

    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) { perror("socket"); return 1; }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port   = htons(port);
    inet_pton(AF_INET, ip, &addr.sin_addr);

    if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("connect");
        return 1;
    }

    char buf[1024];
    for (int i = 0; i < times; i++) {
        int len = snprintf(buf, sizeof(buf), "msg %d\n", i);
        write(fd, buf, len);

        ssize_t r = read(fd, buf, sizeof(buf) - 1);
        if (r > 0) {
            buf[r] = '\0';
            printf("echo: %s", buf);
        }
    }

    close(fd);      // 正常关闭 → 服务端 read 返回 0 → 线程退出
    return 0;
}
```

```bash
gcc client.c -o client
./client 127.0.0.1 8080 5
```

比 `nc` 好在：**可以脚本化跑很多次验证 fd 不泄漏**，也能在代码里精确控制「什么时候断开」。

### 1.5.7 第五层：`strace` 看底层发生了什么

最硬的验证手段——能直接看到 `accept` / `clone`（线程创建）/ `read` / `close`：

```bash
strace -f -e trace=network,clone,close ./server
```

- `-f` **必须加**，否则只跟踪主线程，看不到工作线程
- 你会看到每次 `accept4` 返回一个新 fd，紧接着 `clone` 创建线程

```bash
# 附着到已经在跑的进程
strace -f -p $(pidof server)
```

典型输出（简化）：

```
accept4(3, ..., SOCK_CLOEXEC) = 4        ← 新客户端，拿到 cfd=4
clone(child_stack=..., flags=CLONE_VM|...) = 1235   ← 创建线程
read(4, "hello\n", 1023) = 6             ← 线程里读数据
write(4, "hello\n", 6) = 6               ← echo
read(4, "", 1023) = 0                    ← 客户端关闭
close(4) = 0                             ← 线程收尾
```

> [!tip] `clone` 就是 `pthread_create` 的真身
> 这和 [[100-学习/120-嵌入式/面试八股文/Linux系统编程.md|Linux系统编程]] 里说的「`pthread_create` 底层就是 `clone`」对上了——在这里能亲眼看到。

### 1.5.8 排查工具速查表

| 想看什么 | 命令 |
| --- | --- |
| 谁在监听 8080 | `ss -tlnp \| grep 8080` |
| 所有 8080 连接 | `ss -tnp \| grep 8080` |
| 进程的线程列表 | `ps -T -p $(pidof server)` |
| 线程数量 | `cat /proc/$(pidof server)/status \| grep Threads` |
| 打开的 fd | `ls -l /proc/$(pidof server)/fd` |
| 端口被谁占了 | `lsof -i :8080` ／ `fuser 8080/tcp` |
| 跟踪系统调用 | `strace -f -p $(pidof server)` |
| 抓 TCP 握手 | `sudo tcpdump -i lo port 8080` |
| 本机 IP | `ip addr` ／ `hostname -I` |
| 实时看线程数 | `watch -n 1 'cat /proc/$(pidof server)/status \| grep Threads'` |

> [!warning] 不要用 `ab` / `wrk` 压测
> 它们是 **HTTP 压测工具**，会先发 HTTP 请求。你的服务器不是 HTTP 协议，收到 `GET / HTTP/1.1` 只会原样 echo 回去，测不出真实性能。
> 用上面的 bash 脚本 + `nc` 更合适。

### 1.5.9 常见报错对照表

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| `bind: Address already in use` | 端口被占 / 上次的 `TIME_WAIT` | 加 `SO_REUSEADDR`；或 `lsof -i :8080` 找到并杀掉；或换端口 |
| `bind: Permission denied` | 用了 < 1024 的端口 | 换 8080 之类；或用 root |
| `Connection refused` | 服务器没启动 / 端口写错 | `ss -tlnp \| grep 8080` 确认 |
| 客户端连上又立刻断开 | `pthread_create` 失败后 `close(cfd)` | 检查返回值有没有打印错误 |
| 服务器跑一会儿就挂 | 没处理 `SIGPIPE` | `signal(SIGPIPE, SIG_IGN)` |
| 第二个客户端连不上 | 主循环被 `join` 卡住 | 改成 `detach`（见 1.2.7） |
| 客户端收到的数据串了 | 传了 `&clnt_fd` 而不是 fd 的值 | 见 1.2.3 |
| 服务器莫名退出 | `accept` 失败后 `return 1` | 改 `continue` |
| 线程数一直涨不降 | 没 `detach` | `pthread_detach(tid)`（见 1.2.5） |
| fd 数一直涨 | 没 `close(cfd)` | 线程结束时 `close` |

### 1.5.10 跨机测试（开发板场景）

```bash
# 1. 看板子 IP
ip addr                     # 找 wlan0 / eth0 的地址

# 2. 交叉编译后传到板子
scp server root@192.168.1.100:/tmp/

# 3. 板子上运行
./server

# 4. 电脑上测（确保同一网段）
nc 192.168.1.100 8080
```

> [!warning] 两个必须注意的点
> 1. **`bind` 必须用 `INADDR_ANY`**（或者绑到板子的真实网卡 IP）。
>    如果绑的是 `127.0.0.1`，就只有板子自己能连，外部一律 `Connection refused`。
> 2. **两边要在同一网段**，先 `ping 192.168.1.100` 通了再说。
>    板子上一般没 `nc`，可以用 `telnet`，或者编译上面那个 `client.c` 传过去。

### 1.5.11 一句话测试流程

```bash
# 1. 起服务
gcc server.c -o server -lpthread -Wall && ./server

# 2. 另开终端，先确认能连（第一层）
nc 127.0.0.1 8080

# 3. 挂住不断开，再开一个（第二层 —— 关键）
nc 127.0.0.1 8080

# 4. 看线程数对不对（第二层）
watch -n 1 'cat /proc/$(pidof server)/status | grep Threads'

# 5. 上量 + 查泄漏（第三层）
for i in $(seq 1 100); do (echo hi | nc -q 30 127.0.0.1 8080 >/dev/null) & done
ls /proc/$(pidof server)/fd | wc -l
```

---

## 1.6 六、代码里那 4 个 TODO 详解

### 1.6.1 `signal(SIGPIPE, SIG_IGN)` —— 为什么必须忽略它？

**因为 `SIGPIPE` 的默认动作是「杀死整个进程」，不是「让 write 返回错误」。**

这是最反直觉的一点。很多人以为「往已断开的连接写数据」顶多让 `write` 失败返回，实际上内核会先给你的进程发一个 `SIGPIPE` 信号，而这个信号的**默认处置方式是 Terminate**。

后果：

```
客户端连上 → 你 echo 回去 → 客户端 Ctrl+C 退出
→ 你的线程又一次 write
→ 内核：这条连接对端已经关了 → 给你发 SIGPIPE
→ 默认动作 = 杀死进程
→ 【整个服务器进程直接死掉】，所有线程一起完蛋
```

#### 1.6.1.1 怎么发现的？看退出码

```bash
$ ./server
server listening on port 8080 ...
# ... 客户端断开后，进程没了
$ echo $?
141
```

`141 = 128 + 13`，而 **13 就是 SIGPIPE 的编号**。看到 `141`，基本可以断定「死于 SIGPIPE」。

（也可能在终端直接看到 `Broken pipe` 的提示。）

#### 1.6.1.2 为什么会有这么"变态"的默认行为？

这是从 **shell 管道**继承来的设计，而且那个场景下它是**对的**：

```bash
yes | head -1
```

- `yes` 会无限输出
- `head -1` 读到一行就退出了
- 此时 `yes` 还在拼命往管道里写 → 内核给 `yes` 发 SIGPIPE → `yes` 被杀掉 ✅

如果没有这个信号，`yes` 就得自己检测「对端没了」然后退出，shell 管道就没法优雅收尾了。所以对**管道**来说这是特性。

但对**网络服务器**来说，这就是灾难——**你不希望一个客户端的断开带走整个服务**。

#### 1.6.1.3 解决：忽略它，让 errno 来说话

```c
signal(SIGPIPE, SIG_IGN);   // 忽略 SIGPIPE
```

忽略之后，`write` 的语义就变成普通的失败了：

```c
if (write(fd, buf, n) < 0) {
    // errno == EPIPE  → 对端已关闭
    perror("write");   // 打印 "write: Broken pipe"
    break;             // 退出这个连接的循环，线程正常收尾
}
```

于是「一个客户端断开」的影响被**限制在那一个线程内**——这才是我们要的。

#### 1.6.1.4 三种处理方式的对比

| 方式 | 作用范围 | 说明 |
| --- | --- | --- |
| `signal(SIGPIPE, SIG_IGN)` | **整个进程** | 最简单，推荐。一次调用，全局生效 |
| `send(fd, buf, n, MSG_NOSIGNAL)` | **仅这一次调用** | 更精细，只抑制这一处；但要把所有 `write` 换成 `send` |
| `SO_NOSIGPIPE`（socket 选项） | 单个 socket | ⚠️ **Linux 不支持**，是 BSD/macOS 的 |

> [!tip] 什么时候可以**不**忽略？
> 如果你的服务器从来不往 socket 写数据（纯接收），就不会触发 SIGPIPE。
> 但你这是个 echo 服务器，**必须忽略**。

> [!note] 顺带理解 `SIG_IGN` 和信号处理
> ```c
> signal(SIGPIPE, SIG_IGN);          // 忽略：什么都不做，write 返回 EPIPE
> signal(SIGPIPE, my_handler);       // 自定义处理函数
> signal(SIGPIPE, SIG_DFL);          // 恢复默认（= 杀死进程）
> ```
> 这就是 [[100-学习/120-嵌入式/面试八股文/Linux系统编程.md|Linux系统编程]] 里信号那部分说的「三种处置方式」。

### 1.6.2 `SO_REUSEADDR` —— 不是缩短时间，而是**绕过**它

> 你的猜测：「主要作用是不是减少端口释放之后重新恢复的时间？」

**方向对了，但机制不一样——`SO_REUSEADDR` 一点都不会缩短那个时间。**

准确地说：

| | 说明 |
| --- | --- |
| `TIME_WAIT` 本身 | **照旧 60 秒，不会因为你设了 `SO_REUSEADDR` 而变短** |
| `SO_REUSEADDR` 做的事 | 让内核在 `bind` 时**忽略掉处于 `TIME_WAIT` 的那些连接**，允许你立刻复用这个端口 |
| 效果 | 从「等 60 秒」变成「不用等」——但不是靠缩短，是靠**跳过检查** |

#### 1.6.2.1 `TIME_WAIT` 是怎么来的？

TCP 关闭是**四次挥手**。主动发起关闭（发第一个 FIN）的那一方，最后会进入 `TIME_WAIT` 状态，停留 **2×MSL**（Linux 上固定 60 秒）。

**为什么服务器会撞上它？** 因为 `Ctrl+C` 杀服务器时：

```
Ctrl+C → 进程退出 → 内核替你关闭所有 socket
      → 内核替你发 FIN（服务端成了「主动关闭方」）
      → 那些连接全部进入 TIME_WAIT，本地端口都是 8080
      → 你立刻重启 ./server → bind(8080)
      → 内核：8080 上还有处于 TIME_WAIT 的连接 → EADDRINUSE ❌
```

这就是「改了代码、Ctrl+C、重启，结果 `bind: Address already in use`」的完整原因。

```bash
# 亲眼看一眼 TIME_WAIT 的连接
ss -tan state time-wait | grep 8080
```

#### 1.6.2.2 `TIME_WAIT` 为什么必须存在（不能直接干掉）

它是在解决两个真实问题：

1. **保证最后一个 ACK 能到达对端**
   如果对端没收到我们的 ACK，它会重发 FIN。此时我们还在 `TIME_WAIT`，才能重发 ACK。
   要是直接销毁了，对端就会一直重发 FIN 直到超时。

2. **让本次连接的「迷路旧报文」在网络中自然消散**
   否则这些旧报文可能被**新建立的、四元组相同**的连接误收，造成数据错乱。

所以 `TIME_WAIT` 是**保护机制**，不是 bug。我们要做的是「不被它挡住」而不是「消灭它」。

> [!danger] 不要用「改内核参数」或「强制 RST」来绕过
> - `net.ipv4.tcp_tw_recycle` 已被 Linux 移除（在 NAT 环境下会造成连接失败）
> - `SO_LINGER` 设 0 能让 `close` 直接发 RST 跳过 TIME_WAIT，但会**破坏上面两个保护**，只适合明确知道后果的场景
> - 正确的、标准的做法就是：**监听套接字上加 `SO_REUSEADDR`**，一行搞定

#### 1.6.2.3 `SO_REUSEADDR` 为什么是安全的？

因为处于 `TIME_WAIT` 的连接**已经彻底结束**了（数据都收发完了，只剩内核在等定时器），把它占的端口交给一个**新的监听套接字**，不会影响任何还在进行的通信。

> [!warning] `SO_REUSEADDR` ≠ `SO_REUSEPORT`
> | | 允许什么 | 用途 |
> | --- | --- | --- |
> | `SO_REUSEADDR` | 绑定时**忽略 `TIME_WAIT`** | 服务器重启不报错（**你要的就是它**） |
> | `SO_REUSEPORT` | 多个 socket **同时**绑同一端口 | 多进程/多线程各自 accept，内核做负载均衡（Linux 3.9+） |
>
> 注意：`SO_REUSEADDR` **不允许**两个「正在监听」的套接字绑同一端口——那种情况仍然会 `EADDRINUSE`。想实现「多进程同时监听」得用 `SO_REUSEPORT`。

#### 1.6.2.4 什么时候设？设在谁身上？

```c
int opt = 1;
setsockopt(lfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
/*         ^^^ 设在【监听套接字】上          ^^^^^^ 是地址，不是值！ */
```

- 必须在 **`bind()` 之前**调用（bind 时才会做那个检查）
- 设在 **`lfd`（监听套接字）** 上即可，不用设在 `cfd` 上
- `opt` 是「值-结果」风格，但这里只用了「值」，传 `sizeof(int)`

> [!tip] 一个常见的抄代码错误
> 网上很多例子写 `setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))` 但把 `opt` 定义成 `char` 或 `bool`——这样 `sizeof(opt)` 是 1，内核只会读到 1 字节，行为不确定。**老老实实用 `int opt = 1;`。**

### 1.6.3 `htons` / `htonl` 对应 `IP:端口` 的哪一半？

> 你的猜测：「`htons` 是不是就是指定 `:` 后面的部分，`htonl` 就是 `:` 前面的部分？」

**完全正确 ✅** 就是这个对应关系。

以 `192.168.1.100:8080` 为例：

```
        192 . 168 . 1 . 100    :    8080
        └────────┬────────┘          └─┬─┘
             4 段 × 8 位 = 32 位      0~65535 = 16 位
                   │                     │
                   ▼                     ▼
        address.sin_addr.s_addr     address.sin_port
                   │                     │
              htonl(...)             htons(...)
             「l」ong = 32 位       「s」hort = 16 位
```

| | `:` 前面 | `:` 后面 |
| --- | --- | --- |
| 内容 | IP 地址 | 端口号 |
| 结构体字段 | `sin_addr.s_addr` | `sin_port` |
| 位数 | 32 位 | 16 位 |
| 转换函数 | `htonl` | `htons` |
| 反向读取 | `ntohl` | `ntohs` |

**为什么端口是 16 位？** 因为端口范围就是 `0 ~ 65535`，正好 2¹⁶。**为什么 IP 是 32 位？** 因为 IPv4 地址就是 4 个字节。

> [!warning] 一处措辞上的小修正
> `htons`/`htonl` 本身**不负责「指定」**，它们只负责**转换字节序**。
> 真正「指定」的是赋值语句：`address.sin_port = htons(PORT);`
> ——`sin_port =` 指定了「这是端口」，`htons()` 只是把这个值转成网络序。
> 对应关系你记对了，只是别把两件事混成一件。

> [!note] 顺带：为什么 `sin_family` 两个都不是？
> ```c
> address.sin_family = AF_INET;   // 没有 htons/htonl
> ```
> 因为 `sin_family`（地址族）**根本不会发到网络上**，它只是告诉内核「这个结构体按 IPv4 解读」。纯本地常量，不需要转换。
>
> 这也和上面 `:前面的部分` 的直觉一致——它连「:」都不属于，它是「这个地址是什么类型」。

> [!tip] 那 IPv6 呢？
> IPv6 地址是 **128 位**，没有 `hton128` 这种东西。
> 所以 IPv6 一律用 `inet_pton(AF_INET6, ...)` 直接写入 `struct in6_addr`——`pton` 内部已经处理好了网络字节序。
> 这也是为什么 `inet_pton`/`inet_ntop` 比手动 `htonl` 更推荐：**协议无关，IPv4/IPv6 通吃**。

### 1.6.4 `inet_ntop` 是什么？为什么不用 `inet_ntoa`？

#### 1.6.4.1 名字拆开看就懂了

```
inet_ntop  =  inet  +  n     +  to  +  p
                      │             │
                network        presentation
                （二进制）

inet_pton  =  inet  +  p     +  to  +  n
                      │             │
                presentation   network
                （字符串）
```

- **`p` = presentation**：人类可读的「呈现形式」，就是字符串 `"192.168.1.100"`
- **`n` = network**：网络字节序的**二进制**形式，就是 4 个字节 `0xC0 0xA8 0x01 0x64`

| 函数 | 方向 | 记忆 |
| --- | --- | --- |
| `inet_pton` | 字符串 → 二进制 | **p**resentation **to** **n**etwork（发出去之前） |
| `inet_ntop` | 二进制 → 字符串 | **n**etwork **to** **p**resentation（打印之前） |

#### 1.6.4.2 在你的代码里它干了什么

```c
int cfd = accept(lfd, (struct sockaddr *)&clnt_address, &clnt_len);
/*                            ^^^^^^^^^^^^^ accept 填充的是【二进制】地址 */

char ip[INET_ADDRSTRLEN];
inet_ntop(AF_INET, &clnt_address.sin_addr, ip, sizeof(ip));
/*   ↑地址族  ↑二进制（输入）    ↑字符串缓冲区（输出） ↑缓冲区大小 */

printf("client %s:%d connected (fd=%d)\n",
       ip,                          /* "127.0.0.1" */
       ntohs(clnt_address.sin_port),/* 端口，用 ntohs 转回主机序 */
       cfd);
```

`accept` 给你的是**二进制的、网络字节序的**地址，`inet_ntop` 把它翻译成 `"127.0.0.1"` 这样的字符串，`printf` 才打得出来。

#### 1.6.4.3 参数详解

```c
const char *inet_ntop(int af, const void *src, char *dst, socklen_t size);
```

| 参数 | 含义 | 你传的 |
| --- | --- | --- |
| `af` | 地址族 | `AF_INET`（IPv6 传 `AF_INET6`） |
| `src` | **输入**：指向二进制地址 | `&clnt_address.sin_addr` |
| `dst` | **输出**：字符串缓冲区 | `ip` |
| `size` | 缓冲区大小（字节） | `sizeof(ip)` |
| 返回值 | 成功返回 `dst`，失败返回 `NULL` | — |

缓冲区大小必须给对，否则返回 `NULL` 且 `errno = ENOSPC`：

| 宏 | 值 | 够装什么 |
| --- | --- | --- |
| `INET_ADDRSTRLEN` | **16** | `"255.255.255.255"` = 15 字符 + `'\0'` |
| `INET6_ADDRSTRLEN` | **46** | 最长的 IPv6 写法，如 `"::ffff:192.168.1.100"` |

> [!warning] 别用 `char ip[8]` 这种「我觉得够了」
> 缓冲区不够时 `inet_ntop` 返回 `NULL` 且不写坏内存（安全的），但你会打印出空/未初始化的内容，且**错误被静默吞掉**。老老实实用 `INET_ADDRSTRLEN`。

#### 1.6.4.4 ⭐ 为什么多线程服务器里**必须**用 `inet_ntop` 而不是 `inet_ntoa`

**因为 `inet_ntoa` 返回的是静态缓冲区 —— 线程不安全，会把不同客户端的 IP 串在一起。**

```c
/* <arpa/inet.h> */
char *inet_ntoa(struct in_addr in);
/*    ↑ 返回指针：指向函数【内部的一块静态内存】       */
```

问题出在这个「内部静态内存」是**所有调用共享**的：

```
线程A: p = inet_ntoa(客户端A的地址)   → p 指向缓冲区 P，内容是 "1.1.1.1"
线程B:    inet_ntoa(客户端B的地址)   → 还是缓冲区 P，内容被改成 "2.2.2.2"
线程A: printf("%s", p)               → 打印出 "2.2.2.2" ❌ 张冠李戴
```

- POSIX 明确说明：返回的字符串位于**静态内存**，**后续调用会覆盖它**
- Linux man 手册把 `inet_ntoa` 标注为 `MT-Safe race:staticbuf`——意思是**只有你保证不并发访问那块静态缓冲区时才是安全的**，也就是实际用起来不安全
- `inet_ntoa` 还**只支持 IPv4**，且已被 POSIX 标记为 obsolescent（过时）

而 `inet_ntop` 要求**调用者自己提供缓冲区**：

```c
char ip[INET_ADDRSTRLEN];             // ← 栈上的局部变量
inet_ntop(AF_INET, &addr, ip, sizeof(ip));
```

**每个线程的栈是独立的**，所以每个线程有自己的一份 `ip`，天然线程安全。

> [!danger] 这是「一连接一线程」里非常隐蔽的一个 bug
> 用 `inet_ntoa` 的话，**平时单客户端测试完全正常**——因为只有一个线程在调用。
> 一旦多个客户端同时连上，日志里的 IP 就开始互相串。
> 更糟的是它**不会崩、不会报错**，只是数据悄悄错了。
> 所以规则很简单：**多线程环境一律用 `inet_ntop`（或 `inet_pton`），见到 `inet_ntoa`/`inet_addr` 就当红灯。**

#### 1.6.4.5 转换函数全家福

| 函数 | 方向 | 线程安全 | IPv6 | 状态 |
| --- | --- | --- | --- | --- |
| `inet_pton` | 字符串 → 二进制 | ✅ | ✅ | **推荐** |
| `inet_ntop` | 二进制 → 字符串 | ✅ | ✅ | **推荐** |
| `inet_aton` | 字符串 → 二进制 | ✅ | ❌ | 老旧，仅 IPv4 |
| `inet_ntoa` | 二进制 → 字符串 | ❌ **静态缓冲区** | ❌ | 老旧，**多线程禁用** |
| `inet_addr` | 字符串 → 二进制 | ✅ | ❌ | ❌ 已废弃，无法表示 `255.255.255.255` |
| `getnameinfo` | 二进制 → 字符串（含端口） | ✅ | ✅ | 最现代，协议无关 |

> [!tip] 想要「一步到位」拿到 `IP:端口` 字符串？
> `inet_ntop` 只处理地址，端口还得自己 `ntohs` 拼。想省事可以用 `getnameinfo()`：
> ```c
> char host[NI_MAXHOST], serv[NI_MAXSERV];
> getnameinfo((struct sockaddr *)&clnt_address, clnt_len,
>             host, sizeof(host), serv, sizeof(serv),
>             NI_NUMERICHOST | NI_NUMERICSERV);
> printf("client %s:%s\n", host, serv);
> ```
> `NI_NUMERICHOST` 表示「别做 DNS 反查，直接给数字形式的 IP」——不加的话它可能去查域名，**阻塞**你的线程。

---

## 1.7 七、相关笔记

- [[100-学习/120-嵌入式/linux/Socket网络编程.md|Socket 网络编程]]
- [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread 基本用法]]
- [[100-学习/120-嵌入式/面试八股文/Linux系统编程.md|Linux 系统编程（八股文）]]
- [[100-学习/120-嵌入式/linux路线.md|嵌入式 Linux 学习路线]]
