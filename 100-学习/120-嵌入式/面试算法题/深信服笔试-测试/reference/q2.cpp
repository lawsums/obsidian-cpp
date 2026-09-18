// 参考实现 · 题目2：最大排序连续上升子段长度
// 笔记：[[笔试—深信服嵌入式软件开发笔试]]
// 输入：第一行 n，第二行 n 个整数
// 输出：最大排序连续上升子段的长度
#include <iostream>
#include <vector>
#include <algorithm>
#include <unordered_set>

int main() {
    int n;
    std::cin >> n;

    std::vector<int> arr(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> arr[i];
    }

    int max_length = 0; // 存储最终的最大长度

    // 遍历所有可能的子段起点 i
    for (int i = 0; i < n; ++i) {

        // --- 对于每个新的起点 i，重置 ---
        int min_val = arr[i]; // 当前子段 [i...j] 的最小值
        int max_val = arr[i]; // 当前子段 [i...j] 的最大值

        // seen 用于检查 [i...j] 范围内的重复元素
        std::unordered_set<int> seen;

        // 遍历所有可能的子段终点 j (从 i 开始)
        for (int j = i; j < n; ++j) {

            // 1. 检查重复元素
            if (seen.count(arr[j])) {
                // 往后的所有子段也都包含重复元素，直接终止本层循环
                break;
            }
            seen.insert(arr[j]);

            // 2. 更新当前子段 [i...j] 的 min 和 max
            min_val = std::min(min_val, arr[j]);
            max_val = std::max(max_val, arr[j]);

            // 3. 检查核心条件：max - min == 长度 - 1
            if (max_val - min_val == j - i) {
                int current_length = j - i + 1;
                max_length = std::max(max_length, current_length);
            }
        }
    }

    // 单元素子段 [x]：max-min = 0 = j-i，已被上面的循环覆盖
    std::cout << max_length << std::endl;

    return 0;
}
