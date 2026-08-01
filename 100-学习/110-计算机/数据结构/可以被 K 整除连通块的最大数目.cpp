#include <bits/stdc++.h>
using namespace std;

// 1 <= n <= 3 * 104
// edges.length == n - 1
// edges[i].length == 2
// 0 <= ai, bi < n
// values.length == n
// 0 <= values[i] <= 109
// 1 <= k <= 109
// values 之和可以被 k 整除。
// 输入保证 edges 是一棵无向树。

class Solution {
public:
    int maxKDivisibleComponents(int n, vector<vector<int>>& edges, vector<int>& values, int k) {
        // 使用邻接表作为图
        vector<vector<int>> graph(n);
        for (auto& edge : edges) {
            int u = edge[0], v = edge[1];
            graph[u].push_back(v);
            graph[v].push_back(u);
        }

        // 开始时将答案设为0
        int result = 0;
        function<long long(int, int)> dfs = [&](int node, int parent) -> long long {
            // sum -> cur
            // 每次dfs的时候生成一个新的sum = values[node]
            // 表示不考虑父节点，只考虑子树的结合
            // 相当于题目拆分成了三个问题
            // 1. 父节点自己能不能构成K的倍数
            // 2. 父节点 + 子树能不能构成K的倍数 
            // 3. 子树自己能不能构成K的倍数
            long long sum = values[node];
            for (int neighbor : graph[node]) {
                if (neighbor != parent) {
                    // 叠加每个子树的和
                    sum += dfs(neighbor, node);
                }
            }
            if (sum % k == 0) {
                // 由于 题目假设values 之和可以被 k 整除。
                // 所以答案至少为1
                ++result;
            }
            return sum;
        };
        dfs(0, -1);
        return result;
    }
};
