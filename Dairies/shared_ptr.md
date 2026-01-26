https://www.bilibili.com/video/BV15eWZeuEsV/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994
目前看到 12:00

需要实现
1. Shared_ptr 类型
	1. 手动重载==\*, ->, get ==函数
	2. 删除移动构造函数 `SpControlBlock(SpControlBlock &&) = delete` , 防止问题
	3. 
2. SpControlBlock 来用计数, 保证 Shared_ptr 正确释放, 不会 double free
3. CB内部的 m_refcnt 改为原子变量, 防止多线程竞争问题

- [ ] Static_cast
- [ ] Dynamic_cast
- [ ]  `EnableSharedFromThis` 基类：支持对象从自身成员函数中获取指向自己的 `SharedPtr`（避免悬空指针）；
- [ ] 辅助函数 `_S_setupEnableSharedFromThis`：自动为继承了 `EnableSharedFromThis` 的类绑定引用计数；
- [ ] 非数组版 `makeShared` / `makeSharedForOverwrite`：为单个对象（非数组）创建 `SharedPtr`，核心优化是 **内存融合分配**（对象与引用计数存在同一块内存），提升效率并保证异常安全。

---

这份代码是 `SharedPtr` 智能指针的**完整配套实现**，涵盖了「数组特化、`enable_shared_from_this` 支持、内存优化创建（`makeShared`）、智能指针类型转换」四大核心功能——本质是复刻了 C++ 标准库 `std::shared_ptr` 的关键接口，确保 `SharedPtr` 能覆盖普通对象、数组、多态、资源安全管理等所有场景。

下面按「功能模块」拆解，逐个讲透核心逻辑和用途：


## 一、数组特化：`SharedPtr<_Tp[]>`（支持数组类型的智能指针）
```cpp
template <class _Tp>
struct SharedPtr<_Tp[]> : SharedPtr<_Tp> {
    using SharedPtr<_Tp>::SharedPtr; // 继承基类所有构造函数

    // 重载 [] 运算符，支持数组下标访问
    std::add_lvalue_reference_t<_Tp> operator[](std::size_t __i) {
        return this->get()[__i];
    }
};
```
### 核心用途
解决「普通 `SharedPtr` 不支持数组下标访问」的问题——让 `SharedPtr` 能安全管理动态数组（`new T[]`），用法和裸数组一致。

### 关键细节
1. **模板特化**：`SharedPtr<_Tp[]>` 是 `SharedPtr` 的「数组版本特化」，仅当模板参数是数组类型（如 `int[]`）时匹配；
2. **继承基类**：`using SharedPtr<_Tp>::SharedPtr` 继承基类所有构造函数（如拷贝/移动构造、原始指针构造），无需重复实现；
3. **重载 `operator[]`**：支持 `p[i]` 下标访问数组元素，内部调用 `get()[i]`（裸指针下标），完全兼容裸数组用法。

### 示例
```cpp
// 管理动态数组（int[5]）
SharedPtr<int[]> p = makeShared<int[]>(5); 
p[0] = 10;   // 等价于 p.get()[0] = 10
p[3] = 20;   // 下标访问，安全无泄漏
std::cout << p[0]; // 输出 10
```
### 为什么需要单独特化？
普通 `SharedPtr<int>` 管理数组时，析构会调用 `delete p`（而非 `delete[] p`），导致数组元素析构不完整（内存泄漏）。但这里的数组特化配合 `makeShared` 的数组版本（后面会讲），会自动用 `delete[]` 释放，确保数组安全。


## 二、`EnableSharedFromThis`：支持 `shared_from_this()`（自我智能指针分发）
这部分是之前 `_S_setEnableSharedFromThisOwner` 函数的配套实现，核心是让继承该类的对象能安全返回自身的 `SharedPtr`。

### 核心逻辑拆解
#### 1. 成员与构造
```cpp
template <class _Tp>
struct EnableSharedFromThis {
private:
    _SpCounter *_M_owner; // 存储引用计数对象（由 _S_setEnableSharedFromThisOwner 赋值）
protected:
    EnableSharedFromThis() noexcept : _M_owner(nullptr) {} // 初始化 _M_owner 为 null
};
```
- `_M_owner` 是私有成员，仅通过友元函数 `_S_setEnableSharedFromThisOwner` 赋值（之前讲过的“绑定引用计数”）；
- 构造函数保护（`protected`）：确保该类只能被继承（不能直接实例化）。

