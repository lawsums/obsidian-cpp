
DECK: 面试题

## 手撕lock_guard

## 标准答案
```cpp
#include <mutex>
#include <type_traits>// for static_assert、std::is_class_v
#include <utility>    // for std::exchange、std::swap


// 自定义命名空间，避免和标准库lock_guard冲突
namespace my_lock {

    // 模板类：实现RAII锁守卫，仿std::lock_guard
    template<typename T>
    class lock_guard {
    private:
        T *mutex_ptr_ = nullptr;// 锁的指针，初始化空指针（避免绑定全局变量）

        // 静态断言：检测T是否是锁类型（有lock()和unlock()成员函数）
        // 编译期检测，不满足直接报错，解决TODO：检测锁类型
        static_assert(std::is_class_v<T>, "T must be a class type (lock type)");
        static_assert(requires(T &m) { m.lock(); }, "T must have member function lock()");
        static_assert(requires(T &m) { m.unlock(); }, "T must have member function unlock()");

    public:
        // 核心构造函数：接收锁的引用，构造时加锁（RAII关键）
        // 显式构造，禁止隐式转换（避免临时对象导致的锁立即释放）
        explicit lock_guard(T &mutex) : mutex_ptr_(&mutex) {
            mutex_ptr_->lock();// 构造加锁，仅加一次
        }

        // 析构函数：自动解锁（RAII关键），判空避免空指针调用
        ~lock_guard() {
            if (mutex_ptr_ != nullptr) {// 仅当持有锁时才解锁
                mutex_ptr_->unlock();
            }
        }

        // ==============================================
        // 禁用拷贝/移动：核心原则，lock_guard独占锁的管理权
        // ==============================================
        lock_guard(const lock_guard &) = delete;           // 禁用拷贝构造
        lock_guard(lock_guard &&) = delete;                // 禁用移动构造
        lock_guard &operator=(const lock_guard &) = delete;// 禁用拷贝赋值
        lock_guard &operator=(lock_guard &&) = delete;     // 禁用移动赋值

        // ==============================================
        // 实现TODO：release/swap/operator bool
        // ==============================================
        // 释放锁的管理权（不解锁），返回原锁的指针
        // 调用后，当前lock_guard不再管理任何锁，析构也不会解锁
        T *release() {
            return std::exchange(mutex_ptr_, nullptr);// 交换指针，返回原地址
        }

        // 交换两个lock_guard的锁管理权
        void swap(lock_guard &other) noexcept {// noexcept：保证不抛异常
            std::swap(mutex_ptr_, other.mutex_ptr_);
        }

        // 布尔转换：判断是否持有锁（const修饰，支持const对象）
        explicit operator bool() const noexcept {
            return mutex_ptr_ != nullptr;
        }

        // ==============================================
        // 移除危险的手动lock/unlock：遵循RAII自动管理
        // 如果你一定要保留，需加严格判断，不推荐！
        // ==============================================
        // void lock() { if (mutex_ptr_) mutex_ptr_->lock(); }
        // void unlock() { if (mutex_ptr_) mutex_ptr_->unlock(); }
    };

    // 非成员swap函数：适配标准库swap，支持std::swap(lock1, lock2)
    template<typename T>
    void swap(lock_guard<T> &lhs, lock_guard<T> &rhs) noexcept {
        lhs.swap(rhs);
    }

}// namespace my_lock

// 测试用全局互斥锁（命名区分，避免和类内成员混淆）
std::mutex g_test_mutex;

// 测试代码
int main() {
    // 基本使用：构造加锁，析构自动解锁
    my_lock::lock_guard<std::mutex> lock(g_test_mutex);

    // 检测是否持有锁
    if (lock) {
        // 临界区代码：操作共享资源
    }

    // 交换锁管理权（需另一个lock_guard，这里示例）
    // my_lock::lock_guard<std::mutex> lock2(g_another_mutex);
    // lock.swap(lock2);
    // std::swap(lock, lock2);

    // 释放锁管理权（后续析构不再解锁，需手动调用unlock）
    // std::mutex* m = lock.release();
    // if (m) m->unlock();

    return 0;
}

```


## 使用场景(举例)


## 我的答案



END
<!--ID: 1773973207917-->
