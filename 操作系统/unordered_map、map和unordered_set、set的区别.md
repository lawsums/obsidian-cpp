
DECK: 面试题

## unordered_map/unordered_set与map/set的区别


## 标准答案
## 一、底层数据结构

### **map/set**
- **底层实现**：红黑树（Red-Black Tree）
  - 一种自平衡的二叉搜索树
  - 每个节点额外存储颜色信息（红/黑）
  - 通过旋转和重新着色来保持平衡

### **unordered_map/unordered_set**
- **底层实现**：哈希表（Hash Table）
  - 数组 + 链表/红黑树（解决哈希冲突）
  - C++11中采用开放链地址法（separate chaining）

## 二、时间复杂度对比

### **map/set (红黑树实现)**

| 操作 | 平均时间复杂度 | 最坏情况 | 说明 |
|------|---------------|----------|------|
| **插入** | O(log n) | O(log n) | 红黑树保持平衡 |
| **删除** | O(log n) | O(log n) | 需要重新平衡 |
| **查找** | O(log n) | O(log n) | 二叉树搜索 |
| **遍历** | O(n) | O(n) | 中序遍历有序 |
| **获取最小/最大** | O(log n) | O(log n) | 最左/最右节点 |

**特性**：
- 所有操作的时间复杂度稳定在 **O(log n)**
- 元素自动按key排序（默认升序）

### **unordered_map/unordered_set (哈希表实现)**

| 操作 | 平均时间复杂度 | 最坏情况 | 说明 |
|------|---------------|----------|------|
| **插入** | O(1) | O(n) | 哈希冲突可能导致退化 |
| **删除** | O(1) | O(n) | 同插入 |
| **查找** | O(1) | O(n) | 哈希冲突最坏情况 |
| **遍历** | O(n) | O(n) | 无序遍历 |
| **获取最小/最大** | O(n) | O(n) | 需要遍历所有元素 |

**特性**：
- **平均O(1)**，但最坏情况可能退化到O(n)
- 元素**无序**存储

## 三、关键特性对比

| 特性           | map/set        | unordered_map/unordered_set |
| ------------ | -------------- | --------------------------- |
| **排序**       | 自动排序（key有序）    | 无序                          |
| **稳定性**      | 所有操作稳定O(log n) | 平均O(1)，最坏O(n)               |
| **内存占用**     | 较高（树节点开销）      | 较低（数组+链表）                   |
| **迭代器稳定性**   | 迭代器始终有效        | rehash时迭代器失效                |
| **自定义类型key** | 需要实现`<`运算符     | 需要实现 `hash` 函数和== 算符        |
| **适用场景**     | 需要有序遍历或范围查询    | 需要快速查找，不关心顺序                |

## 四、代码示例

### 自定义类型作为key

```cpp
// map/set 需要重载 < 运算符
struct Point {
    int x, y;
    bool operator<(const Point& other) const {
        return (x < other.x) || (x == other.x && y < other.y);
    }
};

// unordered_map/unordered_set 需要自定义哈希和相等比较
struct PointHash {
    size_t operator()(const Point& p) const {
        return hash<int>()(p.x) ^ (hash<int>()(p.y) << 1);
    }
};

struct PointEqual {
    bool operator()(const Point& a, const Point& b) const {
        return a.x == b.x && a.y == b.y;
    }
};

unordered_set<Point, PointHash, PointEqual> point_set;
```

### 性能测试示例

```cpp
#include <chrono>
#include <unordered_set>
#include <set>

void testPerformance(int n) {
    vector<int> nums(n);
    for(int i = 0; i < n; i++) nums[i] = rand();
    
    // 测试set
    auto start = chrono::high_resolution_clock::now();
    set<int> s(nums.begin(), nums.end());
    auto end = chrono::high_resolution_clock::now();
    cout << "set插入" << n << "个元素: " 
         << chrono::duration_cast<chrono::milliseconds>(end-start).count() << "ms" << endl;
    
    // 测试unordered_set
    start = chrono::high_resolution_clock::now();
    unordered_set<int> us(nums.begin(), nums.end());
    end = chrono::high_resolution_clock::now();
    cout << "unordered_set插入" << n << "个元素: "
         << chrono::duration_cast<chrono::milliseconds>(end-start).count() << "ms" << endl;
}
```

