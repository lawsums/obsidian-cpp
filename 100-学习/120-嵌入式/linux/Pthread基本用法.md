# 1 Pthread 基本用法

> Linux 下 C 语言多线程编程（POSIX Threads）
> 头文件：`#include <pthread.h>`

---

## 1.1 一、编译与链接

```bash
gcc thread.c -o thread -lpthread
# 新版本 glibc（2.34+）已把 pthread 合并进 libc，可以省略 -lpthread
gcc thread.c -o thread
```

> [!warning] 不加 `-lpthread` 的老版本会报 `undefined reference to 'pthread_create'`

---

## 1.2 二、线程的创建

### 1.2.1 函数原型

```c
#include <pthread.h>

int pthread_create(pthread_t *thread,        // 传出参数，线程 ID
                   const pthread_attr_t *attr, // 线程属性，NULL 表示默认
                   void *(*start_routine)(void *), // 线程函数
                   void *arg);                // 传给线程函数的参数

// 成功返回 0，失败返回错误码（不是设置 errno）
```

### 1.2.2 最简示例

```c
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

void *task(void *arg) {
    printf("子线程 tid = %lu\n", (unsigned long)pthread_self());
    return NULL;
}

int main(void) {
    pthread_t tid;
    int ret = pthread_create(&tid, NULL, task, NULL);
    if (ret != 0) {
        perror("pthread_create");
        return 1;
    }

    printf("主线程 tid = %lu\n", (unsigned long)pthread_self());
    sleep(1);   // 等子线程跑完（不推荐，仅演示）
    return 0;
}
```

> [!tip] 线程函数签名固定为 `void *(*)(void *)`
> - 参数是一个 `void *`，返回值也是 `void *`
> - 想传多个参数就打包成结构体，想返回结果就 `return` 指针

### 1.2.3 传递参数

```c
typedef struct {
    int id;
    char name[32];
} Args;

void *worker(void *arg) {
    Args *a = (Args *)arg;          // 强转回来
    printf("id=%d name=%s\n", a->id, a->name);
    return (void *)0;
}

int main(void) {
    pthread_t tid;
    Args args = { 1, "hello" };
    pthread_create(&tid, NULL, worker, &args);  // 传地址，别传局部变量地址后立刻返回
    pthread_join(tid, NULL);
    return 0;
}
```

> [!danger] 常见错误
> - 传 `&i`（循环变量的地址）：所有线程读到的是同一个值的最终状态
> - 传随即销毁的栈变量地址：悬空指针
> - 正确做法：每个线程传独立结构体（数组或 `malloc`）

### 1.2.4 获取线程 ID

```c
pthread_t pthread_self(void);                    // 获取当前线程 ID
int pthread_equal(pthread_t t1, pthread_t t2);   // 比较，1 相等
```

> `pthread_t` 在 Linux 上是 `unsigned long`，但**标准不保证**，不要用 `==` 比较，用 `pthread_equal`。

---

## 1.3 三、线程的终止

| 方式 | 说明 |
| --- | --- |
| 线程函数 `return` | 推荐，返回值可被 `join` 拿到 |
| `pthread_exit(void *retval)` | 主动退出当前线程，不影响其他线程 |
| `pthread_cancel(tid)` | 请求取消另一个线程（需线程能到达取消点） |
| 主线程 `exit()` / `return main` | 整个进程结束，所有线程一起死 |

```c
void *task(void *arg) {
    if (/* 出错 */) pthread_exit((void *)1);
    return (void *)0;
}
```

> [!warning] `pthread_exit` 退出的是**当前线程**，不是进程；但在主线程里调用会让进程等其他线程结束才退出。

---

## 1.4 四、等待线程结束（join）

```c
int pthread_join(pthread_t thread, void **retval);

// retval：接收线程函数的返回值，不关心就传 NULL
```

```c
void *task(void *arg) {
    return (void *)42;
}

int main(void) {
    pthread_t tid;
    void *ret;
    pthread_create(&tid, NULL, task, NULL);
    pthread_join(tid, &ret);
    printf("线程返回 %ld\n", (long)ret);   // 42
    return 0;
}
```

**作用：**
1. 阻塞等待指定线程结束
2. **回收线程资源**（类似 `waitpid`），避免僵尸线程
3. 获取线程返回值

> [!danger] joinable 线程不 join 也不 detach → 资源泄漏（僵尸线程）

---

## 1.5 五、线程分离（detach）

想让线程自己结束、自动回收资源，用 `detach`：

```c
int pthread_detach(pthread_t thread);
```

```c
pthread_t tid;
pthread_create(&tid, NULL, task, NULL);
pthread_detach(tid);      // 之后不能再 join，join 会返回 EINVAL
```

> 也可以在创建时设置属性为 `PTHREAD_CREATE_DETACHED`（见第八节）。
> 一个线程**不能被 detach 两次**，也不能既 join 又 detach。

---

## 1.6 六、互斥锁（Mutex）

### 1.6.1 基本用法

```c
pthread_mutex_t mtx = PTHREAD_MUTEX_INITIALIZER;  // 静态初始化

// 或动态初始化
pthread_mutex_init(&mtx, NULL);
pthread_mutex_destroy(&mtx);

pthread_mutex_lock(&mtx);     // 阻塞加锁
pthread_mutex_unlock(&mtx);
pthread_mutex_trylock(&mtx);  // 非阻塞，拿不到返回 EBUSY
```

### 1.6.2 保护共享变量

