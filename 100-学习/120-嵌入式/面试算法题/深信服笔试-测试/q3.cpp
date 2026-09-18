// 题目3：病毒伪装度最少变换次数
// 笔记：[[笔试—深信服嵌入式软件开发笔试]]
//
// 输入（stdin）：
//   第一行：n x
//   第二行：n 个整数 a[i]
// 输出（stdout）：
//   一个整数：最少需要变化伪装度的次数
//
// 👉 在 main() 里实现你的解法；写完后运行 run_tests.bat 自动判题。
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // --- 读入（已按题目格式写好） ---
    int n;
    long long x;
    if (!(cin >> n >> x)) return 0;
    vector<long long> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 在这里实现

    return 0;
}
