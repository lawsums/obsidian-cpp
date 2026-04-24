#include <bits/stdc++.h>
#include <variant>
#include <vector>
using namespace std;

class Solution {
private:
    vector<vector<bool>> visit;
    vector<vector<int>> path;
    vector<vector<int>> dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    int n, m;
public:
    vector<vector<int>> pathWithObstacles(vector<vector<int>>& obstacleGrid) {
        n = obstacleGrid.size(), m = obstacleGrid[0].size();
        visit.assign(n, vector<bool>(m, false));
        dfs(0, 0, obstacleGrid); // r, c
        return path;
    }

    bool dfs(int r, int c, vector<vector<int>>& obstacleGrid) {
        auto legal = [=](int r, int c) {
            return (0 <= r && r <= n && 0 <= c && c <= m) && obstacleGrid[r][c] != 1;
        };

        // 如果已经到达了终点，直接返回True
        path.push_back({r, c});
        visit[r][c] = true;
        
        if (r == n && c == m) return true;

        for (int k = 0; k < 4; ++k) {
            int nr = r + dirs[k][0], nc = c + dirs[k][1];
            if (legal(nr, nc) && !visit[nr][nc]) {
                if (dfs(nr, nc, obstacleGrid)) {
                    return true;
                }
            }
        } 

        path.pop_back();
        visit[r][c] = false;

        // 返回False
        return false;
    }
};
