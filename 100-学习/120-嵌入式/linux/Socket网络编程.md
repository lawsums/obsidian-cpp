# 1 Socket 网络编程

> Linux 下 C 语言 TCP/UDP 网络编程
> 一句话结论：**核心接口在 `<sys/socket.h>`，IPv4 地址结构在 `<netinet/in.h>`，字符串 IP 转换在 `<arpa/inet.h>`**

---

## 1.1 一、直接回答：哪个函数在哪个头文件

| 你写的函数 / 类型                                                                                               | 头文件               | 归属                         |
| -------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------- |
| `socket` `bind` `listen` `accept` `connect` `send` `recv` `shutdown` `setsockopt` `getsockopt`           | `<sys/socket.h>`  | **socket 通用接口层**           |
| `struct sockaddr` `struct sockaddr_storage` `socklen_t` `AF_INET` `SOCK_STREAM`                          | `<sys/socket.h>`  | 同上                         |
| `struct sockaddr_in` `struct sockaddr_in6` `struct in_addr` `struct in6_addr` `INADDR_ANY` `IPPROTO_TCP` | `<netinet/in.h>`  | **internet 地址族专用**         |
| `inet_pton` `inet_ntop` `inet_addr` `inet_aton` `inet_ntoa`                                              | `<arpa/inet.h>`   | **字符串 ↔ 二进制 地址转换**         |
| `htons` `htonl` `ntohs` `ntohl`                                                                          | `<arpa/inet.h>`   | **字节序转换**                  |
| `getaddrinfo` `freeaddrinfo` `getnameinfo` `gethostbyname` `struct addrinfo`                             | `<netdb.h>`       | **域名 / DNS 解析**            |
| `ssize_t` `size_t` `sa_family_t`                                                                         | `<sys/types.h>`   | 基础类型                       |
| `close` `read` `write`                                                                                   | `<unistd.h>`      | 文件描述符读写                    |
| `struct sockaddr_un`                                                                                     | `<sys/un.h>`      | **Unix 域套接字**（本机 IPC，不走网络） |
| `TCP_NODELAY` `struct tcp_info`                                                                          | `<netinet/tcp.h>` | TCP 层选项                    |
| `select`                                                                                                 | `<sys/select.h>`  | IO 多路复用                    |
| `poll`                                                                                                   | `<poll.h>`        | IO 多路复用                    |
| `epoll_create` `epoll_ctl` `epoll_wait`                                                                  | `<sys/epoll.h>`   | IO 多路复用（Linux 特有）          |

### 1.1.1 一次引入（COPY 这段就够）

```c
#include <sys/types.h>
#include <sys/socket.h>   // socket / bind / listen / accept / connect
#include <netinet/in.h>   // sockaddr_in / INADDR_ANY / IPPROTO_TCP
#include <arpa/inet.h>    // inet_pton / inet_ntop / htons / ntohl
#include <netdb.h>        // getaddrinfo / freeaddrinfo
#include <unistd.h>       // close / read / write
```

> [!warning] 包含顺序
> POSIX 规定 `<netinet/in.h>` 可能需要 `<sys/socket.h>` 先出现（因为依赖 `sa_family_t` 等）。
> **永远把 `<sys/socket.h>` 写在 `<netinet/in.h>` 前面**，能避免一堆奇怪的重定义报错。

---

## 1.2 二、为什么分得这么散？（记忆逻辑）

```
sys/socket.h      通用层 —— 所有协议族共用的接口 + 通用地址结构 sockaddr
      │
      ├── netinet/in.h    「in」= internet 地址族：IPv4(sockaddr_in) / IPv6(sockaddr_in6)
      │        │
      │        └── arpa/inet.h   地址的「表示形式转换」：aton / ntoa / pton / ntop + 字节序
      │
      ├── sys/un.h        Unix 域套接字：sockaddr_un（本机进程间通信）
      └── netdb.h        域名解析：名字 ↔ 地址
```

- **`sys/socket.h`** → 谁都不认识的「通用插座」
- **`netinet/in.h`** → 插上 IP 网络的「专用插头」（含地址长什么样）
- **`arpa/inet.h`** → 地址的「翻译官」（`"192.168.1.1"` ↔ 4 字节）+ 「字节序翻译」

