
DECK: 面试题

## 0.1 自己写一个类型怎么样能调用stl算法


## 0.2 标准答案
### 0.2.1 一、为什么定义好类型和迭代器就能用STL？
STL（标准模板库）的算法（如`std::reverse`/`std::find`/`std::for_each`）、容器适配器都是**模板泛型代码**，它们不依赖具体的容器类型，而是依赖**容器提供的统一接口和迭代器特征**。

简单说：**STL算法只认「迭代器的规矩」，不认具体容器**，而我们定义的`value_type`/`iterator`等类型别名，以及符合规范的迭代器（`begin()`/`end()`等），就是让String类满足了STL的「规矩」，因此能无缝对接。

### 0.2.2 二、STL判断能否使用的核心依据：**迭代器特性（iterator_traits）**
STL的底层通过**`std::iterator_traits`** 这个模板类，从容器/迭代器中**萃取（extract）** 必要的信息，只要能萃取出这些信息，STL算法就可以正常工作。

#### 0.2.2.1 `std::iterator_traits` 要萃取的5个核心类型
这也是我们在String类中定义 `difference_type` / `value_type` 等的原因，**必须完整提供**：

| 类型别名          | 含义                     | 你的String实现                |
|-------------------|--------------------------|------------------------------|
| `value_type`      | 迭代器指向的元素类型     | `char`                       |
| `reference`       | 元素的引用类型           | `char&`                      |
| `pointer`         | 元素的指针类型           | `char*`                      |
| `difference_type` | 两个迭代器的差值类型     | `std::ptrdiff_t`（整数型）|
| `iterator_category` | 迭代器的类别       | 你的`char*`默认是**随机访问迭代器** |

#### 0.2.2.2 迭代器的**类别**是STL算法的关键优化依据
STL会根据迭代器类别，选择**效率最高的实现方式**（比如随机访问迭代器可以用`it + n`，而单向迭代器只能`++it`循环n次）。
你的String用`char*`作为迭代器，`char*`是原生指针，默认属于**随机访问迭代器**（最高级别的迭代器），因此能支持所有STL算法（STL对随机访问迭代器的支持最全面）。

#### 0.2.2.3 容器必须提供**可调用的`begin()`/`end()`（及const版本）**
STL算法的入口都是「迭代器对」（`[first, last)`），比如`std::reverse(begin, end)`，容器只要能返回符合规范的迭代器，STL就可以直接使用。

### 0.2.3 三、是不是`for (auto c : s)`也可以了？
**是的！完全可以**。
C++11的**范围for循环（range-based for）** 是语法糖，它的底层会自动调用容器的`begin()`和`end()`获取迭代器，然后遍历，**只要容器满足以下两个条件**，就可以用范围for：
1. 提供**非const的`begin()`/`end()`**（非const对象遍历）或**const的`begin()`/`end()`**（const对象遍历）；
2. 迭代器支持**`++`（自增）** 和**`*`（解引用）** 操作。

你的String类已经实现了这两点，因此：
```cpp
String s = "hello";
// 可读可写遍历
for (auto &c : s) {
    c = toupper(c); // 改为大写
}
// 只读遍历
const String cs = "world";
for (auto c : cs) {
    std::cout << c << " ";
}
```
✅ 完全可以正常运行，和`std::string`的范围for使用方式一致。

### 0.2.4 四、补充：你的代码中迭代器相关的「隐式满足」和「小细节」
#### 0.2.4.1 为什么没定义`iterator_category`也能用？
因为你的迭代器是`char*`（原生指针），`std::iterator_traits`对原生指针有**特化版本**，会自动将其`iterator_category`设为`std::random_access_iterator_tag`，无需手动定义。
如果是**自定义迭代器（非原生指针）**，则需要手动定义`iterator_category`。

#### 0.2.4.2 反向迭代器`std::reverse_iterator`为什么能直接用？
`std::reverse_iterator`是STL提供的**迭代器适配器**，它接收一个正向迭代器作为模板参数，自动实现「反向遍历」的逻辑（`++`对应正向的`--`，`*`返回正向迭代器的前一个元素），只要正向迭代器符合规范，反向迭代器就可以无缝适配。

### 0.2.5 五、一句话总结核心逻辑
```
容器定义标准类型别名 + 提供begin/end返回符合规范的迭代器 
→ std::iterator_traits能萃取出STL需要的信息 
→ STL算法可以泛型处理该容器的迭代器 
→ 容器支持STL算法 + 范围for循环
```

### 0.2.6 六、验证：你的String类已支持的STL操作示例
```cpp
String s = "123456";
// 1. STL算法
std::reverse(s.begin(), s.end()); // 反转：654321
std::find(s.begin(), s.end(), '3'); // 查找字符3，返回迭代器
// 2. 范围for
for (auto &c : s) c += 1; // 每个字符+1：765432
// 3. 反向迭代器遍历
for (auto it = s.rbegin(); it != s.rend(); ++it) {
    std::cout << *it; // 输出234567
}
```
以上代码都能正常编译运行，因为你的String类已经完全满足STL的接口规范。

我可以帮你写一个**完整的测试代码**，验证所有STL算法和范围for的使用场景，直接编译就能看效果，需要吗？

## 0.3 TODO


## 0.4 使用场景(举例)



END