```c
#include <pthread.h>
#include <stdio.h>

static int g_count = 0;
static pthread_mutex_t g_lock = PTHREAD_MUTEX_INITIALIZER;

void *add(void *arg) {
    for (int i = 0; i < 100000; i++) {
        pthread_mutex_lock(&g_lock);
        g_count++;                  // 临界区
        pthread_mutex_unlock(&g_lock);
    }
    return NULL;
}

int main(void) {
    pthread_t t1, t2;
    pthread_create(&t1, NULL, add, NULL);
    pthread_create(&t2, NULL, add, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("g_count = %d\n", g_count);  // 200000
    return 0;
}
```

> [!tip] 不加锁的 `g_count++` 实际是「读—改—写」三步，会产生竞态（race condition），结果通常小于 200000。

### 1.6.3 死锁的四个条件与规避

死锁必要条件：互斥、持有并等待、不可抢占、循环等待。

规避手段：
- **固定加锁顺序**：所有线程按同一顺序获取多把锁
- **缩小临界区**：锁内不做耗时操作（IO、sleep）
- 用 `trylock` + 超时，失败就回退重试
- 尽量只持有一把锁

```c
// 错误示范：t1 先锁 A 再锁 B，t2 先锁 B 再锁 A → 死锁
// 正确：两边都先锁 A 再锁 B
```

---

## 1.7 七、条件变量（Condition Variable）

条件变量用于「等待某个条件成立」，必须和互斥锁配合使用。

```c
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
pthread_cond_init(&cond, NULL);
pthread_cond_destroy(&cond);

int pthread_cond_wait(pthread_cond_t *cond, pthread_mutex_t *mutex);
int pthread_cond_signal(pthread_cond_t *cond);      // 唤醒一个
int pthread_cond_broadcast(pthread_cond_t *cond);   // 唤醒全部
```

### 1.7.1 生产者—消费者示例

```c
#include <pthread.h>
#include <stdio.h>

static int g_ready = 0;
static pthread_mutex_t g_lock = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t  g_cond = PTHREAD_COND_INITIALIZER;

void *consumer(void *arg) {
    pthread_mutex_lock(&g_lock);
    while (!g_ready) {                      // 必须用 while，不能 if（防虚假唤醒）
        pthread_cond_wait(&g_cond, &g_lock); // 内部：解锁 + 睡眠，被唤醒后重新加锁
    }
    printf("消费者：数据已就绪\n");
    pthread_mutex_unlock(&g_lock);
    return NULL;
}

void *producer(void *arg) {
    pthread_mutex_lock(&g_lock);
    g_ready = 1;
    pthread_cond_signal(&g_cond);
    pthread_mutex_unlock(&g_lock);
    return NULL;
}
```

> [!warning] 三个关键点
> 1. `pthread_cond_wait` **必须**在持锁状态下调用，否则行为未定义
> 2. 等待条件**必须用 `while` 循环**判断，防止虚假唤醒（spurious wakeup）
> 3. `signal` 时一般要持锁（虽然标准允许不持锁，但持锁更易推理）

---

## 1.8 八、读写锁（RWLock）

读多写少的场景，允许多个读者并发，写者独占。

```c
pthread_rwlock_t rwlock = PTHREAD_RWLOCK_INITIALIZER;

pthread_rwlock_rdlock(&rwlock);   // 读锁（共享）
pthread_rwlock_wrlock(&rwlock);   // 写锁（独占）
pthread_rwlock_unlock(&rwlock);
pthread_rwlock_tryrdlock(&rwlock);
pthread_rwlock_trywrlock(&rwlock);
```

| 场景 | 读锁 | 写锁 |
| --- | --- | --- |
| 已有读锁 | 可再获取 | 阻塞 |
| 已有写锁 | 阻塞 | 阻塞 |

> [!tip] 写者优先 vs 读者优先是 `pthread_rwlockattr_setkind_np` 控制的；默认策略下连续的读请求可能**饿死**写者。

---

## 1.9 九、线程属性

需要非默认属性（如分离状态、栈大小）时，用 `pthread_attr_t`：

```c
pthread_attr_t attr;
pthread_attr_init(&attr);

// 设为分离态 → 省去 detach
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

// 设置栈大小（默认 8MB）
pthread_attr_setstacksize(&attr, 1024 * 1024);

pthread_t tid;
pthread_create(&tid, &attr, task, NULL);

pthread_attr_destroy(&attr);   // 用完销毁
```

---

## 1.10 十、常见陷阱清单

- [ ] 忘了 `-lpthread`（旧 glibc）
- [ ] 主线程提前 `return` / `exit`，子线程被一起干掉
- [ ] joinable 线程不 `join` 也不 `detach` → 僵尸线程、资源泄漏
- [ ] 传参用循环变量地址，导致所有线程共享同一份数据
- [ ] 临界区忘记加锁 / 忘记解锁（早退、异常路径）
- [ ] `pthread_cond_wait` 用 `if` 而非 `while` 判断条件
- [ ] 多把锁加锁顺序不一致 → 死锁
- [ ] `fork()` 与多线程混用：子进程只保留调用 `fork` 的那一个线程，且可能持有已加锁的 mutex → 死锁

---

## 1.11 相关笔记

- [[100-学习/120-嵌入式/面试八股文/Linux系统编程.md|Linux系统编程（八股文）]]
- [[100-学习/120-嵌入式/linux路线.md|嵌入式 Linux 学习路线]]
