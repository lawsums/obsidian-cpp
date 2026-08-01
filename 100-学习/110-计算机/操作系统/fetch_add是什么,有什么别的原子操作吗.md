
DECK: 面试题

## fetch_add是什么 有什么别的原子操作吗


## 标准答案
### 一、fetch_add 再梳理
`fetch_add` 是**原子操作**的一种，核心作用是对共享变量执行「读取旧值 → 与指定值相加 → 写回新值」的完整流程，且全程不可中断（不会被其他线程/进程插入干扰），本质是解决并发场景下的「竞态条件」。

- 核心特性：原子性（无中断）、返回值默认是「操作前的旧值」（部分语言可配置）、无锁（无需手动加锁，底层由CPU指令支持，如x86的`LOCK XADD`）。
- 典型用途：并发计数器（如接口请求量统计、任务完成数计数）、无锁数据结构（如无锁队列的索引更新）、共享状态的原子增减。


### 二、常见的其他原子操作
原子操作的核心是「不可中断的读取-修改-写入（RMW）」或「原子读写」，除了 `fetch_add`，主流语言（C++、Rust、Java、Go）都提供了一系列覆盖不同场景的原子操作，按功能可分为以下几类：

#### 1. 原子增减类（与 fetch_add 同属“算术原子操作”）
这类操作围绕变量的加减逻辑，是 `fetch_add` 的同类扩展，核心是「原子修改+返回值」：

| 操作名                            | 功能描述                      | 典型返回值  | 语言示例（C++）                                                            |
| ------------------------------ | ------------------------- | ------ | -------------------------------------------------------------------- |
| fetch_sub                      | 原子减指定值（等价于 fetch_add(-n)） | 操作前的旧值 | `atomic<int> a; a.fetch_sub(2);`                                     |
| add_fetch / fetch_add_explicit | 原子加+返回新值（部分语言支持，C++需显式指定） | 操作后的新值 | `a.fetch_add(2, memory_order_relaxed);`（C++默认返回旧值，Rust可通过Ordering控制） |
| increment / decrement          | 原子加1/减1（部分语言的简化接口）        | 旧值或新值  | Java：`AtomicInteger.getAndIncrement()`                               |

> 示例（Java）：`AtomicLong.getAndDecrement()` 等价于 `fetch_sub(1)`，返回旧值；`addAndGet(3)` 等价于「原子加3+返回新值」。


#### 2. 原子赋值/交换类（「写+读」原子操作）
核心是「原子更新变量值」，同时保证读写的原子性，避免“写一半被读取”或“读旧值后被其他线程修改”：

| 操作名                   | 功能描述                | 关键特点     | 语言示例                                                                |
| --------------------- | ------------------- | -------- | ------------------------------------------------------------------- |
| store                 | 原子写入新值（覆盖旧值）        | 无返回值（仅写） | C++：`a.store(10);`；Rust：`a.store(10, Ordering::Relaxed)`            |
| load                  | 原子读取当前值             | 无修改（仅读）  | Go：`atomic.LoadInt32(&a)`；Java：`atomicInt.get()`                    |
| exchange（swap）        | 原子交换值（用新值替换旧值，返回旧值） | 读写一体     | C++：`int old = a.exchange(20);`；Rust：`a.swap(20, Ordering::SeqCst)` |
| compare_exchange（CAS） | 比较并交换（核心无锁操作）       | 条件更新     | 下文单独详解                                                              |

> 关键：`store`/`load` 是最基础的原子读写，避免了普通变量“非原子读写”的问题（如64位变量在32位CPU上的读写可能拆分为两次操作）。


#### 3. 比较并交换（CAS：Compare-And-Swap）—— 无锁编程的核心
`compare_exchange`（简称CAS）是**最强大的原子操作**，几乎所有无锁数据结构（如无锁队列、原子栈）都基于它实现，核心逻辑是：
``` cpp
bool compare_exchange(期望旧值, 新值) {
    原子对比：如果当前变量值 == 期望旧值 → 替换为新值，返回true；
    否则 → 不修改，返回false（部分语言会把“实际当前值”写入“期望旧值”的引用）；
}
```

##### 特性与用途：
- 无锁：无需加互斥锁，通过“重试逻辑”（循环CAS）实现并发安全；
- 乐观锁思想：假设不会有冲突，冲突时重试即可；
- 典型场景：无锁计数器、原子更新复杂状态（如结构体成员）、实现自旋锁等。

##### 语言示例：
- C++：
  ```cpp
  std::atomic<int> a(5);
  int expected = 5;
  // 若a当前是5，则更新为10，返回true；否则返回false，expected被更新为a的实际值
  bool success = a.compare_exchange_strong(expected, 10);
  ```
