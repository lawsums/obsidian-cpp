
class Solution {
public:
    int minPathSum(vector<vector<int>> &grid) {
        int n = grid.size(), m = grid[0].size();
        auto dp = vector<vector<int>>(n, vector<int>(m, 0));
        dp[0][0] = grid[0][0];

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if (i != 0 || j != 0) {
                    dp[i][j] = grid[i][j] + min(get(dp, i - 1, j), get(dp, i, j - 1));
                }
            }
        }

        return dp.back().back();
    }

    int get(vector<vector<int>> &grid, int i, int j) {
        if (i < 0 || j < 0) return INT_MAX;
        return grid[i][j];
    }
};
