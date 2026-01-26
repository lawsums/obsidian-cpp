// 方法1：使用大一圈的dp表
class Solution {
private:

public:
     int longestCommonSubsequence(string text1, string text2) {
        int n = text1.size(), m = text2.size();
        auto dp = vector<vector<int>>(n + 1, vector<int>(m + 1, 0));

        for (int i = 1; i < n + 1; i++) {
            for (int j = 1; j < m + 1; j++) {
                if (text1[i - 1] == text2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp.back().back();
    }
};


// 方法2：使用get方法防止越界
class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int n = text1.size(), m = text2.size();
        auto dp = vector<vector<int>>(n, vector<int>(m, 0));

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if (text1[i] == text2[j]) {
                    dp[i][j] = get(dp, i - 1, j - 1) + 1;
                } else {
                    dp[i][j] = max(get(dp, i - 1, j), get(dp, i, j - 1));
                }
            }
        }

        return dp.back().back();
    }   

    int get(vector<vector<int>>& dp, int i, int j) {
        if (i < 0 || j < 0) return 0;
        return dp[i][j];
    }
};
