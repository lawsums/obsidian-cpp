
DECK: 面试题

## no_unique_address是什么


## 标准答案
`[[no_unique_address]] _Deleter _M_deleter;` 是 C++20 引入的**属性（attribute）+ 成员变量声明**，核心作用是：**允许成员变量 `_M_deleter` 与类的其他成员（或基类）共享内存地址，消除空类型（Empty Class）成员带来的内存开销**。

要理解它，需要从「空类的内存占用问题」和「`no_unique_address` 的解决思路」两方面拆解：


### 一、先搞懂：为什么需要 `[[no_unique_address]]`？
C++ 有个基础规则：**任何两个不同的对象，必须有不同的内存地址**（即「对象唯一性」）。这会导致一个问题：**空类（没有非静态成员、没有虚函数的类）作为成员变量时，会占用 1 字节内存**——哪怕它本身没有任何数据。

举个例子（没有 `no_unique_address` 时）：
```cpp
// 空类：没有任何成员，逻辑上占用 0 字节
struct EmptyDeleter {};

// 包含空类成员的类
struct MyPtr {
    int* _ptr;          // 占用 8 字节（64位系统）
    EmptyDeleter _del;  // 空类，但因「对象唯一性」，占用 1 字节
};

int main() {
    std::cout << sizeof(MyPtr);  // 输出 16（而非 8+0=8）
    // 原因：内存对齐（int* 对齐到 8 字节），_del 占 1 字节，但整体需对齐到 8 的倍数，所以总大小 16
}
```
这里的 `_del` 是空类，但被迫占用 1 字节，还因内存对齐导致整个 `MyPtr` 类的大小从理论 8 字节膨胀到 16 字节——这是没必要的开销。

而 `[[no_unique_address]]` 的核心目的，就是**打破这个“空类成员必须占 1 字节”的限制**：允许空类成员与其他成员共享内存地址，从而消除冗余开销。


### 二、`[[no_unique_address]]` 的本质
`[[no_unique_address]]` 是 C++20 标准化的**类型属性**（attribute），用于修饰类的非静态数据成员，语义是：
> 该成员变量不需要拥有“唯一的内存地址”——如果它是「空类实例」，可以与类的其他非静态成员（或基类子对象）重叠存储（共享内存地址）；如果它不是空类，则行为与普通成员完全一致。

简单说：**对非空类成员，这个属性没用；对空类成员，它能“压缩”内存开销**。


### 三、回到你的代码：`[[no_unique_address]] _Deleter _M_deleter;`
这句话通常出现在 C++ 标准库（如 `std::unique_ptr`、`std::shared_ptr`）的实现中，拆解如下：

#### 1. 各部分含义
- `[[no_unique_address]]`：属性修饰符，告诉编译器：`_M_deleter` 不需要唯一地址，空类时可共享内存；
- `_Deleter`：模板参数类型（通常是智能指针的“删除器”类型，如 `std::default_delete`）；
- `_M_deleter`：成员变量名（前缀 `_M_` 是标准库的命名约定，表示“内部成员”，避免用户命名冲突）。

#### 2. 核心用途（为什么标准库要这么写？）
智能指针（如 `std::unique_ptr`）的删除器 `_Deleter` 常是「空类」（比如默认的 `std::default_delete` 就是空类）。通过 `[[no_unique_address]]` 修饰：
- 当 `_Deleter` 是空类时，`_M_deleter` 不占用额外内存，智能指针的大小仅由核心成员（如指向对象的指针 `_M_ptr`）决定；
- 当 `_Deleter` 是非空类时（用户自定义的有状态删除器），`_M_deleter` 正常占用内存，属性不影响行为。

举个对比示例（模拟 `std::unique_ptr` 简化实现）：
```cpp
// 空删除器（标准库的 std::default_delete 类似）
struct EmptyDeleter {
    void operator()(int* p) const { delete p; }
};

// 有状态删除器（用户自定义，非空）
struct LoggingDeleter {
    std::string log_prefix;  // 有成员，非空类
    void operator()(int* p) const {
        std::cout << log_prefix << ": deleting pointer\n";
        delete p;
    }
};

// 模拟 std::unique_ptr 的简化版本
template <typename T, typename Deleter = EmptyDeleter>
struct MyUniquePtr {
    T* _M_ptr;  // 核心指针成员
    [[no_unique_address]] Deleter _M_deleter;  // 带属性的删除器成员

    // 构造函数等（省略）
};

int main() {
    // 情况1：使用空删除器 EmptyDeleter
    std::cout << sizeof(MyUniquePtr<int>) << "\n";  // 输出 8（64位系统）
    // 原因：_M_deleter 是空类，通过 [[no_unique_address]] 共享 _M_ptr 的内存地址，无额外开销

    // 情况2：使用有状态删除器 LoggingDeleter
    std::cout << sizeof(MyUniquePtr<int, LoggingDeleter>) << "\n";  // 输出 8 + sizeof(std::string)（约 32）= 40（因对齐可能为 40）
    // 原因：_M_deleter 是非空类，属性失效，正常占用内存
}
```

如果没有 `[[no_unique_address]]`，`MyUniquePtr<int>` 的大小会是 16（`_M_ptr` 8 字节 + 空 `_M_deleter` 1 字节，对齐到 8 的倍数）——而加上属性后，大小直接减半，这就是标准库使用它的核心原因：**优化空删除器场景下的内存占用**。


### 四、关键注意点
1. **仅对空类有效**：如果 `_Deleter` 不是空类（有非静态成员、虚函数等），`[[no_unique_address]]` 不会改变任何行为，成员变量正常占用内存；
2. **不破坏对象唯一性**：只有当成员是“空类实例”时，才会共享地址——非空成员仍有唯一地址，不会与其他成员重叠；
3. **与 `[[maybe_unused]]` 区分**：前者是优化内存，后者是告诉编译器“该成员可能未使用，不要报警告”，用途完全不同；
4. **C++20 及以上支持**：这是 C++20 新增属性，旧标准（C++17 及以下）不支持，编译时需指定 `-std=c++20`（GCC/Clang）或 `/std:c++20`（MSVC）。


### 五、总结
`[[no_unique_address]] _Deleter _M_deleter;` 是标准库中**优化智能指针删除器内存占用**的经典写法：
- 核心作用：当删除器 `_Deleter` 是空类时，让 `_M_deleter` 与其他成员共享内存，消除 1 字节冗余开销；
- 本质：利用 C++20 新属性打破“空类成员必须占 1 字节”的限制，兼顾“空删除器零开销”和“有状态删除器正常工作”。

简单说：这行代码的目的就是「让智能指针在使用默认空删除器时，体积更小、更高效」。

## 我的答案



END
<!--ID: 1769078758571-->
