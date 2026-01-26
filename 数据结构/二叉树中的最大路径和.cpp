
#include <bits/stdc++.h>
using namespace std;

// Definition for a binary tree node.
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

class Solution {
private:
    int max_ = INT_MIN;

public:
    // 表示贡献度，贡献度可以为零
    int dfs(TreeNode* node) {
        if (!node) return 0;

        int left_gain = max(0, dfs(node->left));
        int right_gain = max(0, dfs(node->right));
        max_ = max(max_, node->val + left_gain + right_gain);

        return node->val + max(left_gain, right_gain);
    }

    int maxPathSum(TreeNode* root) {
        return dfs(root);
    }
};