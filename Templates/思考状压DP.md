好的，我帮你整理一份详细的笔记，方便你明天复习！

---

# 1 术式终端的并行调度 - 解题笔记

## 1.1 一、题目速览

### 1.1.1 核心问题
- n个任务（n≤15），每个任务有(c, m, v)
- 每台服务器限制：CPU≤C，内存≤M
- 求用1,2,...,n台服务器时，能获得的最大价值

### 1.1.2 关键约束
```
n ≤ 15  ← 这是解题的关键信号！
看到 n ≤ 20，就要想到状态压缩
```

---

## 1.2 二、解题思路

### 1.2.1 第一步：识别题型特征

```
✅ n 很小（≤ 15）
✅ 需要分组/划分集合
✅ 每个任务只能用一次
✅ 求最优价值
→ 这就是典型的 状压DP + 子集枚举
```

### 1.2.2 第二步：核心想法

**把"一台服务器能装的任务组合"看作一个整体**

比如：
- 任务1和任务3可以放一起 → 变成一个"超级任务"
- 任务2单独放 → 另一个"超级任务"
- 问题变成：选几个"超级任务"，覆盖所有原任务，价值最大

---

## 1.3 三、代码模板

### 1.3.1 完整代码（带详细注释）

```python
def solve():
    import sys
    input = sys.stdin.readline
    
    # ========== 1. 输入 ==========
    n, C, M = map(int, input().split())
    tasks = []
    for _ in range(n):
        c, m, v = map(int, input().split())
        tasks.append((c, m, v))
    
    # ========== 2. 预处理所有子集 ==========
    N = 1 << n  # 2^n，所有状态数
    can_fit = [False] * N   # 能否放入一台服务器
    value = [0] * N         # 该子集的总价值
    cpu_sum = [0] * N       # 该子集的CPU总消耗
    mem_sum = [0] * N       # 该子集的内存总消耗
    
    # 方法1：直接计算（n=15时，2^15 * 15 = 约50万，很快）
    for mask in range(N):
        total_c = total_m = total_v = 0
        for i in range(n):
            if mask & (1 << i):
                c, m, v = tasks[i]
                total_c += c
                total_m += m
                total_v += v
        cpu_sum[mask] = total_c
        mem_sum[mask] = total_m
        value[mask] = total_v
        if total_c <= C and total_m <= M:
            can_fit[mask] = True
    
    # 方法2：DP递推（更快，但容易出错）
    # for i in range(n):
    #     for mask in range(N):
    #         if mask & (1 << i):
    #             prev = mask ^ (1 << i)
    #             cpu_sum[mask] = cpu_sum[prev] + tasks[i][0]
    #             mem_sum[mask] = mem_sum[prev] + tasks[i][1]
    #             value[mask] = value[prev] + tasks[i][2]
    
    # ========== 3. 状压DP ==========
    INF = 10**9
    # dp[mask] = 覆盖mask需要的最少服务器数
    min_servers = [INF] * N
    max_value = [0] * N  # 用最少服务器时的最大价值
    
    min_servers[0] = 0
    max_value[0] = 0
    
    # 枚举所有状态
    for mask in range(N):
        if min_servers[mask] == INF:
            continue
        
        # 计算剩余任务
        remaining = ((1 << n) - 1) ^ mask
        
        # 枚举remaining的所有子集（作为新的一台服务器）
        sub = remaining
        while sub:
            if can_fit[sub]:
                new_mask = mask | sub
                new_servers = min_servers[mask] + 1
                new_value = max_value[mask] + value[sub]
                
                # 更新最优解
                if new_servers < min_servers[new_mask]:
                    min_servers[new_mask] = new_servers
                    max_value[new_mask] = new_value
                elif new_servers == min_servers[new_mask]:
                    max_value[new_mask] = max(max_value[new_mask], new_value)
            
            sub = (sub - 1) & remaining  # 关键：枚举子集
    
    # ========== 4. 统计答案 ==========
    ans = [0] * (n + 1)
    for mask in range(N):
        k = min_servers[mask]
        if k <= n:
            ans[k] = max(ans[k], max_value[mask])
    
    # 前缀最大值：可以用k台，意味着也可以用少于k台
    for k in range(1, n + 1):
        ans[k] = max(ans[k], ans[k-1])
    
    # ========== 5. 输出 ==========
    for k in range(1, n + 1):
        print(ans[k])
```

---

## 1.4 四、核心代码段解析

### 1.4.1 枚举子集的模板（非常重要！）

```python
# 枚举mask的所有子集
sub = mask
while sub:
    # 处理sub
    sub = (sub - 1) & mask
```

**原理演示**：
```python
mask = 0b10101 (21)
sub = 21
sub = (20) & 21 = 20  # 0b10100
sub = (19) & 21 = 17  # 0b10001
sub = (16) & 21 = 16  # 0b10000
...
```

### 1.4.2 状态的转移

```
当前状态: mask (已安排的任务)
选择子集: sub (下一台服务器的任务)
新状态: mask | sub (并集)
```

