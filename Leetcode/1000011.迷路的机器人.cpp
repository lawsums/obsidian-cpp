#include <bits/stdc++.h>
using namespace std;

class Solution {
private:
    vector<vector<int>> path;
    vector<vector<int>> dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
public:
    vector<vector<int>> pathWithObstacles(vector<vector<int>>& obstacleGrid) {
        dfs(0, 0, obstacleGrid); // r, c
        return path;
    }

    bool dfs(int r, int c, vector<vector<int>>& obstacleGrid) {
        for (int ) 
    }
};
