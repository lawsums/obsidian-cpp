// 题目1 参考实现：苹果二进制平分（maximumBenefit）
// 对应笔记：[[笔试—三一智能驾驶软件笔试]]
//
// 输入格式（stdin）：
//   第一行：n              苹果个数
//   第二行：n 个正整数      每个苹果的重量
// 输出（stdout）：
//   可以平分 -> 乙能拿到的最大总重量；否则 -1
//
// 核心结论：全体重量异或和为 0 才可平分（甲的无进位相加 = 异或），
//          此时任意划分都成立，乙拿"总和 - 最小重量"。
#include <bits/stdc++.h>
using namespace std;

int maximumBenefit(vector<int>& weights) {
    if (weights.empty()) return -1;

    long long sum = 0;     // 总重量
    int x = 0;             // 全部重量的异或和
    int mn = INT_MAX;      // 最小重量

    for (int w : weights) {
        if (w <= 0) return -1;   // 数据有效性：重量必须为正整数
        sum += w;
        x ^= w;
        mn = min(mn, w);
    }

    if (x != 0) return -1;       // 异或和不为 0，无法平分
    return (int)(sum - mn);      // 乙拿走除最轻苹果外的全部
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<int> weights(n);
    for (int i = 0; i < n; i++) cin >> weights[i];

    cout << maximumBenefit(weights) << '\n';
    return 0;
}