> [!tip] 记忆口诀
> **绑定监听靠 socket，地址结构在 inet，字符串转换找 arpa。**
> `bind` `listen` `accept` `connect` → 全在 `<sys/socket.h>`，一个都不例外。

---

## 1.3 三、`sockaddr_in` 结构体详解

```c
// <netinet/in.h>
struct sockaddr_in {
    sa_family_t    sin_family;   // 地址族，固定填 AF_INET
    in_port_t      sin_port;     // 端口号，必须是【网络字节序】→ 用 htons()
    struct in_addr sin_addr;     // IP 地址，必须是【网络字节序】→ 用 inet_pton()
    unsigned char  sin_zero[8];  // 补齐到 16 字节，必须清零
};

struct in_addr {
    in_addr_t s_addr;            // 32 位 IPv4 地址（网络字节序）
};
```

### 1.3.1 为什么有了 `sockaddr_in` 还要 `sockaddr`？

```c
struct sockaddr {                 // 通用地址结构，只有 16 字节
    sa_family_t sa_family;
    char        sa_data[14];
};
```

这是 C 语言版的「多态」：
- `socket()` / `bind()` 这些函数要**同时支持** IPv4、IPv6、Unix 域…
- 所以参数统一声明成通用的 `struct sockaddr *`
- 具体使用时你填 `sockaddr_in`，再**强转**成 `sockaddr *` 传进去

```c
bind(lfd, (struct sockaddr *)&addr, sizeof(addr));
//        ^^^^^^^^^^^^^^^^^^^^^^^^ 这个强转不能少，& 也不能少
```

> [!tip] 协议无关的写法用 `struct sockaddr_storage`
> 它足够大，能装下任何地址族，常用于 `accept()` 的传出参数、`recvfrom()`。

---

## 1.4 四、完整 TCP 服务端流程（对照头文件）

```c
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>   // socket bind listen accept
#include <netinet/in.h>   // sockaddr_in INADDR_ANY
#include <arpa/inet.h>    // htons htonl inet_ntop

int main(void) {
    /* 1. 创建 socket —— <sys/socket.h> */
    int lfd = socket(AF_INET, SOCK_STREAM, 0);
    if (lfd < 0) { perror("socket"); return 1; }

    /* 2. 端口复用，避免重启时 EADDRINUSE —— <sys/socket.h> */
    int opt = 1;
    setsockopt(lfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    /* 3. bind：绑定地址 —— <sys/socket.h> + <netinet/in.h> */
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));            // 顺带把 sin_zero 清零
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons(8080);        // 主机序 → 网络序
    addr.sin_addr.s_addr = htonl(INADDR_ANY);  // 监听本机所有网卡
    if (bind(lfd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }

    /* 4. listen：开始监听，转成被动套接字 —— <sys/socket.h> */
    if (listen(lfd, 128) < 0) { perror("listen"); return 1; }

    /* 5. accept：阻塞等待客户端连接 —— <sys/socket.h> */
    struct sockaddr_in cli;
    socklen_t len = sizeof(cli);
    int cfd = accept(lfd, (struct sockaddr *)&cli, &len);
    if (cfd < 0) { perror("accept"); return 1; }

    /* 6. 打印对端地址 —— <arpa/inet.h> */
    char ip[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &cli.sin_addr, ip, sizeof(ip));
    printf("客户端 %s:%d 已连接\n", ip, ntohs(cli.sin_port));  // ntohs 转回主机序

    /* 7. 收发数据 —— <unistd.h> */
    char buf[1024];
    ssize_t n = read(cfd, buf, sizeof(buf));
    write(cfd, buf, n);

    close(cfd);
    close(lfd);
    return 0;
}
```

### 1.4.1 客户端侧关键两步

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);   // <sys/socket.h>

struct sockaddr_in addr;
memset(&addr, 0, sizeof(addr));
addr.sin_family = AF_INET;
addr.sin_port   = htons(8080);
inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);  // <arpa/inet.h>

