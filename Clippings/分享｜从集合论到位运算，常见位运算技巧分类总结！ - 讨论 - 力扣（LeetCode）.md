---
title: "分享｜从集合论到位运算，常见位运算技巧分类总结！ - 讨论 - 力扣（LeetCode）"
source: "https://leetcode.cn/discuss/post/3571304/cong-ji-he-lun-dao-wei-yun-suan-chang-ji-enve/"
author:
  - "[[力扣 LeetCode]]"
published:
created: 2025-10-09
description: "图：集合交、按位与之间存在某种联系。前言本文将扫清位运算的迷雾，在集合论与位运算之间建立一座桥梁。在高中，我们学了集合论（set theory）的相关知识。例如，包含若干整数的集合 S={0,2,3}。在编程中，通常用哈希表（hash table）表示集合。例如 Java 中的 HashSet，C++ 中的 std::unordered_set。在集合论中，有交集 ∩、并集 ∪、包含于 ⊆ 等等概念。如果编程实现「求两个哈希表的交集」，需要一个一个地遍历哈希表中的元素。那么，有没有效率更高的"
tags:
  - "clippings"
---
![](https://static.leetcode.cn/cn-frontendx-assets/production/_next/static/images/logo-711e116152be014f445f50aa6a369231.png?x-oss-process=image%2Fformat%2Cwebp) 在力扣 App 中打开

![位运算入门位运算教程位运算技巧力扣位运算leetcode位运算 灵茶山艾府 灵神](https://pic.leetcode.cn/1712451632-VCAgyP-set2bit-2.png)

> 图：集合交、按位与之间存在某种联系。

## 前言

本文将扫清位运算的迷雾，在集合论与位运算之间建立一座桥梁。

在高中，我们学了集合论（set theory）的相关知识。例如，包含若干整数的集合 。在编程中，通常用哈希表（hash table）表示集合。例如 Java 中的 `HashSet` ，C++ 中的 `std::unordered_set` 。

在集合论中，有交集 、并集 、包含于 等等概念。如果编程实现「求两个哈希表的交集」，需要一个一个地遍历哈希表中的元素。那么，有没有效率更高的做法呢？

该二进制登场了。

集合可以用二进制表示，二进制 **从低到高** 第 位为 表示 在集合中，为 表示 不在集合中。例如集合 可以用二进制数 表示；反过来，二进制数 就对应着集合 。

正式地说，包含非负整数的集合 可以用如下方式「压缩」成一个数字：

例如集合 可以压缩成 ，也就是二进制数 。

利用位运算「并行计算」的特点，我们可以高效地做一些和集合有关的运算。按照常见的应用场景，可以分为以下四类：

1. 集合与集合
2. 集合与元素
3. 遍历集合
4. 枚举集合

## 一、集合与集合

其中 表示按位与， 表示按位或， 表示按位异或， 表示按位取反。

两个集合的「对称差」是只属于其中一个集合，而不属于另一个集合的元素组成的集合，也就是不在交集中的元素组成的集合。

| 术语    | 集合  | 位运算 | 集合示例 | 位运算示例 |
| ----- | --- | --- | ---- | ----- |
| 交集    |     |     |      |       |
| 并集    |     |     |      |       |
| 对称差   |     |     |      |       |
| 差     |     |     |      |       |
| 差（子集） |     |     |      |       |
| 包含于   |     |     |      |       |

> 注 1：按位取反的例子中，仅列出最低 个比特位取反后的结果，即 取反后是 。
> 
> 注 2：包含于（判断子集）的两种位运算写法是等价的，在编程时只需判断其中任意一种。此外，还可以用 `(a & ~b) == 0` 判断，如果成立，也表示 是 的子集。
> 
> 注 3：编程时，请注意运算符的优先级。例如 `==` 在某些语言中优先级比位运算更高。

## 二、集合与元素

通常会用到移位运算。

其中 表示左移， 表示右移。

> 注：左移 位相当于乘以 ，右移 位相当于除以 。

| 术语 | 集合 | 位运算 | 集合示例 | 位运算示例 |
| --- | --- | --- | --- | --- |
| 空集 |  |  |  |  |
| 单元素集合 |  |  |  |  |
| 全集 |  |  |  |  |
| 补集 |  |  |  |  |
| 属于 |  |  |  |  |
| 不属于 |  |  |  |  |
| 添加元素 |  |  |  |  |
| 删除元素 |  |  |  |  |
| 删除元素（一定在集合中） |  |  |  |  |
| 删除最小元素 |  |  |  | 见下 |

```java
s = 101100
    s-1 = 101011 // 最低位的 1 变成 0，同时 1 右边的 0 都取反，变成 1
s&(s-1) = 101000
```

特别地，如果 是 的幂，那么 。

此外，编程语言提供了一些和二进制有关的库函数，例如：

- 计算二进制中的 的个数，也就是 **集合大小** ；
- 计算二进制长度， **减一** 后得到 **集合最大元素** ；
- 计算二进制尾零个数，也就是 **集合最小元素** 。

调用这些函数的时间复杂度都是 。

| 术语 | Python | Java | C++ | Go |
| --- | --- | --- | --- | --- |
| 集合大小 | `s.bit_count()` | `Integer.bitCount(s)` | `__builtin_popcount(s)` | `bits.OnesCount(s)` |
| 二进制长度 | `s.bit_length()` | `32-Integer.numberOfLeadingZeros(s)` | `__lg(s)+1` | `bits.Len(s)` |
| 集合最大元素 | `s.bit_length()-1` | `31-Integer.numberOfLeadingZeros(s)` | `__lg(s)` | `bits.Len(s)-1` |
| 集合最小元素 | `(s&-s).bit_length()-1` | `Integer.numberOfTrailingZeros(s)` | `__builtin_ctz(s)` | `bits.TrailingZeros(s)` |

请特别注意 的情况。对于 C++ 来说， `__lg(0)` 和 `__builtin_ctz(0)` 是未定义行为。其他语言请查阅 API 文档。

此外，对于 C++ 的 `long long` ，需使用相应的 `__builtin_popcountll` 等函数，即函数名后缀添加 `ll` （两个小写字母 L）。 `__lg` 支持 `long long` 。

特别地，只包含最小元素的子集，即二进制最低 及其后面的 ，也叫 ，可以用 `s & -s` 算出。举例说明：

```java
s = 101100
    ~s = 010011
(~s)+1 = 010100 // 根据补码的定义，这就是 -s  =>  s 的最低 1 左侧取反，右侧不变
s & -s = 000100 // lowbit
```

## 三、遍历集合

设元素范围从 到 ，枚举范围中的元素 ，判断 是否在集合 中。

Python3

Java

C++

Go

```
for i in range(n):
    if (s >> i) & 1:  # i 在 s 中
        # 处理 i 的逻辑
```

也可以直接遍历集合 中的元素：不断地计算集合最小元素、去掉最小元素，直到集合为空。

Python3

Java

C++

Go

```
t = s
while t:
    lowbit = t & -t
    t ^= lowbit
    i = lowbit.bit_length() - 1
    # 处理 i 的逻辑
```

## 四、枚举集合

### §4.1 枚举所有集合

设元素范围从 到 ，从空集 枚举到全集 ：

Python3

Java

C++

Go

```
for s in range(1 << n):
    # 处理 s 的逻辑
```

### §4.2 枚举非空子集

设集合为 ， **从大到小** 枚举 的所有 **非空** 子集 ：

Python3

Java

C++

Go

```
sub = s
while sub:
    # 处理 sub 的逻辑
    sub = (sub - 1) & s
```

为什么要写成 `sub = (sub - 1) & s` 呢？

暴力做法是从 出发，不断减一，直到 。但这样做，中途会遇到很多并不是 的子集的情况。例如 时，减一得到 ，这是 的子集。但再减一就得到 了，这并不是 的子集，下一个子集应该是 。

把所有的合法子集按顺序列出来，会发现我们做的相当于「压缩版」的二进制减法，例如

如果忽略掉 中的两个 ，数字的变化和二进制减法是一样的，即

如何快速跳到下一个子集呢？比如，怎么从 跳到 ？

- 普通的二进制减法，是 ，也就是把最低位的 变成 ，同时把最低位的 右边的 都变成 。
- 压缩版的二进制减法也是类似的，对于 ，也会把最低位的 变成 ，对于最低位的 右边的 ，并不是都变成 ，只有在 中的 才会变成 。怎么做到？减一后 就行，也就是 。

### §4.3 枚举子集（包含空集）

如果要从大到小枚举 的所有子集 （从 枚举到空集 ），可以这样写：

Python3

Java

C++

Go

```
sub = s
while True:
    # 处理 sub 的逻辑
    if sub == 0:
        break
    sub = (sub - 1) & s
```

其中 Java 和 C++ 的原理是，当 时（空集），再减一就得到 ，对应的二进制为 ，再 就得到了 。所以当循环到 时，说明最后一次循环的 （空集）， 的所有子集都枚举到了，退出循环。

**注** ：还可以枚举全集 的所有大小 **恰好** 为 的子集，这一技巧叫做 **Gosper's Hack** ，具体请看 [视频讲解](https://leetcode.cn/link/?target=https%3A%2F%2Fwww.bilibili.com%2Fvideo%2FBV1na41137jv%3Ft%3D15m43s) 。

### §4.4 枚举超集

如果 是 的子集，那么称 是 的 **超集** （superset）。

枚举超集的原理和上文枚举子集是类似的，这里通过 **或运算** 保证枚举的集合 一定包含集合 中的所有元素。

枚举 ，满足 是 的超集，也是全集 的子集。

Python3

Java

C++

Go

```
s = t
while s < (1 << n):
    # 处理 s 的逻辑
    s = (s + 1) | t
```

## 练习

完成 [位运算题单](https://leetcode.cn/circle/discuss/dHn9Vk/) 的第一章。

其他关联题单：

- [数据结构题单](https://leetcode.cn/circle/discuss/mOr1u6/) 中的「 **前缀异或和** 」
- [动态规划题单](https://leetcode.cn/circle/discuss/tXLS3i/) 中的「 **状压 DP** 」

## 分类题单

[如何科学刷题？](https://leetcode.cn/circle/discuss/RvFUtj/)

1. [滑动窗口与双指针（定长/不定长/单序列/双序列/三指针/分组循环）](https://leetcode.cn/circle/discuss/0viNMK/)
2. [二分算法（二分答案/最小化最大值/最大化最小值/第K小）](https://leetcode.cn/circle/discuss/SqopEo/)
3. [单调栈（基础/矩形面积/贡献法/最小字典序）](https://leetcode.cn/circle/discuss/9oZFK9/)
4. [网格图（DFS/BFS/综合应用）](https://leetcode.cn/circle/discuss/YiXPXW/)
5. [位运算（基础/性质/拆位/试填/恒等式/思维）](https://leetcode.cn/circle/discuss/dHn9Vk/)
6. [图论算法（DFS/BFS/拓扑排序/最短路/最小生成树/二分图/基环树/欧拉路径）](https://leetcode.cn/circle/discuss/01LUak/)
7. [动态规划（入门/背包/状态机/划分/区间/状压/数位/数据结构优化/树形/博弈/概率期望）](https://leetcode.cn/circle/discuss/tXLS3i/)
8. [常用数据结构（前缀和/差分/栈/队列/堆/字典树/并查集/树状数组/线段树）](https://leetcode.cn/circle/discuss/mOr1u6/)
9. [数学算法（数论/组合/概率期望/博弈/计算几何/随机算法）](https://leetcode.cn/circle/discuss/IYT3ss/)
10. [贪心与思维（基本贪心策略/反悔/区间/字典序/数学/思维/脑筋急转弯/构造）](https://leetcode.cn/circle/discuss/g6KTKL/)
11. [链表、二叉树与回溯（前后指针/快慢指针/DFS/BFS/直径/LCA/一般树）](https://leetcode.cn/circle/discuss/K0n2gO/)
12. [字符串（KMP/Z函数/Manacher/字符串哈希/AC自动机/后缀数组/子序列自动机）](https://leetcode.cn/circle/discuss/SJFwQI/)

[我的题解精选（已分类）](https://leetcode.cn/link/?target=https%3A%2F%2Fgithub.com%2FEndlessCheng%2Fcodeforces-go%2Fblob%2Fmaster%2Fleetcode%2FSOLUTIONS.md)

欢迎关注 [B站@灵茶山艾府](https://leetcode.cn/link/?target=https%3A%2F%2Fspace.bilibili.com%2F206214)

评论 (81)

[天赐细莲](https://leetcode.cn/u/cuber-lotus/)

来自 中国

2023.06.16

分享一张图  
![Binar_Fundamentals_00.png](https://pic.leetcode.cn/1686879866-VArRlW-Binar_Fundamentals_00.png)

361

展示 10 条回复

回复

[我要弄懂每一个困难题](https://leetcode.cn/u/bo-mu-m/)

来自 浙江

2025.07.17

第一部分的集合和集合可以懂，看到第二个集合和元素，已经晕晕的了。

2

展示 2 条回复

回复

[珂朵莉](https://leetcode.cn/u/keduoli/)

来自 上海市

2023.06.16

灵神太强了

35

展示 1 条回复

回复

[Automation垃圾专业](https://leetcode.cn/u/gao-kao-kao-de-tai-chai/)

来自 重庆

2024.01.26

应用数学中混进了一个理论数学

15

展示 2 条回复

回复

[roylx](https://leetcode.cn/u/roylx/)

来自 未知归属地

2023.06.16

「压缩版」的二进制减法太帅了！只是 `但对于这个 1 右边的 0，只保留在 10101 中的 1` 这句话太绕了。

我啰嗦一下，意思是，把10100 的最低位1变0，它的后面有两位 00， 都是0。这时候按照普通二进制，会把这两个 00 都变成 11，如果按照压缩版，就只把原来集合里有的 1 变成 1 （因为求的是子集），其余的还是 0，原有的集合是 10101，最后两位是 01，所以只保留 01。综合起来就是 10100 先变 10000，然后保留 01，变成 10001。

这样做的效果是从 10100 直接跳到 10001，把中间的 10011 和10010 忽略掉了（普通减法顺序是 10100 - 10011 - 10010 - 10001），因为10011 和 10010不是有效的子集。

21

展示 2 条回复

回复

[yihtr](https://leetcode.cn/u/yihtr/)

来自 中国

2025.04.27

如果集合长度大于数据类型的长度，是不是就不能压缩了，比如用java 的int最多表示长度32的集合

1

展示 2 条回复

回复

[灵剑2012](https://leetcode.cn/u/ling-jian-2012/)

来自 中国

2023.06.29

枚举固定大小的子集能用bit\_count相关指令的话好像还挺容易的，是不是就是每次加lowbit然后在最低位补全1的数量就行

8

展示 5 条回复

回复

[爱编程的璃笙](https://leetcode.cn/u/crazy-wilesb7k/)

来自 中国

2025.04.20

灵神，一、集合与集合运算中的差集为什么要分为两种呀，B是不是A的子集不是都不影响a^ ~~b的正确性吗。因为~~ b就是B的补集，补集把公共元素排除在外了，一跟A求交集就是A单独的元素呀

0

展示 3 条回复

回复

💬 📋 🗑️

跟随系统

浅色

深色

跟随系统

浅色

深色