## 五、内存结构示意图

### **map (红黑树)**
```
          [10,B]
         /      \
     [5,R]      [15,R]
    /    \      /    \
 [3,B] [7,B] [12,B] [18,B]
```
- 每个节点：key + value + 颜色 + 3个指针（左、右、父）
- 内存不连续，指针跳转访问

### **unordered_map (哈希表)**
```
数组索引: 0    1    2    3    4
         |    |    |    |    |
         ∅  [1]→[11]  [2]   [3]
                ↓
               [21]
```
- 数组连续存储桶（bucket）
- 每个桶连接链表处理冲突
- C++11后链表过长会转为红黑树

## 六、实际选择建议

1. **选择map/set的情况**：
   - 需要元素有序
   - 需要范围查询（如lower_bound/upper_bound）
   - 对性能稳定性要求高（避免最坏情况O(n)）
   - 数据量较小或中等

2. **选择unordered_map/unordered_set的情况**：
   - 只需要快速查找，不关心顺序
   - 数据量较大，且哈希函数分布均匀
   - 能接受偶尔的性能波动
   - 内存使用需要优化

3. **特别提醒**：
   - `unordered_`容器在rehash时所有迭代器失效
   - 可以预先调用`reserve()`预留空间避免rehash
   - 默认负载因子为1.0，超过时会rehash

## 七、连续序列问题的最优选择

对于最长连续序列问题：
```cpp
// 使用unordered_set：O(n)平均时间复杂度
unordered_set<int> numSet(nums.begin(), nums.end());
// 查找操作O(1)，整体算法O(n)

// 使用set：O(n log n)时间复杂度
set<int> numSet(nums.begin(), nums.end());
// 查找操作O(log n)，整体算法O(n log n)
```

**结论**：在不需要顺序的情况下，优先选择`unordered_`系列容器以获得更好的平均时间复杂度。unordered_map/unordered_set 与 map/set 详细对比

## 一、底层数据结构

### **map/set**
- **底层实现**：红黑树（Red-Black Tree）
  - 一种自平衡的二叉搜索树
  - 每个节点额外存储颜色信息（红/黑）
  - 通过旋转和重新着色来保持平衡

### **unordered_map/unordered_set**
- **底层实现**：哈希表（Hash Table）
  - 数组 + 链表/红黑树（解决哈希冲突）
  - C++11中采用开放链地址法（separate chaining）

## 二、时间复杂度对比

### **map/set (红黑树实现)**

| 操作 | 平均时间复杂度 | 最坏情况 | 说明 |
|------|---------------|----------|------|
| **插入** | O(log n) | O(log n) | 红黑树保持平衡 |
| **删除** | O(log n) | O(log n) | 需要重新平衡 |
| **查找** | O(log n) | O(log n) | 二叉树搜索 |
| **遍历** | O(n) | O(n) | 中序遍历有序 |
| **获取最小/最大** | O(log n) | O(log n) | 最左/最右节点 |

**特性**：
- 所有操作的时间复杂度稳定在 **O(log n)**
- 元素自动按key排序（默认升序）

### **unordered_map/unordered_set (哈希表实现)**

| 操作 | 平均时间复杂度 | 最坏情况 | 说明 |
|------|---------------|----------|------|
| **插入** | O(1) | O(n) | 哈希冲突可能导致退化 |
| **删除** | O(1) | O(n) | 同插入 |
| **查找** | O(1) | O(n) | 哈希冲突最坏情况 |
| **遍历** | O(n) | O(n) | 无序遍历 |
| **获取最小/最大** | O(n) | O(n) | 需要遍历所有元素 |

**特性**：
- **平均O(1)**，但最坏情况可能退化到O(n)
- 元素**无序**存储

## 三、关键特性对比

