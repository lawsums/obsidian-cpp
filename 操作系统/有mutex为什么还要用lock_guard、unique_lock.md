
DECK: 面试题

## 有mutex为什么还要用lock_guard、unique_lock


## 标准答案


## 使用场景(举例)


## 我的答案
1. RAII 思想
2. 方便省事, 只用一行代码
3. 如果只在开头写 `mutex.lock()`, 结尾写`mutex.unlock()`有可能在中间边界判断提前return的时候没有释放锁
4. 如果程序中间有你没有预料到的异常, 不引起崩溃但是跳出这个函数, 也会锁死



END