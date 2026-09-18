// 参考实现 · 题目3：病毒伪装度最少变换次数
// 笔记：[[笔试—深信服嵌入式软件开发笔试]]
// 输入：第一行 n x，第二行 n 个整数 a[i]
// 输出：最少需要变化伪装度的次数
#include <iostream>
#include <vector>
#include <algorithm> // 用于 std::max 和 std::min

int main() {
    int n;
    long long x; // 辨识精确度 x 可能很大，用 long long

    std::cin >> n >> x;

    std::vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }

    if (n == 0) {
        std::cout << 0 << std::endl;
        return 0;
    }

    int changes = 0; // 记录变化次数，初始为0

    // 1. 设置初始的可行伪装范围 (基于第一个主机 a[0])
    // 这个初始设置不计入 "changes"
    long long current_min_v = a[0] - x;
    long long current_max_v = a[0] + x;

    // 2. 遍历从第二个主机 (i=1) 开始的所有主机
    for (int i = 1; i < n; ++i) {

        // 2a. 计算当前主机 a[i] 要求的伪装范围
        long long required_min = a[i] - x;
        long long required_max = a[i] + x;

        // 2b. 计算[当前可行范围]与[a[i]要求范围]的交集
        long long new_min = std::max(current_min_v, required_min);
        long long new_max = std::min(current_max_v, required_max);

        // 2c. 检查交集是否为空
        if (new_min > new_max) {
            // 必须更换伪装度
            changes++;

            // 以当前主机 a[i] 的要求范围为新的"可行范围"
            current_min_v = required_min;
            current_max_v = required_max;
        } else {
            // 交集不为空，更新可行范围为这个更小的交集
            current_min_v = new_min;
            current_max_v = new_max;
        }
    }

    // 3. 输出总的变化次数
    std::cout << changes << std::endl;

    return 0;
}
