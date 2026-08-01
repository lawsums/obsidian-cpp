
class Solution {
private:
    int n;
    string path;
    vector<string> ans;

public:
    void dfs(int i, int j) {
        if (i + j >= 2 * n) {
            if (i + j == 2 * n && i == j) ans.push_back(path);
            return;
        }

        if (i < n) {
            path.push_back('(');
            dfs(i + 1, j);
            path.pop_back();
        }

        if (j < i) {
            path.push_back(')');
            dfs(i, j + 1);
            path.pop_back();
        }
    }

    vector<string> generateParenthesis(int n) {
        this->n = n;
        dfs(0, 0);
        return ans;
    }
};
