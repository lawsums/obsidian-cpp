#include <bits/stdc++.h>
#include <unordered_map>
using namespace std;

vector<int> mode = {0, 1, 0, -1, 0};

class Solution {
private:
    int n, m;
    int max_ = 0; // 记录最大面积
    int index = 0; 
    unordered_map<int, int> area;

public:
    int maxAreaOfIsland(vector<vector<int>> &grid) {
        n = grid.size(), m = grid[0].size();

        // 写一个bfs
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if (grid[i][j] == 1) { // 我们使用水漫金山的方法
                    dfs(i, j, grid);
                    index++; // 去下一个岛屿
                }
            }
        }

        return max_;
    }

    void dfs(int r, int c, vector<vector<int>> &grid) {
        auto legal = [=](int r, int c) {
            return 0 <= r && r < n && 0 <= c && c< m;
        };

        // 水漫过当前陆地
        grid[r][c] = 0;
        area[index]++;
        max_ = max(area[index], max_);

        for (int k = 0, nr, nc; k < 4; k++) {
            nr = r + mode[k];
            nc = c + mode[k + 1];
            if (legal(nr, nc) && grid[nr][nc] == 1) {
                dfs(nr, nc, grid);
            }
        }
    }
};
