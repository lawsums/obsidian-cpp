#include <algorithm>
#include <bits/stdc++.h>
using namespace std;

class UnionFind {
private:
    vector<int> parent;  // 父节点数组
    vector<int> rank;    // 秩（树的高度）数组

public:
    // 初始化：size 为元素个数
    UnionFind(int size = 1'000'001) {
        parent.resize(size);
        rank.resize(size, 0);
        // 每个元素初始父节点是自己
        for (int i = 0; i < size; ++i) {
            parent[i] = i;
        }
    }

    // 查找根节点 + 路径压缩
    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // 路径压缩
        }
        return parent[x];
    }

    // 合并两个节点，返回是否成功合并
    // false：已经在同一个集合
    // true：合并成功
    bool unite(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        // 同一个集合，无需合并
        if (rootX == rootY) {
            return false;
        }

        // 按秩合并：小树挂到大树上
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else {
            parent[rootY] = rootX;
            // 秩相同，合并后高度 +1
            if (rank[rootX] == rank[rootY]) {
                rank[rootX]++;
            }
        }
        return true;
    }
};

class Solution {
public:
    bool hasValidPath(vector<vector<int>>& grid) {
        int n = grid.size(), m = grid[0].size();
        UnionFind uf(n * m);

        auto pos = [=](int i, int j) {
            return i * m + j;
        };

        auto tackle = [&](int i, int j) {
            int r = grid[i][j];
            if (r == 1 || r == 4 || r == 6) {
                if (j + 1 < m) {
                    int rr = grid[i][j + 1];
                    if (rr == 1 || rr == 3 || rr == 5) {
                        uf.unite(pos(i, j), pos(i, j + 1));
                    }
                }
            } else if (r == 2 || r == 3 || r == 4) {
                if (i + 1 < n) {
                    int rd = grid[i + 1][j];
                    if (rd == 2 || rd == 5 || rd == 6) {
                        uf.unite(pos(i, j), pos(i + 1, j));
                    }
                }
            }
        };
        
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < m; ++j) {
                tackle(i, j);
            }
        }

        return uf.find(0) == uf.find(pos(n - 1, m - 1));
    }
};
