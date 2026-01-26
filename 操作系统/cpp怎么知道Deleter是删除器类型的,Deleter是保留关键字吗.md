
DECK: 面试题

## cpp怎么知道Deleter是删除器类型的,Deleter是保留关键字吗


## 标准答案
C++ 并**不会通过“关键字”或“内置规则”自动识别 `_Deleter` 是删除器类型**—— `_Deleter` 也**不是 C++ 保留关键字**。它本质是一个「模板参数名」，其“删除器”的身份完全来自 **代码的“约定用法”和“接口约束”**：简单说，`_Deleter` 之所以是“删除器”，是因为代码里用它做了删除器该做的事（调用 `operator()` 释放资源），而非语言层面有特殊标记。

下面分两个核心问题拆解，彻底讲透：


### 一、先明确：`_Deleter` 不是保留关键字
C++ 的**保留关键字**是语言层面预先定义的、有特殊语义的单词（如 `int`、`class`、`if`、`return`、`nullptr` 等），用户不能把它们当作变量名、模板参数名、类名等。

而 `_Deleter` 是一个**自定义的模板参数名**：
- 前缀 `_` 是编码约定（比如 C++ 标准库常用 `_` 或 `_M_` 表示“内部成员/参数”，避免和用户代码冲突）；
- 你完全可以把它改成其他名字（如 `MyDeleter`、`ReleaseFunc`），代码功能完全不变。

示例：把 `_Deleter` 改成 `ReleaseTool`，逻辑完全等价：
```cpp
// 把 _Deleter 改成 ReleaseTool，依然是删除器类型
template <class _Tp, class ReleaseTool> // 这里改名了
struct _SpCounterImpl final : _SpCounter {
    _Tp *_M_ptr;
    [[no_unique_address]] ReleaseTool _M_deleter; // 对应改名

    // 带删除器的构造函数：参数类型也改成 ReleaseTool
    explicit _SpCounterImpl(_Tp *__ptr, ReleaseTool __deleter) noexcept
        : _M_ptr(__ptr), _M_deleter(std::move(__deleter)) {}

    ~_SpCounterImpl() noexcept override {
        _M_deleter(_M_ptr); // 依然是调用“删除器”的释放逻辑
    }
};
```
结论：`_Deleter` 只是一个“见名知义”的模板参数名，和关键字无关，语言层面不赋予它任何特殊含义。


### 二、核心：C++ 如何“识别”`_Deleter` 是删除器类型？—— 靠「接口约束」（鸭子类型）
C++ 是「静态类型语言」，但对模板参数的约束是「隐式接口约束」（也叫“鸭子类型”）：**一个类型只要满足模板代码对它的用法，就能作为该模板参数传入**。

具体到 `_Deleter`，它能成为“删除器类型”，只需要满足一个核心用法（接口约束）：
> 能被当作“可调用对象”，接收 `_Tp*` 类型的参数（即支持 `_Deleter{}(_Tp*)` 这样的调用）。

这个约束不是靠语言关键字声明的，而是靠 `_SpCounterImpl` 的代码逻辑“倒逼”的——如果传入的类型不满足这个约束，编译会直接报错。

#### 1. 满足“删除器接口”的类型有哪些？
只要能被 `()` 调用且接收 `_Tp*` 参数，都能作为 `_Deleter`，常见场景：
- 空类函数对象（如 `std::default_delete`）：重载了 `operator()`；
- 有状态类函数对象（如 `LoggingDeleter`）：重载了 `operator()` 且带成员变量；
- 无捕获 lambda 表达式（本质是无状态空类，自动重载 `operator()`）；
- 函数指针（指向一个接收 `_Tp*` 参数、无返回值的函数）。

示例：不同类型的 `_Deleter` 都能生效：
```cpp
// 1. 空类删除器（std::default_delete 类似）
struct EmptyDeleter {
    void operator()(int* p) const { delete p; }
};

// 2. 有状态删除器
struct LoggingDeleter {
    std::string prefix;
    void operator()(int* p) const {
        std::cout << prefix << ": deleting" << std::endl;
        delete p;
    }
};

// 3. 函数指针（删除器）
void freeInt(int* p) { delete p; }

int main() {
    // 场景1：空类删除器
    _SpCounterImpl<int, EmptyDeleter> c1(new int(10));

    // 场景2：有状态删除器
    _SpCounterImpl<int, LoggingDeleter> c2(new int(20), LoggingDeleter{"Log"});

    // 场景3：函数指针删除器
    _SpCounterImpl<int, void(*)(int*)> c3(new int(30), freeInt);

    // 场景4：无捕获 lambda（本质是无状态删除器）
    auto lambdaDeleter = [](int* p) { delete p; };
    _SpCounterImpl<int, decltype(lambdaDeleter)> c4(new int(40), lambdaDeleter);

    return 0;
}
```
这些类型之所以能作为 `_Deleter`，不是因为它们有“删除器标记”，而是因为它们都满足 `_M_deleter(_M_ptr)` 这个调用语法。


#### 2. 不满足约束会怎么样？—— 编译报错
如果传入一个不支持 `operator()`（或函数指针不匹配）的类型作为 `_Deleter`，编译会直接失败，提示“无法调用该类型的 `operator()`”。

示例：错误的 `_Deleter` 类型：
```cpp
// 不满足删除器接口的类型：没有重载 operator()，也不是函数指针
struct BadDeleter {
    int x; // 仅成员变量，无 operator()
};

int main() {
    // 错误：BadDeleter 不支持 operator()(int*)
    _SpCounterImpl<int, BadDeleter> c(new int(10));
    // 编译报错（类似）：error: no match for call to '(BadDeleter) (int*)'
    return 0;
}
```
这就是 C++ 模板的“隐式接口约束”：不是“提前声明”`_Deleter` 必须是删除器，而是“用的时候检查”——不满足用法就报错，满足就生效。


### 三、补充：标准库的“删除器约定”
你贴的代码是 C++ 标准库（如 GCC 的 libstdc++）中 `std::shared_ptr` 的内部实现。在标准库中，`_Deleter` 作为模板参数的“删除器身份”，还有一个隐含约定：
- 标准库为 `std::shared_ptr` 提供了默认模板参数 `_Deleter = std::default_delete<_Tp>`（空类删除器），这是标准库层面的“默认删除器约定”；
- 用户自定义 `_Deleter` 时，需遵循“无异常释放”的约定（即 `operator()` 应标记为 `noexcept`），避免析构时抛出异常导致程序崩溃（标准库的 `std::default_delete` 也满足这一点）。

但这依然是「约定」，而非语言强制——用户如果在删除器中抛出异常，编译不会报错，但运行时可能出问题（这是用户的用法错误）。


### 四、总结
1. `_Deleter` 不是 C++ 保留关键字，只是一个“见名知义”的模板参数名（前缀 `_` 是标准库的内部命名约定）；
2. C++ 不会“自动识别”`_Deleter` 是删除器类型，而是靠「隐式接口约束」：只要该类型支持 `_M_deleter(_M_ptr)`（即能被调用且接收 `_Tp*` 参数），就是合法的删除器类型；
3. 标准库通过默认模板参数 `std::default_delete` 提供了默认删除器，用户可通过自定义满足接口的类型，实现自定义释放逻辑。

简单说：`_Deleter` 是“删除器”，全靠代码里“用它来释放资源”这个行为定义，而非语言层面的特殊标记。

## 我的答案



END
<!--ID: 1769078758574-->
