 
DECK: 面试题

## strlen和sizeof什么区别


## 标准答案
1.  `strlen` 是一个函数, 只能以 `char*` 作为参数, 用来计算指定字符串 `str` 的长度, 但不包括结束字符 `'\0'`, 所以其参数必须是以 `'\0'` 结尾才行. 否则就是一个随机数 (会在内存里一直检测到一个 `'\0'` 才停止)
2. `sizeof` 是一个单目运算符, 它的参数可以是数组/指针/字符串/对象等等, 计算的是占用空间的实际字节数.

``` cpp
int main() {
    int a = 10;
    int *p = &a;
    char c = 'c';
    char *pc = &c;

    // format用{}占位符，不是%d
    cout << format("sizeof(int) = {}\n", sizeof(int));
    cout << format("sizeof(int*) = {}\n", sizeof(p));
    cout << format("sizeof(char) = {}\n", sizeof(char));
    cout << format("sizeof(char*) = {}\n", sizeof(pc));
    cout << format("a = {}\n", a);

    char s2[] = "0123456789";
    cout << format("sizeof(s2) = {}\n", sizeof(s2));
    cout << format("strlen(s2) = {}\n", strlen(s2));
    cout << format("strlen(*s2) = {}\n", sizeof(*s2));
    return 0;
}

// sizeof(int) = 4
// sizeof(int*) = 8
// sizeof(char) = 1
// sizeof(char*) = 8
// a = 10
// sizeof(s2) = 11
// strlen(s2) = 10
// strlen(*s2) = 1
```
---

还有一个就是有的数据结构会因为为了内存对齐之后快速读写, 
``` cpp
class A{
	int i;
	int j;
	char k;
}  

A a
cout << sizeof(a) << endl; // 输出12
```
为什么不是 `4 + 4 + 1` 而是 `12` 呢, 这就涉及到了内存对齐的问题
[[内存对齐是什么]]

---
后来又有了 `s.length()` 和 `s.size()`, 它们两效果上没有区别, 都是求长度

| 方法         | 最初设计目标 | 核心适用对象                                        | 底层实现            | 返回值                 |
| ---------- | ------ | --------------------------------------------- | --------------- | ------------------- |
| `length()` | 针对字符串  | 仅**字符串类**（`string`）                           | 与`size()`完全相同   | 字符串有效字符数（无`\0`）     |
| `size()`   | 针对容器   | 所有**STL 容器**（`vector`/`list`/`map`/`string`等） | 与`length()`完全相同 | 容器有效元素个数 / 字符串有效字符数 |

**核心结论**：对 `string` 类来说，`s.length()` 和 `s.size()`**无任何区别**，底层源码是完全一样的实现，返回结果完全相同。

---
#### 对比：`strlen` / `sizeof` / `length()` / `size()`

|标识符|类型|适用对象|计算目标|针对`string s = "hello"`的结果|
|---|---|---|---|---|
|`strlen()`|函数（C/C++）|C 风格字符串（`char*`/`char[]`）|有效字符数（不含`\0`）|需转 C 串：`strlen(s.c_str())=5`|
|`sizeof`|单目运算符|任意类型 / 变量 / 数组 / 对象|占用**实际内存字节数**（含内存对齐 /`\0`）|`sizeof(s)`：随编译器 / 版本变化（如 32/40，不是 5）|
|`length()`|成员方法|C++ `string`|有效字符数（不含`\0`）|`s.length()=5`|
|`size()`|成员方法|C++ `string`+ 所有 STL 容器|有效元素 / 字符数（不含`\0`）|`s.size()=5`|

**关键坑点**：别把`string`的`size()`和`sizeof`混淆！`sizeof(s)`计算的是`string`对象**本身的内存占用**（包含指针、容量、长度等成员变量），不是字符串的字符数，而`s.size()`是专门返回字符数的。


## 使用场景(举例)


## 我的答案



END
<!--ID: 1773973207957-->
