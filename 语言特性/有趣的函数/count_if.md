
`count_if` 是C++标准库算法里的核心计数函数，作用是**统计容器中满足「自定义条件」的元素个数**，和基础的 `count`（统计等于某个固定值的元素）相比，灵活性更高，支持自定义判断规则。

### 核心要点
1. **头文件**：必须包含 `<algorithm>` 才能使用；
2. **参数格式**：`count_if(起始迭代器, 结束迭代器, 条件谓词)`
   - 迭代器：指定要遍历的容器范围（左闭右开，和C++容器遍历规则一致）；
   - 条件谓词：可以是**函数指针、lambda表达式、函数对象**，要求是「返回bool值的可调用对象」，返回`true`则计数+1；
3. **返回值**：`size_t`类型（无符号整数），即满足条件的元素总数；
4. **遍历特性**：只读遍历，不会修改容器中的任何元素，属于非修改型算法。

### 极简示例（直观理解）
```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {1,2,3,4,5,6};
    // 统计偶数个数（用lambda作为条件谓词，最常用）
    size_t even_num = count_if(v.begin(), v.end(), [](int x){ return x%2 == 0; });
    cout << "偶数个数：" << even_num << endl; // 输出3
    
    // 统计大于3的数（另一个条件）
    size_t big3_num = count_if(v.begin(), v.end(), [](int x){ return x>3; });
    cout << "大于3的数：" << big3_num << endl; // 输出3
    return 0;
}
```

### 简单对比count
- `count(v.begin(), v.end(), 3)`：只能统计容器中**等于3**的元素个数；
- `count_if(...)`：能统计「偶数、大于3、自定义结构体满足某字段要求」等任意条件的元素。

### 总结
`count_if` 是C++中**按条件计数**的标准方法，核心价值是将「遍历容器」和「条件判断」解耦，无需手写for循环，代码更简洁、可读性更高，是STL算法中最常用的工具之一。