
DECK: 面试题

## constexpr是什么？


## 标准答案

`constexpr` 是 C++11 引入的关键字，核心作用是**声明“编译期常量/可编译期执行的实体”**，兼顾常量性与编译期计算能力，核心目标是提升性能（避免运行时开销）、增强类型安全，还能用于要求编译期常量的场景（如数组大小、模板参数）。

### 核心特性与使用场景
1. **修饰变量：编译期确定的常量**
   - 必须用**编译期可计算的表达式**初始化（不能是运行时才能确定的值，如用户输入、运行时变量）；
   - 本质是“更强的 `const`”：`const` 可能是运行时常量（如 `const int x = rand()`），但 `constexpr` 变量一定是编译期常量。
   ```cpp
   constexpr int MaxSize = 1024; // 编译期确定，可用于数组大小
   int arr[MaxSize]; // 合法（数组大小要求编译期常量）
   
   constexpr int Add(int a, int b) { return a + b; }
   constexpr int Sum = Add(3, 5); // 编译期计算为 8，运行时无开销
   ```

2. **修饰函数：可编译期执行的“常量函数”**
   - 函数体必须简单（C++11 要求单条 `return` 语句，C++14 放松限制，支持循环、条件判断等）；
   - 若传入的参数是编译期常量，函数会在编译期计算结果；若传入运行时变量，退化为普通函数（运行时执行），兼容两种场景。
   ```cpp
   // C++14 支持循环的 constexpr 函数
   constexpr int Factorial(int n) {
       int res = 1;
       for (int i = 1; i <= n; ++i) res *= i;
       return res;
   }
   
   constexpr int Fac5 = Factorial(5); // 编译期计算为 120
   int n = 6;
   int Fac6 = Factorial(n); // 运行时计算（n 是运行时变量）
   ```

3. **修饰类/结构体（C++11 后）**
   - 可修饰构造函数：允许用 `constexpr` 构造函数创建编译期常量对象；
   - 可修饰成员函数：表示该函数不修改对象状态，且可在编译期调用。
   ```cpp
   struct Point {
       constexpr Point(int x, int y) : x(x), y(y) {} // constexpr 构造函数
       constexpr int GetX() const { return x; } // constexpr 成员函数
       int x, y;
   };
   
   constexpr Point p(3, 4); // 编译期创建对象
   constexpr int px = p.GetX(); // 编译期获取成员，值为 3
   ```

### 核心价值
- **性能优化**：编译期完成计算，避免运行时重复计算（如常量表达式、简单算法）；
- **类型安全**：编译期检查常量合法性（如非法初始化会直接编译报错）；
- **适配编译期场景**：可直接作为模板参数、数组大小、`case` 标签等（这些场景仅接受编译期常量）。

### 关键限制（简要）
- 初始化/参数必须是“编译期可计算表达式”（不能依赖运行时状态，如 `new` 动态分配、`rand()` 等）；
- 函数体内不能有副作用（如修改全局变量、IO 操作）。

## 我的答案

我不会，你好好看上面吧


END
<!--ID: 1763996189970-->
