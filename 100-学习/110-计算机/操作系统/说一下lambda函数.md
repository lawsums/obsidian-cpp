
DECK: 面试题

## 说一下lambda函数

## 我的答案
Lambda 函数是一个 c++里面的语法糖, 通过 lambda 在编译之后会生成一个类似以下内容的结构
``` cpp
[&x, &y](int a, int b) {
	return a + b;
}
->
class lambda_XXX {  
    int operator()(int a, int b) const {  
        return a + b;  
    }  
    int &x;  
    int &y;  
};
```
所以 lambda 其实是一个类, 不过是一个可调用的函数类, 因此和 functional 也有联系

## 标准答案
C++ Lambda 函数是 C++11 引入的语法糖，本质是编译器自动生成的匿名函数对象（Functor），编译后会转化为包含重载 `operator()` 的匿名类；其核心特性是支持捕获外部变量，可灵活替代传统函数指针/仿函数，解决“临时短小逻辑需封装但不想定义命名类/函数”的问题。

## TODO
1. 为什么无 mutable 的 lambda 不能修改按值捕获的变量？如何让其可修改？
	   无 mutable 的话c++会自动添加一个 const, 手动写一个 mutable 就可以修改了
2. lambda 的捕获列表（`[]` / `[&]` / `[=]` / `[this]`）各自的含义和使用风险（如悬垂引用）？
	   `[&]` 是全部引用捕获, `[=]` 是全部值捕获, `[this]` 是捕获当前类的 this 指针, 风险是[[悬垂引用]]
3. Lambda 里面 `void operator ()(int a, int b) const/mutable` mutable 和 const 的区别?

## 应用场景
### 场景案例：STL 算法中自定义排序规则
#### 不用 lambda 的问题：
若要对一个存储 `pair<string, int>` 的 vector 按 `int` 值降序排序，传统方式需定义命名仿函数或普通函数，代码分散且冗余：
```cpp
#include <vector>
#include <algorithm>
#include <utility>
using namespace std;

// 定义命名仿函数，代码冗余且需单独维护
struct DescSortByInt {
    bool operator()(const pair<string, int>& a, const pair<string, int>& b) {
        return a.second > b.second;
    }
};

int main() {
    vector<pair<string, int>> vec = {{"A", 3}, {"B", 1}, {"C", 2}};
    // 调用时需显式传入仿函数类型，逻辑与调用处分离
    sort(vec.begin(), vec.end(), DescSortByInt());
    return 0;
}
```

#### 用 lambda 的好处：
逻辑内联在调用处，代码更紧凑、可读性更高，无需额外定义命名实体，且可灵活捕获外部变量（比如动态调整排序规则）：
```cpp
#include <vector>
#include <algorithm>
#include <utility>
using namespace std;

int main() {
    vector<pair<string, int>> vec = {{"A", 3}, {"B", 1}, {"C", 2}};
    // lambda 内联定义排序规则，逻辑与调用处紧密结合
    sort(vec.begin(), vec.end(), [](const pair<string, int>& a, const pair<string, int>& b) {
        return a.second > b.second; // 直接定义降序逻辑
    });

    // 进阶：捕获外部变量动态调整排序规则
    bool ascending = false; // 控制升序/降序
    sort(vec.begin(), vec.end(), [ascending](const pair<string, int>& a, const pair<string, int>& b) {
        return ascending ? a.second < b.second : a.second > b.second;
    });
    return 0;
}
```
**核心收益**：lambda 让临时、短小的逻辑封装更轻量，避免“为一行逻辑定义一个类/函数”的冗余，同时支持捕获外部变量，灵活适配动态逻辑需求。

### 总结
1. Lambda 本质是匿名函数对象，编译后转为带 `operator()` 的匿名类，捕获的变量会成为类的成员；
2. 无 mutable 时 `operator()` 是 const 成员函数，无法修改按值捕获的变量；
3. 核心优势是在 STL 算法、回调函数等场景中，实现轻量、内联的逻辑封装，替代冗余的命名仿函数/函数。

END
<!--ID: 1773973207860-->