- Java：`AtomicInteger.compareAndSet(int expect, int update)`（返回boolean）；
- Rust：`a.compare_exchange(5, 10, Ordering::SeqCst, Ordering::Relaxed)`（返回Result）；
- Go：`atomic.CompareAndSwapInt32(&a, 5, 10)`（返回bool）。

##### 注意：ABA问题
CAS的经典缺陷：变量先从A→B→A，CAS会误认为“未被修改”（如链表节点的删除与复用）。解决方案：加版本号（如Java的`AtomicStampedReference`）或避免重复值复用。


#### 4. 位运算原子操作（针对二进制位的原子修改）
对变量的二进制位执行原子操作（如置1、清0、翻转），适用于“状态标志位”场景（如并发控制中的“开关状态”）：

| 操作名                | 功能描述                                  | 语言示例（C++）                          |
|-----------------------|-------------------------------------------|------------------------------------------|
| fetch_or              | 原子按位或（指定位置1）                    | `atomic<int> flag(0); flag.fetch_or(1);`（第0位置1） |
| fetch_and             | 原子按位与（指定位清0）                    | `flag.fetch_and(~1);`（第0位清0）        |
| fetch_xor             | 原子按位异或（指定位翻转）                  | `flag.fetch_xor(1);`（第0位翻转）        |
| fetch_not             | 原子按位非（全位翻转，仅支持无符号类型）    | `atomic<unsigned int> x(0); x.fetch_not();`（结果为全1） |

> 示例场景：用一个原子变量的不同位表示多个并发状态（如位0=“是否初始化”，位1=“是否运行中”），通过`fetch_or`/`fetch_and`原子修改单个位，无需锁。


#### 5. 其他特殊原子操作
- **load-acquire / store-release**：带内存序约束的原子读写（如C++的`memory_order_acquire`/`release`），控制指令重排和线程间可见性，用于复杂并发同步（如生产者-消费者模型）；
- **fence（内存屏障）**：原子内存屏障，强制之前的指令完成后再执行后续指令，避免CPU重排导致的可见性问题（如C++的`std::atomic_thread_fence`）；
- **atomic_flag**：C++中的“最基础原子类型”（仅支持`test_and_set`和`clear`），可用于实现自旋锁（`test_and_set`是“原子测试并置1”，返回旧值）。


### 三、主流语言原子操作对照表（核心常用）
| 操作类型       | C++（<atomic>）                | Java（java.util.concurrent.atomic） | Rust（std::sync::atomic）          | Go（sync/atomic）                  |
|----------------|--------------------------------|-------------------------------------|------------------------------------|------------------------------------|
| 原子加（旧值） | fetch_add(val)                 | getAndAdd(val)                      | fetch_add(val, order)              | -（AddXXX返回新值，需模拟旧值）    |
| 原子加（新值） | -（需自定义）                  | addAndGet(val)                      | fetch_add+load（或用compare_exchange） | AddInt32(&a, val)（返回新值）      |
| 原子交换       | exchange(val)                  | getAndSet(val)                      | swap(val, order)                   | SwapInt32(&a, val)                 |
| CAS            | compare_exchange_strong/weak   | compareAndSet(expect, update)       | compare_exchange(expect, new, ...) | CompareAndSwapInt32(&a, expect, update) |
| 原子读         | load()                         | get()                               | load(order)                        | LoadInt32(&a)                      |
| 原子写         | store(val)                     | set(val)                             | store(val, order)                  | StoreInt32(&a, val)                |
| 位或（置1）    | fetch_or(val)                  | -（需用CAS模拟）                    | fetch_or(val, order)               | -（需用CAS模拟）                    |


### 四、核心总结
1. `fetch_add` 是「原子增减类」的代表，核心是“无锁原子加减+返回旧值”；
2. 原子操作的本质是「不可中断的RMW或读写」，底层依赖CPU指令（如LOCK前缀、LL/SC指令），比锁更高效；
3. 常用原子操作可按场景选择：
   - 简单计数/增减：`fetch_add`/`fetch_sub`；
   - 状态切换/值替换：`exchange`/`store`/`load`；
   - 复杂无锁逻辑：`CAS`（几乎万能，需注意ABA问题）；
   - 标志位控制：`fetch_or`/`fetch_and`（位运算原子操作）；
4. 不同语言的接口名称略有差异，但核心语义一致，重点关注「返回值（旧值/新值）」和「内存序（影响可见性和重排）」。

## 我的答案



END
<!--ID: 1769078758579-->