| 特性 | map/set | unordered_map/unordered_set |
|------|---------|----------------------------|
| **排序** | 自动排序（key有序） | 无序 |
| **稳定性** | 所有操作稳定O(log n) | 平均O(1)，最坏O(n) |
| **内存占用** | 较高（树节点开销） | 较低（数组+链表） |
| **迭代器稳定性** | 迭代器始终有效 | rehash时迭代器失效 |
| **自定义类型key** | 需要实现`<`运算符 | 需要实现`hash`函数和`==`运算符 |
| **适用场景** | 需要有序遍历或范围查询 | 需要快速查找，不关心顺序 |

## 四、代码示例

### 自定义类型作为key

```cpp
// map/set 需要重载 < 运算符
struct Point {
    int x, y;
    bool operator<(const Point& other) const {
        return (x < other.x) || (x == other.x && y < other.y);
    }
};

// unordered_map/unordered_set 需要自定义哈希和相等比较
struct PointHash {
    size_t operator()(const Point& p) const {
        return hash<int>()(p.x) ^ (hash<int>()(p.y) << 1);
    }
};

struct PointEqual {
    bool operator()(const Point& a, const Point& b) const {
        return a.x == b.x && a.y == b.y;
    }
};

unordered_set<Point, PointHash, PointEqual> point_set;
```

### 性能测试示例

```cpp
#include <chrono>
#include <unordered_set>
#include <set>

void testPerformance(int n) {
    vector<int> nums(n);
    for(int i = 0; i < n; i++) nums[i] = rand();
    
    // 测试set
    auto start = chrono::high_resolution_clock::now();
    set<int> s(nums.begin(), nums.end());
    auto end = chrono::high_resolution_clock::now();
    cout << "set插入" << n << "个元素: " 
         << chrono::duration_cast<chrono::milliseconds>(end-start).count() << "ms" << endl;
    
    // 测试unordered_set
    start = chrono::high_resolution_clock::now();
    unordered_set<int> us(nums.begin(), nums.end());
    end = chrono::high_resolution_clock::now();
    cout << "unordered_set插入" << n << "个元素: "
         << chrono::duration_cast<chrono::milliseconds>(end-start).count() << "ms" << endl;
}
```

## 五、内存结构示意图

### **map (红黑树)**
```
          [10,B]
         /      \
     [5,R]      [15,R]
    /    \      /    \
 [3,B] [7,B] [12,B] [18,B]
```
- 每个节点：key + value + 颜色 + 3个指针（左、右、父）
- 内存不连续，指针跳转访问

### **unordered_map (哈希表)**
```
数组索引: 0    1    2    3    4
         |    |    |    |    |
         ∅  [1]→[11]  [2]   [3]
                ↓
               [21]
```
- 数组连续存储桶（bucket）
- 每个桶连接链表处理冲突
- C++11后链表过长会转为红黑树

## 六、实际选择建议

1. **选择map/set的情况**：
   - 需要元素有序
   - 需要范围查询（如lower_bound/upper_bound）
   - 对性能稳定性要求高（避免最坏情况O(n)）
   - 数据量较小或中等

2. **选择unordered_map/unordered_set的情况**：
   - 只需要快速查找，不关心顺序
   - 数据量较大，且哈希函数分布均匀
   - 能接受偶尔的性能波动
   - 内存使用需要优化

3. **特别提醒**：
   - `unordered_`容器在rehash时所有迭代器失效
   - 可以预先调用`reserve()`预留空间避免rehash
   - 默认负载因子为1.0，超过时会rehash

## 七、连续序列问题的最优选择

对于最长连续序列问题：
```cpp
// 使用unordered_set：O(n)平均时间复杂度
unordered_set<int> numSet(nums.begin(), nums.end());
// 查找操作O(1)，整体算法O(n)

// 使用set：O(n log n)时间复杂度
set<int> numSet(nums.begin(), nums.end());
// 查找操作O(log n)，整体算法O(n log n)
```

**结论**：在不需要顺序的情况下，优先选择`unordered_`系列容器以获得更好的平均时间复杂度。

## 我的答案



END
<!--ID: 1765209754351-->
