// 题目1：苹果二进制平分（maximumBenefit）
// 笔记：[[笔试—三一智能驾驶软件笔试]]
//
// 输入（stdin）：
//   第一行 n            苹果个数
//   第二行 n 个正整数     每个苹果的重量
// 输出（stdout）：
//   可以平分 -> 乙能拿到的最大总重量；否则输出 -1
//
// 提示：甲"不会进位"= 按位异或。平分 <=> 两组异或相等 <=> 全体异或和为 0。
// 👉 在 main() 里实现你的解法；写完后运行 run_tests.bat 自动判题。
#include <algorithm>
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // --- 读入（已按题目格式写好） ---
    int n;
    if (!(cin >> n)) return 0;
    vector<int> weights(n);
    for (int i = 0; i < n; i++) cin >> weights[i];

    // 我们需要总异或和为 0，总异或和为 0 之后呢，我们再去掉任一个最小的数，那么就是答案了
    int sum = std::accumulate(weights.begin(), weights.end(), 0);
    int xor_sum = std::accumulate(weights.begin(), weights.end(), 0, [](int a, int b) { return a ^ b; });

    if (xor_sum == 0) {
        int ans = sum - *min_element(weights.begin(), weights.end());
        cout << ans << '\n';
    } else {
        cout << -1 << '\n';
    }

    return 0;
}
