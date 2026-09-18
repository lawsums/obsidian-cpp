// 题目1：数组游戏——找出连胜 k 场的数字
// 笔记：[[笔试—深信服嵌入式软件开发笔试]]
//
// 输入（stdin）：
//   一行，n 个数字用空格隔开；前 n-1 个数字组成数组 arr，第 n 个数字为 k
//   例：2 1 4 3 6 5 0 7 3   →  arr = [2,1,4,3,6,5,0,7], k = 3
// 输出（stdout）：
//   一个整数：赢得 k 个连续回合的数字
//
// 👉 在 main() 里实现你的解法；写完后运行 run_tests.bat 自动判题。
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // --- 读入（已按题目格式写好） ---
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> numbers;
    int num;
    while (ss >> num) numbers.push_back(num);

    int k = numbers.back();
    numbers.pop_back();
    vector<int>& arr = numbers;   // arr.size() 即题目中的数组长度

    // TODO: 在这里实现

    return 0;
}
