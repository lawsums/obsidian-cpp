
DECK: 面试题

## 手撕unique


## 标准答案
### 一、你的实现存在的问题
先列出核心问题，再逐一解释：

#### 1. 移动赋值运算符的 `const` 修饰错误
```cpp
unique_ptr& operator=(const unique_ptr&& other) noexcept;
```
**错误原因**：移动语义的核心是「接管对方的资源」，需要修改源对象（把 `other.ptr_` 置为 `nullptr`）。但你给 `other` 加了 `const`，导致无法修改源对象，编译会报错。

**修正**：去掉 `const`，移动赋值的源对象必须是「非 const 右值引用」：
```cpp
unique_ptr& operator=(unique_ptr&& other) noexcept;
```

#### 2. 移动赋值运算符缺少 `return *this`（逻辑错误）
当前移动赋值的代码中，`if (this != &other)` 分支有 `return *this`，但 `else` 分支（自赋值）没有返回值，会导致**未定义行为**（UB）。

**修正**：统一返回 `*this`，自赋值时直接返回即可（无需操作）：
```cpp
unique_ptr& operator=(unique_ptr&& other) noexcept {
    if (this != &other) {
        delete ptr_;
        ptr_ = std::exchange(other.ptr_, nullptr);
    }
    return *this; // 必须返回自身
}
```

#### 3. `reset` 成员函数的异常安全问题
当前 `reset` 实现：
```cpp
void reset(T* p = nullptr) {
    delete ptr_; // 先释放旧资源
    ptr_ = p;    // 再赋值新资源
}
```
**风险**：如果 `p` 是通过 `new[]` 分配的数组（或自定义类型的构造函数抛异常），虽然 `unique_ptr` 本身不支持数组（需特化），但逻辑上存在「释放旧资源后，新资源赋值失败」的空悬指针风险（虽此处影响不大，但标准实现会优化）。

**标准修正**：先交换再释放（利用临时对象的析构），更安全：
```cpp
void reset(T* p = nullptr) {
    unique_ptr temp(p); // 构造临时对象持有新资源
    swap(temp);         // 交换当前对象和临时对象的 ptr_
} // 临时对象析构，自动释放旧资源
```

#### 4. 缺少数组特化（可选，但重要）
你的实现只支持单个对象（`delete ptr_`），不支持数组（需 `delete[]`）。如果用户写 `unique_ptr<int[]> p(new int[10])`，会导致**内存泄漏**（数组用 `delete` 释放是未定义行为）。

**补充数组特化**（模板特化）：
```cpp
// 数组版本特化
template <typename T>
class unique_ptr<T[]> {
private:
    T* ptr_;
public:
    explicit unique_ptr(T* ptr = nullptr) : ptr_(ptr) {}
    ~unique_ptr() { delete[] ptr_; } // 数组用 delete[]

    // 禁用拷贝，启用移动（同非数组版，省略重复代码）
    unique_ptr(const unique_ptr&) = delete;
    unique_ptr& operator=(const unique_ptr&) = delete;
    unique_ptr(unique_ptr&& other) noexcept : ptr_(std::exchange(other.ptr_, nullptr)) {}
    unique_ptr& operator=(unique_ptr&& other) noexcept {
        if (this != &other) {
            delete[] ptr_;
            ptr_ = std::exchange(other.ptr_, nullptr);
        }
        return *this;
    }

    // 数组版本不支持 operator*（语义无意义），支持 operator[]
    T& operator[](size_t idx) const { return ptr_[idx]; }

    // 其他成员（get/release/reset/swap）同非数组版，省略重复代码
};
```

#### 5. 比较运算符支持不完整（可选）
当前只实现了 == 和 `!=`，标准库还支持 ` <`、`<=`、`>`、`>=`，可补充：
```cpp
template <typename T>
bool operator<(const unique_ptr<T>& lhs, const unique_ptr<T>& rhs) {
    return lhs.get() < rhs.get();
}
// 其他比较运算符可基于 < 实现，省略重复代码
```


### 二、解答你的疑问

#### 疑问1：为什么 `&&` 就表示移动语义？因为代表二级指针，也就是内存地址吗？
**完全不是！`&&` 和二级指针（`T**`）没有任何关系**，这是核心误解，分两步解释：

1. `&&` 的本质：右值引用
   - `&&` 是 C++11 引入的「右值引用」，专门用来绑定「右值」（临时对象、即将销毁的对象，比如 `unique_ptr<int>(new int(10))` 或 `std::move(x)` 转换后的对象）。
   - 右值的特点是「生命周期即将结束，没人会再使用它」，所以我们可以「偷」它的资源，而不用拷贝（这就是移动语义的核心）。

2. 移动语义和 `&&` 的关联：
   - 移动构造/赋值的参数必须是「右值引用」（`unique_ptr&&`），因为只有这样才能区分「拷贝」和「移动」：
     - 当你传递一个左值（比如 `unique_ptr<int> p; unique_ptr<int> q = p;`），会匹配拷贝构造（但你删除了，所以编译报错，符合 `unique_ptr` 不可拷贝的语义）。
     - 当你传递一个右值（比如 `unique_ptr<int> q = std::move(p);`），会匹配移动构造，此时可以安全接管 `p` 的资源（把 `p.ptr_` 置为 `nullptr`，避免二次释放）。

3. 为什么不是二级指针？
   - 二级指针（`T**`）是「指向指针的指针」，用于传递指针变量本身（比如修改外部指针的值）。
   - 而 `unique_ptr&&` 是「对 `unique_ptr` 对象的右值引用」，直接操作对象本身，和二级指针的语义完全不同。


#### 疑问2：为什么 `operator*` 返回 `T&`，`operator->` 返回 `T*`？
这是 C++ 运算符重载的「语义约定」，完全模仿原生指针的行为，让智能指针用起来和原生指针一样自然：