connect(fd, (struct sockaddr *)&addr, sizeof(addr));  // <sys/socket.h>
```

> [!note] 客户端**不需要** `bind` / `listen` / `accept`
> 内核在 `connect` 时会自动分配本机端口（临时端口）。

---

## 1.5 五、地址转换函数对照（`<arpa/inet.h>`）

| 函数 | 方向 | 状态 |
| --- | --- | --- |
| `inet_pton(AF_INET, "1.2.3.4", &in)` | 字符串 → 二进制 | ✅ **推荐** |
| `inet_ntop(AF_INET, &in, buf, size)` | 二进制 → 字符串 | ✅ **推荐** |
| `inet_aton("1.2.3.4", &in)` | 字符串 → 二进制 | ⚠️ 老旧，仅 IPv4 |
| `inet_ntoa(in)` | 二进制 → 字符串 | ⚠️ 老旧，**非线程安全**（返回静态缓冲区） |
| `inet_addr("1.2.3.4")` | 字符串 → 二进制 | ❌ 已废弃，无法表示 `255.255.255.255` |

```c
// 现代写法
struct in_addr in;
inet_pton(AF_INET, "192.168.1.10", &in);     // 成功返回 1

char buf[INET_ADDRSTRLEN];                    // 至少 16 字节
inet_ntop(AF_INET, &in, buf, sizeof(buf));   // 失败返回 NULL
```

> [!warning] IPv6 要用 `INET6_ADDRSTRLEN`（46 字节），别用 `INET_ADDRSTRLEN`。

---

## 1.6 六、字节序：为什么必须 `htons`

网络字节序 = **大端**（big-endian）；x86 / ARM 主机是 **小端**。

```c
// 不转换的后果：8080 (0x1F90) 会被对端理解成 0x901F = 36895
addr.sin_port = 8080;             // ❌ 错
addr.sin_port = htons(8080);      // ✅ 对
```

| 函数 | 用途 |
| --- | --- |
| `htons` | host → network，**short**（16 位，端口） |
| `htonl` | host → network，**long**（32 位，IPv4 地址） |
| `ntohs` | network → host，short |
| `ntohl` | network → host，long |

> [!tip] 口诀：**s 管端口，l 管地址；h 在前是「发出去」，n 在前是「收进来」。**
> 64 位机上 `htonl` 的参数仍是 32 位，别传 `long`。

---

## 1.7 七、常见坑清单

- [ ] 端口忘了 `htons`，IP 忘了 `inet_pton`（或忘了 `htonl(INADDR_ANY)`）
- [ ] `bind` 时忘了 `(struct sockaddr *)` 强转，或忘了取地址 `&addr`
- [ ] `sockaddr_in` 没 `memset` 清零 → `sin_zero` 残留垃圾
- [ ] 头文件顺序：`<netinet/in.h>` 写在 `<sys/socket.h>` 前面
- [ ] `bind` 报 `EADDRINUSE` → 没设 `SO_REUSEADDR`，`TIME_WAIT` 期间重启失败
- [ ] `accept` 的第三个参数是**值-结果参数**：必须传 `&len`，且 `len` 每次要重置
- [ ] `INADDR_ANY` 是监听所有网卡；只想本机访问用 `inet_pton(AF_INET,"127.0.0.1",...)`
- [ ] 用 `inet_ntoa` 在多线程里 → 静态缓冲区被覆盖（参考 [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread基本用法]]）
- [ ] `read`/`write` 返回值是 `ssize_t`，可能小于请求长度（**短读短写**），要循环
- [ ] `sizeof(addr)` 用错成 `sizeof(struct sockaddr)`（16 字节不够）

> [!danger] `bind` 与 `listen` 的职责区别
> - `bind` 只负责「这个套接字用哪个本地地址:端口」，UDP 也需要
> - `listen` 是 TCP 专有，作用是**把主动套接字变成被动套接字**，并设置连接队列长度
> - 顺序不能反：`socket → bind → listen → accept`

---

## 1.8 八、相关笔记

- [[100-学习/120-嵌入式/linux/Pthread基本用法.md|Pthread 基本用法]]
- [[100-学习/120-嵌入式/面试八股文/Linux系统编程.md|Linux 系统编程（八股文）]]
- [[100-学习/120-嵌入式/linux路线.md|嵌入式 Linux 学习路线]]
- [[100-学习/120-嵌入式/通信协议.md|通信协议]]
