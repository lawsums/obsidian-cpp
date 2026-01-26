
#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
};

class Solution {
private:
    // 使用map保证键的有序性
    map<int, int> mp;

public:
    void solver(TreeNode* node, int depth) {
        if (!node) return;
        mp[depth] = node->val;
        solver(node->left, depth + 1);
        solver(node->right, depth + 1);
    }

    vector<int> rightSideView(TreeNode* root) {
        // 将所有的节点加入列表
        solver(root, 0);
        // 然后按depth提取出来
        vector<int> ans;
        for (const auto&[k, v] : mp) {
            ans.push_back(v);
        }

        return ans;
    }
};

class Solution2 {
private:
    // 给mp留101层静态空间
    int mp[101];
    // 留一个变量记录最大深度
    int max_depth = -1;

public:
    void solver(TreeNode* node, int depth) {
        if (!node) return;
        max_depth = max(max_depth, depth);

        mp[depth] = node->val;
        solver(node->left, depth + 1);
        solver(node->right, depth + 1);
    }

    vector<int> rightSideView(TreeNode* root) {
        // 将所有的节点加入列表
        solver(root, 0);
        // 然后按depth提取出来
        vector<int> ans;
        for (int i = 0; i <= max_depth; i++) {
            ans.push_back(mp[i]);
        }

        return ans;
    }
};
