#include <bits/stdc++.h>
using namespace std;

class Solution {
private:
    int n, m;
    vector<int> mode = {0, 1, 0, -1, 0};
    vector<vector<int>> visited;

public:

    bool legal(int r, int c) {
        return 0 <= r && r < n && 0 <= c && c < m;
    }

    int numIslands(vector<vector<char>>& grid) {
        n = grid.size(), m = grid[0].size();
        visited.assign(n, vector<int>(m, 0));
        auto q = queue<pair<int, int>>{};

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                // 将零置为已访问过就不需要单独考虑零了
                if (grid[i][j] == '0') { 
                    visited[i][j] = 1;
                }
            }
        }


        // 对于每一个独立的1进行bfs
        int ans = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if (!visited[i][j]) {
                    // bfs

                    // 1.将岛屿标志加入队列
                    q.push({i, j});
                    visited[i][j] = 1;
                    ans++; // 增加答案

                    // 2.对于连在一起的岛屿都算作一个
                    while (!q.empty()) {
                        auto [r, c] = q.front();
                        q.pop(); /* 重点：需要去pop这个元素 */
                        for (int k = 0; k < 4; k++) {
                            auto nr = r + mode[k];
                            auto nc = c + mode[k + 1];
                            // 3.检查是否在gird范围内 同时 检查是否已经被访问过
                            if (legal(nr, nc) && !visited[nr][nc]) {
                                q.push({nr, nc});
                                visited[nr][nc] = 1;
                            }
                        }
                    }
                }
            }
        }

        return ans;
    }
};
