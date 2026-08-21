

```cpp
#include <utility> // 用于std::move

template<typename T>
class my_unique_ptr {
private:
    T* ptr; // 指向管理的资源

public:
    // 构造函数：接管原始指针的所有权
    explicit my_unique_ptr(T* p = nullptr) : ptr(p) {}

    // 析构函数：自动释放资源
    ~my_unique_ptr() {
        delete ptr;
        ptr = nullptr;
    }

    // 禁用拷贝构造函数（保证独占性）
    my_unique_ptr(const my_unique_ptr& other) = delete;

    // 禁用拷贝赋值运算符
    my_unique_ptr& operator=(const my_unique_ptr& other) = delete;

    // 移动构造函数：转移所有权
    my_unique_ptr(my_unique_ptr&& other) noexcept : ptr(other.ptr) {
        other.ptr = nullptr; // 原对象放弃所有权
    }

    // 移动赋值运算符：转移所有权
    my_unique_ptr& operator=(my_unique_ptr&& other) noexcept {
        if (this != &other) { // 避免自赋值
            delete ptr;       // 释放当前拥有的资源
            ptr = other.ptr;  // 接管新资源
            other.ptr = nullptr; // 原对象放弃所有权
        }
        return *this;
    }

    // 重载*运算符：访问所指向的对象
    T& operator*() const {
        return *ptr;
    }

    // 重载->运算符：访问所指向对象的成员
    T* operator->() const {
        return ptr;
    }

    // 获取原始指针
    T* get() const {
        return ptr;
    }

    // 释放所有权，并返回原始指针
    T* release() {
        T* temp = ptr;
        ptr = nullptr;
        return temp;
    }

    // 重置指针，指向新的资源
    void reset(T* p = nullptr) {
        if (ptr != p) { // 避免释放相同资源
            delete ptr;
            ptr = p;
        }
    }
};

```



### 手撕 `unique_ptr` 与控制权转移（移动语义）解析

`unique_ptr` 是 C++11 引入的智能指针，核心特性是**独占所有权**——同一时间只能有一个 `unique_ptr` 管理某块动态内存，避免内存泄漏和 double free 问题。


#### 1. 核心设计要点（手撕实现思路）
- **私有成员**：存储指向动态内存的原始指针（如 `T* ptr`）。
- **构造/析构**：
  - 构造函数接收原始指针，接管所有权。
  - 析构函数自动释放 `ptr` 指向的内存（`delete ptr`）。
- **禁用拷贝**：删除拷贝构造函数和拷贝赋值运算符（`unique_ptr(const unique_ptr&) = delete;`），确保独占性。
- **支持移动**：实现移动构造和移动赋值，通过移动语义转移所有权。


#### 2. 控制权转移（移动语义）
`unique_ptr` 不允许拷贝，但可以通过**移动语义**转移控制权：
- **移动构造**：新 `unique_ptr` 接管原指针，原指针被置空（避免同一块内存被两次释放）。
  ```cpp
  unique_ptr(unique_ptr&& other) noexcept : ptr(other.ptr) {
      other.ptr = nullptr; // 原对象放弃所有权
  }
  ```
- **移动赋值**：释放当前指针指向的内存，接管右值对象的指针，再将原对象指针置空。
  ```cpp
  unique_ptr& operator=(unique_ptr&& other) noexcept {
      if (this != &other) {
          delete ptr;       // 释放当前资源
          ptr = other.ptr;  // 接管新资源
          other.ptr = nullptr; // 原对象放弃所有权
      }
      return *this;
  }
  ```


#### 3. 关键特性
- 所有权唯一：任何时候只有一个 `unique_ptr` 有效指向资源。
- 自动释放：超出作用域时，析构函数自动释放资源，无需手动调用 `delete`。
- 移动语义是核心：通过 `std::move()` 显式触发移动，转移控制权后原 `unique_ptr` 失效（指针为 `nullptr`）。

例如：
```cpp
unique_ptr<int> u1(new int(10));
unique_ptr<int> u2 = std::move(u1); // u2 接管所有权，u1 变为 null
```

这种设计既保证了内存安全，又通过移动语义灵活传递资源控制权，适合管理动态分配的单个对象。