#### 2. `shared_from_this()` 核心接口
```cpp
SharedPtr<_Tp> shared_from_this() {
    static_assert(std::is_base_of_v<EnableSharedFromThis, _Tp>, "must be derived class");
    if (!_M_owner) { throw std::bad_weak_ptr(); } // 未绑定计数，抛异常
    _M_owner->_M_incref(); // 引用计数+1
    // 调用 _S_makeSharedFused，复用 _M_owner 计数，重绑定指针为 this
    return _S_makeSharedFused(static_cast<_Tp *>(this), _M_owner);
}

// const 版本：返回 SharedPtr<const _Tp>
SharedPtr<_Tp const> shared_from_this() const { /* 逻辑一致，略 */ }
```
- **静态断言**：确保 `_Tp` 是 `EnableSharedFromThis` 的派生类（防止误用）；
- **空检查**：若 `_M_owner` 为 `nullptr`（对象未被 `SharedPtr` 管理），抛 `std::bad_weak_ptr` 异常（避免返回无效指针）；
- **计数+1**：返回新的 `SharedPtr` 时，引用计数+1（共享所有权，不重复析构）；
- **复用计数**：通过 `_S_makeSharedFused` 绑定 `this` 指针和 `_M_owner`，确保新 `SharedPtr` 和原 `SharedPtr` 共享计数。

#### 3. 友元函数：`_S_setEnableSharedFromThisOwner`
```cpp
template <class _Up>
inline friend void _S_setEnableSharedFromThisOwner(EnableSharedFromThis<_Up> *, _SpCounter *);

// 全局友元函数实现：给 _M_owner 赋值（绑定计数）
template <class _Up>
inline void _S_setEnableSharedFromThisOwner(EnableSharedFromThis<_Up> *__ptr, _SpCounter *__owner) {
    __ptr->_M_owner = __owner; 
}
```
- 友元权限：让该函数能访问 `EnableSharedFromThis` 的私有成员 `_M_owner`；
- 核心作用：在 `SharedPtr` 构造时（如 `makeShared`），将引用计数对象绑定到 `EnableSharedFromThis` 派生类实例。

#### 4. 绑定触发函数：`_S_setupEnableSharedFromThis`
```cpp
// 版本1：_Tp 继承自 EnableSharedFromThis → 执行绑定
template <class _Tp,
          std::enable_if_t<std::is_base_of_v<EnableSharedFromThis<_Tp>, _Tp>, int> = 0>
void _S_setupEnableSharedFromThis(_Tp *__ptr, _SpCounter *__owner) {
    _S_setEnableSharedFromThisOwner(static_cast<EnableSharedFromThis<_Tp>*>(__ptr), __owner);
}

// 版本2：_Tp 不继承 → 空实现（什么都不做）
template <class _Tp,
          std::enable_if_t<!std::is_base_of_v<EnableSharedFromThis<_Tp>, _Tp>, int> = 0>
void _S_setupEnableSharedFromThis(_Tp *, _SpCounter *) {}
```
- **编译期分流**：通过 `is_base_of_v` 判断对象是否需要绑定 `EnableSharedFromThis`；
- 调用时机：`makeShared` 或 `SharedPtr` 构造时自动调用（确保绑定计数）。

### 示例（用法）
```cpp
struct MyClass : EnableSharedFromThis<MyClass> {
    void func() {
        // 安全返回自身的 SharedPtr（共享计数，不重复析构）
        SharedPtr<MyClass> self = shared_from_this();
        // 传递 self 到其他线程/函数（确保对象在使用期间不被析构）
    }
};

// 使用
auto p = makeShared<MyClass>();
p->func(); // 安全调用，不会崩溃
```


## 三、`makeShared` 系列：优化版 `SharedPtr` 创建接口
`makeShared` 是创建 `SharedPtr` 的**推荐接口**，核心优势是「融合内存分配」（之前讲的 `_SpCounterImplFused`），比直接 `SharedPtr<T>(new T)` 少一次内存分配，性能更优、内存碎片更少。

代码中包含 4 个重载版本，覆盖「普通对象、普通对象（无初始化）、数组、数组（无初始化）」：

