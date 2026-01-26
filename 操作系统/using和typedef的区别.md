
DECK: 面试题

## using和typedef的区别

## 标准答案
两者都是C++中创建类型别名的方法，但在C++11之后，`using` 有更多优势：

### 1. **语法差异**

```cpp
// typedef 语法
typedef long long ll;
typedef void (*FuncPtr)(int);  // 函数指针

// using 语法（C++11起）
using ll = long long;
using FuncPtr = void (*)(int);  // 更清晰
```

### 2. **可读性和直观性**

`using` 更直观，特别是对于复杂类型：

```cpp
// typedef - 指针类型
typedef int* IntPtr;
typedef int (*Func)(int, int);  // 函数指针

// using - 更清晰的语法
using IntPtr = int*;
using Func = int (*)(int, int);  // 看起来更像赋值

// 多层嵌套时差异更明显
typedef int (*FuncArray[10])(double);  // 难以理解
using FuncArray = int (*[10])(double);  // 稍微清晰些
```

### 3. **模板别名（关键区别！）**

**这是 `using` 最大的优势**：

```cpp
// typedef 无法创建模板别名！
template<typename T>
typedef std::map<T, std::vector<T>> MapToVec;  // 错误！不允许

// using 可以创建模板别名
template<typename T>
using MapToVec = std::map<T, std::vector<T>>;  // 正确

// 使用
MapToVec<int> myMap;  // 等价于 std::map<int, std::vector<int>>
```

### 4. **类型特征别名（C++14/17）**

```cpp
// C++14 中引入的类型特征别名都是用 using
namespace std {
    template<class T>
    using remove_const_t = typename remove_const<T>::type;
    
    template<class T>
    using decay_t = typename decay<T>::type;
}
```

### 5. **支持依赖类型的模板参数**

```cpp
template<typename T>
struct Container {
    // typedef 需要 typename 关键字
    typedef typename std::vector<T>::iterator iterator;
    
    // using 也需要，但语法更统一
    using iterator = typename std::vector<T>::iterator;
};
```

### 6. **示例对比**

```cpp
// 复杂的类型定义对比
typedef std::map<std::string, 
                 std::vector<std::pair<int, double>>> 
        ComplexType1;

using ComplexType2 = std::map<std::string, 
                              std::vector<std::pair<int, double>>>;

// 模板类成员类型别名
template<typename T>
class MyClass {
public:
    // typedef 方式
    typedef std::vector<std::pair<T, T>> PairVector;
    
    // using 方式
    using PairVector = std::vector<std::pair<T, T>>;
};
```

### 7. **实际使用建议**

```cpp
// 现代C++编程中推荐：
// 1. 简单别名
using ll = long long;
using ull = unsigned long long;

// 2. 函数指针
using Callback = void (*)(int, const std::string&);

// 3. 模板别名
template<typename T, typename U>
using Pair = std::pair<T, U>;

template<typename T>
using SmartPtr = std::shared_ptr<T>;

// 4. STL容器别名
template<typename T>
using Vec = std::vector<T>;

template<typename K, typename V>
using Map = std::unordered_map<K, V>;
```

### **总结对比表**

| 特性 | `typedef` | `using` |
|------|-----------|---------|
| 创建时间 | C语言/C++98 | C++11 |
| 语法直观性 | 较差（特别是复杂类型） | 较好（类似赋值） |
| 模板别名 | **不支持** | **支持** |
| 可读性 | 复杂类型难以阅读 | 相对清晰 |
| 现代C++ | 逐渐被淘汰 | **推荐使用** |
| 兼容性 | 所有C++版本 | C++11及以上 |

### **建议**
- **对于新代码，总是使用 `using`**
- 只有在维护遗留代码或需要兼容C++98时才使用 `typedef`
- 特别是需要模板别名时，必须使用 `using`

在你的二叉树问题中，虽然两种都可以，但使用 `using` 是现代C++的最佳实践：

```cpp
// 推荐
using ll = long long;
using ull = unsigned long long;

// 而不是
// typedef long long ll;
// typedef unsigned long long ull;
```

## 我的答案



END
<!--ID: 1769078758562-->
