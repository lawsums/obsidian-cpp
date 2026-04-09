---
number headings: off
---

DECK: 面试题

## 手撕vector


## 标准答案
```cpp
#include <iostream>
#include <new>

template<typename T>
class Vector {
public:
    // Vector() {}
    Vector() : data_(nullptr), size_(0), capacity_(0) {}
    ~Vector() {
        // 分离析构元素和释放内存
        clear();
        deallocate();
    }

    void clear() {
        // 析构元素
        for (size_t i = 0; i < size_; i++) {
            data_[i].~T();
        }
        // 将size变为零
        size_ = 0;
    }

    void push_back(const T &value) {
        emplace_back(value);
    }

    void push_back(T &&value) {
        emplace_back(std::move(value));
    }

    // 完美转发
    template<typename... Args>
    // Q: 为什么emplace_back()需要返回引用?
    // A: 标准 std::vector 就是这么设计的
    // 返回刚构造好的元素的引用，让用户可以立刻使用：
    T &emplace_back(Args &&...args) {
        // 扩容
        if (size_ == capacity_) {
            // Q: 为什么对于零要特判?
            // A: 初始 capacity = 0
            // 如果直接 0 * 2 = 0，永远无法分配内存
            reallocate(capacity_ == 0 ? 1 : capacity_ * 2);
        }

        new (data_ + size_) T(std::forward<Args>(args)...);
        return data_[size_++];
    }

    T &back() {
        return data_[size_ - 1];
    }

    const T &back() const {
        return data_[size_ - 1];
    }

    void pop_back() {
        // 删除元素, 手动调用析构函数
        if (size_ > 0) {
            data_[--size_].~T();
            // back().~T();
            // size_--;
        }
    }

private:
    T *allocate(size_t capacity) {
        // ::operator new()返回了什么?
        return static_cast<T *>(::operator new(capacity * sizeof(T)));
    }

    void reallocate(size_t new_cap_) {
        // 申请新内存
        T *new_data_ = allocate(new_cap_);
        size_t new_size_ = 0;

        // 移动
        try {
            for (; new_size_ < size_; ++new_size_) {
                // TODO 实现移动构造函数
                // Q: new_data_[new_size_] = 和 placement new写法有什么区别?
                // A: = 是赋值运算符，要求对象已经构造完成,
                // placement new 是构造函数，用于第一次创建对象,
                // vector 扩容时内存是新的，必须用构造，不能用赋值！

                // new_data_[new_size_] = std::move_if_noexcept(data_[new_size_])
                new (new_data_ + new_size_) T(std::move_if_noexcept(data_[new_size_]));
            }
        } catch (...) {
            // TODO 回退此操作
            // ...
            throw;
        }

        // 删除原先的内存
        // Q: 我都move_if_noexcept移动构造了, 还需要clear?
        // A: 移动后，原对象变成空壳 / 有效但未指定状态
        // 但析构函数仍然需要调用
        // clear() 就是做这件事：
        // 遍历所有元素
        // 调用 ~T()
        // 不调用会资源泄漏（文件、锁、内存、智能指针等）
        clear();
        deallocate();

        // 将data_设为新内存
        data_ = new_data_;
        size_ = new_size_;
        capacity_ = new_cap_;
    }

    void deallocate() {
        // TODO ::operator delete() 和 直接delete有什么区别 ?
        ::operator delete(data_);
        data_ = nullptr;
        // 减少容量
        capacity_ = 0;
    }

private:
    T *data_ = nullptr;
    size_t size_ = 0;
    size_t capacity_ = 0;
};
```


## TODO


## 使用场景 (举例)



END