### 1. 普通对象（带参数初始化）：`makeShared<_Tp>(Args&&...)`
```cpp
template <class _Tp, class... _Args,
          std::enable_if_t<!std::is_unbounded_array_v<_Tp>, int> = 0> // 排除数组类型
SharedPtr<_Tp> makeShared(_Args &&...__args) {
    // 自定义删除器：仅调用 _Tp 的析构函数（内存释放交给 _SpCounterImplFused）
    auto const __deleter = [](_Tp *__ptr) noexcept { __ptr->~_Tp(); };
    using _Counter = _SpCounterImplFused<_Tp, decltype(__deleter)>; // 融合计数类型

    // 计算融合内存块的大小和对齐：容纳 _Counter（计数） + _Tp（对象）
    constexpr std::size_t __offset = std::max(alignof(_Tp), sizeof(_Counter));
    constexpr std::size_t __align = std::max(alignof(_Tp), alignof(_Counter));
    constexpr std::size_t __size = __offset + sizeof(_Tp);

    // 1. 分配融合内存块（兼容 C++17 对齐分配）
#if __cpp_aligned_new
    void *__mem = ::operator new(__size, std::align_val_t(__align));
    _Counter *__counter = reinterpret_cast<_Counter *>(__mem);
#else
    void *__mem = ::operator new(__size + __align); // 额外分配对齐空间
    _Counter *__counter = reinterpret_cast<_Counter *>(
        reinterpret_cast<std::size_t>(__mem) & __align); // 对齐调整
#endif

    // 2. 计算 _Tp 对象的内存地址（计数对象之后的偏移位置）
    _Tp *__object = reinterpret_cast<_Tp *>(reinterpret_cast<char *>(__counter) + __offset);

    try {
        // 3. 原地构造 _Tp 对象（传递参数）
        new (__object) _Tp(std::forward<_Args>(__args)...);
    } catch (...) {
        // 构造失败：释放内存，重新抛出异常（避免内存泄漏）
        ::operator delete(__mem);
        throw;
    }

    // 4. 构造融合计数对象（绑定 _object、_mem、删除器）
    new (__counter) _Counter(__object, __mem, __deleter);
    // 5. 绑定 EnableSharedFromThis（若需要）
    _S_setupEnableSharedFromThis(__object, __counter);
    // 6. 返回 SharedPtr（复用计数，重绑定指针）
    return _S_makeSharedFused(__object, __counter);
}
```
### 核心逻辑
- 一次分配「计数对象 + 被管理对象」的融合内存块；
- 原地构造（`placement new`）对象和计数，避免二次分配；
- 自定义删除器仅析构对象，内存释放交给 `_SpCounterImplFused` 的 `operator delete`。

### 2. 普通对象（无参数初始化）：`makeSharedForOverwrite()`
```cpp
template <class _Tp, std::enable_if_t<!std::is_unbounded_array_v<_Tp>, int> = 0>
SharedPtr<_Tp> makeSharedForOverwrite() {
    // 逻辑和 makeShared 一致，仅构造对象时无参数：new (__object) _Tp;
    // 用途：适合不需要初始化、后续会覆盖赋值的场景（性能略优）
}
```

### 3. 数组（带长度）：`makeShared<_Tp[]>(size_t __len)`
```cpp
template <class _Tp, class... _Args,
          std::enable_if_t<std::is_unbounded_array_v<_Tp>, int> = 0> // 仅匹配数组类型
SharedPtr<_Tp> makeShared(std::size_t __len) {
    // 分配动态数组（new T[__len]）
    std::remove_extent_t<_Tp> *__p = new std::remove_extent_t<_Tp>[__len];
    try {
        return SharedPtr<_Tp>(__p); // 用数组特化版 SharedPtr 管理
    } catch (...) {
        delete[] __p; // 构造失败，释放数组（避免内存泄漏）
        throw;
    }
}
```
- `std::remove_extent_t<_Tp>`：去掉数组维度，如 `int[]` → `int`；
- 数组释放：配合数组特化版 `SharedPtr`，析构时会调用 `delete[]`（确保数组安全）。

### 4. 数组（无初始化）：`makeSharedForOverwrite<_Tp[]>(size_t __len)`
- 逻辑和数组版 `makeShared` 一致，仅分配数组时不初始化（适合后续覆盖赋值）。

### `_S_makeSharedFused` 辅助函数
```cpp
template <class _Tp>
inline SharedPtr<_Tp> _S_makeSharedFused(_Tp *__ptr, _SpCounter *__owner) noexcept {
    return SharedPtr<_Tp>(__ptr, __owner); // 调用“重绑定构造函数”
}
```
- 简化「复用计数+重绑定指针」的逻辑：直接返回绑定后的 `SharedPtr`；
- 被 `makeShared` 和 `shared_from_this()` 调用。


