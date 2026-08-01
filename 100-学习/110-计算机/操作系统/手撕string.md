
DECK: 面试题

## 0.1 手撕string


## 0.2 标准答案

```cpp
#include <cstring>
#include <memory>
#include <stdexcept>
#include <utility>
#include <vector>


class String {
public:
    static const size_t s_min_capacity;

private:
    char *data_;     // 字符串数据
    size_t size_;    // 当前字符串长度
    size_t capacity_;// 容量

    // 重新分配内存的函数
    void realloc_data(size_t new_capacity) {
        char *new_data = new char[new_capacity + 1];// +1 for null terminator
        if (data_) {
            // BUG: 需要拷贝'\0', 但是之前没有拷贝
            std::copy(data_, data_ + size_ + 1, new_data);
            delete[] data_;
        }
        data_ = new_data;
        capacity_ = new_capacity;
    }

public:
    // 默认构造函数
    String() : data_(nullptr), size_(0), capacity_(s_min_capacity) {
        data_ = new char[capacity_ + 1];
        data_[0] = '\0';
    }

    // 构造函数
    String(const char *str) {
        if (!str) {// 如果是空指针
            throw std::invalid_argument("null pointer");
        }

        size_ = std::strlen(str);
        capacity_ = std::max(size_, s_min_capacity);
        data_ = new char[capacity_ + 1];
        std::memcpy(data_, str, size_ + 1);
        // 需要额外拷贝一个'\0'
        // data_[size_] = '\0'
    }

    // 二进制安全的构造函数
    String(const void *data, size_t len) {
        if (!data) {// 如果是空指针
            throw std::invalid_argument("null pointer");
        }

        size_ = len;
        capacity_ = std::max(size_, s_min_capacity);
        data_ = new char[capacity_ + 1];
        std::memcpy(data_, data, size_);
        data_[len] = '\0';
    }

    // 拷贝构造函数
    String(const String &that) : size_(that.size_), capacity_(that.capacity_) {
        data_ = new char[capacity_ + 1];
        std::memcpy(data_, that.data_, that.size_ + 1);
    }

    // 移动构造函数
    String(String &&that) {
        size_ = std::exchange(that.size_, 0);
        capacity_ = std::exchange(that.capacity_, 0);
        data_ = std::exchange(that.data_, nullptr);
    }

    // 析构函数
    ~String() {
        delete[] data_;
    }

    // 赋值运算符
    String &operator=(const String &that) {
        if (this != &that) {// 如果不是自己的话就先复制
            // 检查有没有原先的数据, 如果有先删除
            if (data_) delete[] data_;
            char *new_data_ = new char[that.capacity_ + 1];
            std::memcpy(new_data_, that.data_, that.size_ + 1);

            // 赋值
            size_ = that.size_;
            capacity_ = that.capacity_;
            data_ = new_data_;
        }
        return *this;
    }

    // 移动赋值运算符
    String &operator=(String &&that) {
        if (this != &that) {// 如果不是自己的话就先复制
            // 检查有没有原先的数据, 如果有先删除
            if (data_) delete[] data_;

            // 移动赋值
            size_ = std::exchange(that.size_, 0);
            capacity_ = std::exchange(that.capacity_, 0);
            data_ = std::exchange(that.data_, nullptr);
        }
        return *this;
    }

    // 预分配内存
    void reserve(size_t new_cap) {
        if (new_cap > capacity_) {
            realloc_data(new_cap);
        }
    }

    // 释放多余内存
    void shrink_to_fit() {
        if (capacity_ > size_) {
            realloc_data(size_);
        }
    }

    String &append(const void *str, size_t len) {
        if (!str) throw std::invalid_argument("null pointer");
        if (size_ + len > capacity_) {
            reserve(size_ + len);
        }

        // 复制str到原先的data_最后
        memcpy(data_ + size_, str, len);
        // 调整size_大小
        size_ += len;
        // 在最后添加'\0'
        data_[size_] = '\0';
        return *this;
    }


    String &append(const char *str) {
        if (!str) throw std::invalid_argument("null pointer");
        return append(str, std::strlen(str));
    }

    // 获取数据
    const char *c_str() const noexcept { return data_; }
    const char *data() const noexcept { return data_; }
    size_t size() const noexcept { return size_; }
    size_t capacity() const noexcept { return capacity_; }
    bool empty() const noexcept { return size_ == 0; }
};

const size_t String::s_min_capacity = 15;
```


## 0.3 TODO
1. 实现 push_back/pop_back
2. 实现 chop (n)
3. 实现 contain (kmp)
4. 实现 index_of/last_index_of
5. 实现 split
6. 实现 join

## 0.4 使用场景(举例)



END
<!--ID: 1773973207912-->
