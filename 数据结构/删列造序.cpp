class Solution {
private:
    int n, m;

public:
    int minDeletionSize(vector<string> &strs) {
        // 检测逆序, 如果后面的字典序比前面的小, 那么就是逆序
        int ans = 0;
        n = strs.size(), m = strs[0].size();
        for (int j = 0; j < m; j++) {
            if (!check(j, strs)) ans++;
        }
        return ans;
    }

    bool check(int j, vector<string> &strs) {
        char pre = 'a' - 1;
        for (int i = 0; i < n; i++) {
            if (strs[i][j] < pre) return false;
            pre = max(pre, strs[i][j]);
        }
        return true;
    }
};
