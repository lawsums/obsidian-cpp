
DECK: 面试题

## 有mutex为什么还要用lock_guard、unique_lock


## 标准答案
### 核心回答（面试背诵版）
#### 1. 核心原因：解决原生mutex的致命问题
原生`mutex.lock()`/`unlock()`需手动管理，若代码中**提前return**（边界判断）或**抛出未捕获异常**，会导致`unlock()`无法执行，造成死锁；而`lock_guard`/`unique_lock`基于**RAII思想**，构造时自动加锁，析构时（函数退出/异常/return）自动解锁，从根本避免死锁。

#### 2. 两者区别与使用场景
- **lock_guard**：极简版RAII锁，一行代码完成加锁+自动释放，无额外开销，适合**简单函数内加锁**场景；
- **unique_lock**：增强版RAII锁，支持延迟加锁（`defer_lock`）、手动解锁、配合`condition_variable`（`wait()`必须用它），适合**复杂灵活的加锁场景**（如条件变量、跨函数传锁）。

### 精简背诵版（3句话）
1. 原生mutex手动解锁易因return/异常导致死锁，lock_guard/unique_lock靠RAII自动解锁，杜绝死锁；
2. lock_guard极简，一行代码搞定简单加锁，性能最优；
3. unique_lock更灵活，支持延迟加锁、配合条件变量，覆盖复杂场景。

## 使用场景(举例)


## 我的答案
1. RAII 思想
2. 方便省事, 只用一行代码
3. 如果只在开头写 `mutex.lock()`, 结尾写`mutex.unlock()`有可能在中间边界判断提前return的时候没有释放锁
4. 如果程序中间有你没有预料到的异常, 不引起崩溃但是跳出这个函数, 也会锁死



END
<!--ID: 1773973207896-->
