class CombinationIterator {
private:
    string s;
    int n, k;
    int idx;
    vector<string> ans;
    vector<char> path;

public:
    CombinationIterator(string characters, int combinationLength) {
        s = characters;
        n = characters.size();
        k = combinationLength;
        idx = 0;

        // 提前剪枝：如果路径长度+剩余字符数 < k，不可能成功
        dfs(0);
    }

    void dfs(int start) {
        // 剪枝：如果路径长度+剩余字符数 < k，不可能成功
        if (path.size() + (n - start) < k) {
            return;
        }

        if (path.size() == k) {
            ans.emplace_back(path.begin(), path.end());// 使用 string(path.begin(), path.end()) (其中path: vector<char>)的构造函数
            // ans.emplace_back(path | views::join_with('') | ranges::to<string>()); // 这个是模拟的python的join函数, 但是path中也只能是string而不是char.
            return;
        }

        if (start == n) {
            return;
        }

        // 选择当前字符
        path.push_back(s[start]);
        dfs(start + 1);
        path.pop_back();

        // 不选择当前字符
        dfs(start + 1);
    }

    string next() {
        return ans[idx++];
    }

    bool hasNext() {
        return idx < ans.size();
    }
};