1. 原生指针的行为参考：
   ```cpp
   int x = 10;
   int* p = &x;

   *p = 20; // 解引用，访问指针指向的对象（x），需要修改 x，所以返回左值引用（int&）
   p->some_func(); // 箭头运算符，用于访问对象的成员，本质是先取指针指向的对象，再访问成员
                   // 原生指针中，p->等价于 (*p).，所以重载时直接返回指针（T*），编译器会自动补全 -> 后续的成员访问
   ```

2. 智能指针的重载逻辑：
   - `operator*()`：要模拟「解引用访问对象」，必须返回 `T&`（左值引用），这样用户才能修改对象（比如 `*up = 20`）；如果返回 `T`（值），会返回对象的拷贝，修改拷贝不会影响原对象，语义错误。
   - `operator->()`：C++ 有个特殊规则：如果 `operator->` 返回一个指针（`T*`），编译器会自动对这个指针再调用一次 `operator->`（直到找到对象的成员）。所以我们直接返回 `ptr_`（`T*`），编译器会自动处理后续的成员访问（比如 `up->some_func()` 等价于 `(up.operator->())->some_func()`）。

简单说：**为了和原生指针的用法完全一致，让用户无感知替换**。


### 三、修正后的完整代码（关键部分）
```cpp
#ifndef LEETCODE_UNIQUE_PTR_H
#define LEETCODE_UNIQUE_PTR_H

#include <utility>

// 单个对象版本
template <typename T>
class unique_ptr {
private:
    T* ptr_;
public:
    explicit unique_ptr(T* ptr = nullptr) : ptr_(ptr) {}

    ~unique_ptr() {
        delete ptr_;
    }

    // 禁用拷贝
    unique_ptr(const unique_ptr&) = delete;
    unique_ptr& operator=(const unique_ptr&) = delete;

    // 移动构造
    unique_ptr(unique_ptr&& other) noexcept
        : ptr_(std::exchange(other.ptr_, nullptr)) {}

    // 修正：移动赋值去掉 const + 补全 return *this
    unique_ptr& operator=(unique_ptr&& other) noexcept {
        if (this != &other) {
            delete ptr_;
            ptr_ = std::exchange(other.ptr_, nullptr);
        }
        return *this;
    }

    // 解引用：返回 T&（模仿原生指针）
    T& operator*() const {
        return *ptr_;
    }

    // 箭头运算符：返回 T*（模仿原生指针）
    T* operator->() const {
        return ptr_;
    }

    T* get() const {
        return ptr_;
    }

    explicit operator bool() const {
        return ptr_ != nullptr;
    }

    T* release() {
        return std::exchange(ptr_, nullptr);
    }

    // 修正：异常安全的 reset
    void reset(T* p = nullptr) {
        unique_ptr temp(p);
        swap(temp);
    }

    void swap(unique_ptr& other) {
        std::swap(ptr_, other.ptr_);
    }
};

// 数组版本特化（关键补充）
template <typename T>
class unique_ptr<T[]> {
private:
    T* ptr_;
public:
    explicit unique_ptr(T* ptr = nullptr) : ptr_(ptr) {}
    ~unique_ptr() { delete[] ptr_; } // 数组用 delete[]

    // 禁用拷贝，启用移动
    unique_ptr(const unique_ptr&) = delete;
    unique_ptr& operator=(const unique_ptr&) = delete;
    unique_ptr(unique_ptr&& other) noexcept : ptr_(std::exchange(other.ptr_, nullptr)) {}
    unique_ptr& operator=(unique_ptr&& other) noexcept {
        if (this != &other) {
            delete[] ptr_;
            ptr_ = std::exchange(other.ptr_, nullptr);
        }
        return *this;
    }

    // 数组支持 operator[]，不支持 operator*
    T& operator[](size_t idx) const {
        return ptr_[idx];
    }

    T* get() const { return ptr_; }
    T* release() { return std::exchange(ptr_, nullptr); }
    void reset(T* p = nullptr) {
        unique_ptr temp(p);
        swap(temp);
    }
    void swap(unique_ptr& other) { std::swap(ptr_, other.ptr_); }
    explicit operator bool() const { return ptr_ != nullptr; }
};

// 全局 swap 函数
template <typename T>
void swap(unique_ptr<T>& lhs, unique_ptr<T>& rhs) {
    lhs.swap(rhs);
}

template <typename T>
void swap(unique_ptr<T[]>& lhs, unique_ptr<T[]>& rhs) {
    lhs.swap(rhs);
}

// 比较运算符
template <typename T>
bool operator==(const unique_ptr<T>& lhs, const unique_ptr<T>& rhs) {
    return lhs.get() == rhs.get();
}

template <typename T>
bool operator!=(const unique_ptr<T>& lhs, const unique_ptr<T>& rhs) {
    return !(lhs == rhs);
}

template <typename T>
bool operator<(const unique_ptr<T>& lhs, const unique_ptr<T>& rhs) {
    return lhs.get() < rhs.get();
}

#endif // LEETCODE_UNIQUE_PTR_H
```


### 四、总结
1. 核心问题：移动赋值的 `const` 错误、缺少 `return *this`、`reset` 异常安全、缺少数组特化。
2. 关键疑问解答：
   - `&&` 是右值引用，和二级指针无关，其作用是绑定右值，支持「偷资源」的移动语义。
   - `operator*` 返回 `T&`、`operator->` 返回 `T*` 是为了模仿原生指针的用法，保证语义一致。
3. 扩展：`unique_ptr` 的核心是「独占所有权」，所以必须禁用拷贝、启用移动，通过 `delete`/`delete[]` 管理资源，避免内存泄漏。

## 我的答案



END