## 四、智能指针类型转换：`staticPointerCast` 等 4 个接口
这 4 个函数是 `SharedPtr` 的**类型转换工具**，对应裸指针的 `static_cast`/`const_cast`/`reinterpret_cast`/`dynamic_cast`，核心是「转换指针类型，但共享原引用计数」（依赖之前讲的“重绑定构造函数”）。

### 1. `staticPointerCast`（编译期类型转换）
```cpp
template <class _Tp, class _Up>
SharedPtr<_Tp> staticPointerCast(SharedPtr<_Up> const &__ptr) {
    // 裸指针层面 static_cast，编译期检查类型兼容性
    return SharedPtr<_Tp>(__ptr, static_cast<_Tp *>(__ptr.get()));
}
```
- 适用场景：已知类型兼容的转换（如派生类→基类、void*→T*）；
- 特点：无运行时开销，编译期报错（非法转换）。

### 2. `constPointerCast`（去除/添加 const 限定）
```cpp
template <class _Tp, class _Up>
SharedPtr<_Tp> constPointerCast(SharedPtr<_Up> const &__ptr) {
    // 裸指针层面 const_cast，修改 const 限定
    return SharedPtr<_Tp>(__ptr, const_cast<_Tp *>(__ptr.get()));
}
```
- 适用场景：需要修改 `const` 对象（谨慎使用，避免破坏常量性）；
- 特点：编译期生效，无运行时开销。

### 3. `reinterpretPointerCast`（强制类型转换）
```cpp
template <class _Tp, class _Up>
SharedPtr<_Tp> reinterpretPointerCast(SharedPtr<_Up> const &__ptr) {
    // 裸指针层面 reinterpret_cast，强制二进制转换
    return SharedPtr<_Tp>(__ptr, reinterpret_cast<_Tp *>(__ptr.get()));
}
```
- 适用场景：低层次二进制兼容的转换（如 `int*`→`char*`）；
- 特点：风险极高，仅在明确二进制兼容时使用。

### 4. `dynamicPointerCast`（运行时多态转换）
```cpp
template <class _Tp, class _Up>
SharedPtr<_Tp> dynamicPointerCast(SharedPtr<_Up> const &__ptr) {
    // 裸指针层面 dynamic_cast，运行时检查类型兼容性
    _Tp *__p = dynamic_cast<_Tp *>(__ptr.get());
    if (__p != nullptr) {
        return SharedPtr<_Tp>(__ptr, __p); // 转换成功，返回共享计数的指针
    } else {
        return nullptr; // 转换失败，返回空指针
    }
}
```
- 适用场景：多态类型转换（基类→派生类，需基类有虚函数）；
- 特点：运行时检查，转换失败返回空指针（安全）；
- 要求：基类必须有虚函数（否则 `dynamic_cast` 无法工作）。

### 示例（多态转换）
```cpp
struct Base { virtual ~Base() {} };
struct Derived : Base {};

auto p_derived = makeShared<Derived>();
SharedPtr<Base> p_base = staticPointerCast<Base>(p_derived); // 派生→基类（编译期）

// 基类→派生类（运行时检查）
auto p_derived2 = dynamicPointerCast<Derived>(p_base);
if (p_derived2) { /* 转换成功 */ }
```


## 五、整体总结：`SharedPtr` 完整功能闭环
这份代码补全了 `SharedPtr` 的所有核心能力，形成了完整的功能闭环：

| 功能模块   | 核心接口/组件                                          | 解决的问题                     |
| ------ | ------------------------------------------------ | ------------------------- |
| 基础内存管理 | `SharedPtr` 构造/析构/拷贝/移动                          | 自动引用计数，避免内存泄漏、重复释放        |
| 数组支持   | `SharedPtr<_Tp[]>` 特化 + `operator[]`             | 安全管理动态数组，支持下标访问           |
| 自我指针分发 | `EnableSharedFromThis` + `shared_from_this()`    | 多态/回调场景安全返回自身 `SharedPtr` |
| 优化创建   | `makeShared` 系列（融合分配）                            | 减少内存分配次数，提升性能             |
| 类型转换   | 4 个 `xxxPointerCast` 接口                          | 多态/类型兼容场景的安全转换            |
| 访问接口   | `get()`/`operator->`/`operator*`/`operator bool` | 兼容裸指针用法，零学习成本             |

最终，这份 `SharedPtr` 实现完全对齐了 C++ 标准库 `std::shared_ptr` 的接口和行为，既能兼容裸指针的开发习惯，又能提供安全、高效的内存管理——是工业级智能指针的完整实现。