### 1.4.3 补集计算

```python
total = (1 << n) - 1  # 所有任务的集合
remaining = total ^ mask  # 还没安排的任务
```

---

## 1.5 五、复杂度分析

| 步骤    | 复杂度      | 说明           |
| ----- | -------- | ------------ |
| 预处理子集 | O(n·2^n) | n=15时，≈ 50万  |
| 状压DP  | O(3^n)   | 核心复杂度        |
| 总复杂度  | O(3^n)   | 3^15 ≈ 1435万 |
| 空间复杂度 | O(2^n)   | 32768个状态     |

**为什么是3^n？**
```
对每个状态mask，枚举它的子集sub
总枚举次数 = 3^n（二项式定理）
```

---

## 1.6 六、关键点总结

### 1.6.1 ✅ 核心思想
> 把每个可行的任务组合看作一个"超级任务"，然后在这些超级任务上做选择

### 1.6.2 ✅ 三步走
1. **预处理**：哪些任务组合能放入一台服务器
2. **DP**：选择若干组合，覆盖所有任务
3. **统计**：用k台服务器的最大值

### 1.6.3 ✅ 常见坑点
1. ❌ 忘记考虑空子集
2. ❌ 子集枚举写错（写成 (sub-1)&mask 而不是 &remaining）
3. ❌ 初始化INF太大导致溢出
4. ❌ 忘记处理"可以用更少服务器"的情况

---

## 1.7 七、变种与扩展

### 1.7.1 变种1：如果服务器不同（容量不同）
```python
# 对每台服务器分别处理
for server in servers:
    # 针对该服务器的容量预处理
    # 然后做分组背包
```

### 1.7.2 变种2：如果要求每个服务器非空
```python
# 初始化时排除空集
can_fit[0] = False
```

### 1.7.3 变种3：如果任务必须全部完成
```python
# 答案就是 min_servers[total]
```

---

## 1.8 八、相关题目推荐

### 1.8.1 入门级
- LeetCode 78. 子集
- LeetCode 198. 打家劫舍

### 1.8.2 进阶级
- LeetCode 698. 划分为k个相等的子集
- LeetCode 473. 火柴拼正方形
- LeetCode 526. 优美的排列

### 1.8.3 困难级
- LeetCode 943. 最短超级串
- 本题（并行调度）

---

## 1.9 九、记忆口诀

```
n小状压想一想，
子集枚举记心上。
先预处理后DP，
三维降成二维量。
```

---

## 1.10 十、思维导图

```
术式终端并行调度
│
├── 识别特征
│   ├── n ≤ 15 → 状态压缩
│   ├── 多服务器 → 重复选择
│   └── 二维约束 → 预处理判断
│
├── 解题步骤
│   ├── 预处理（2^n）
│   │   ├── 计算每个子集的CPU/内存/价值
│   │   └── 标记能否放入一台服务器
│   ├── 状态DP（3^n）
│   │   ├── dp[mask] = 最少服务器数
│   │   └── 枚举子集转移
│   └── 统计输出
│       ├── 计算每个k的最大值
│       └── 取前缀最大值
│
└── 复杂度
    ├── 时间：O(3^n)
    └── 空间：O(2^n)
```

---

## 1.11 十一、明天复习时的思考题

1. **为什么 n ≤ 15 是状压的关键信号？**
2. **如果不预处理子集，直接在DP里判断，会怎样？**
3. **如何优化到 O(2^n · n)？**（提示：每个任务单独考虑分配）
4. **如果要输出具体分配方案，代码要怎么改？**

---

## 1.12 十二、手写模拟（帮助理解）

以示例为例：n=3, C=3, M=10

```
任务：1:(1,4,1), 2:(2,5,2), 3:(2,6,4)

预处理（部分）：
mask=0b001 → {1} → CPU=1, MEM=4, 可放入 ✓
mask=0b010 → {2} → CPU=2, MEM=5, 可放入 ✓
mask=0b100 → {3} → CPU=2, MEM=6, 可放入 ✓
mask=0b101 → {1,3} → CPU=3, MEM=10, 可放入 ✓, 价值=5
mask=0b111 → {1,2,3} → CPU=5>3, 不可放入 ✗

DP过程：
dp[0] = 0
从mask=0，可选的子集：{1},{2},{3},{1,3}
→ dp[0b001]=1, dp[0b010]=1, dp[0b100]=1, dp[0b101]=1

从mask=0b101，剩余{2}
→ dp[0b111] = min(dp[0b111], 1+1=2)

答案：
k=1: 最大价值5（选{1,3}）
k=2: 7（{1,3}和{2}）
k=3: 7
```

---

保存好这份笔记，明天复习的时候可以：
1. 先看"一、题目速览"回忆题目
2. 再看"三、代码模板"理解结构
3. 重点看"四、核心代码段解析"
4. 最后做"十一、思考题"检验理解

加油！明天一定能想明白！💪