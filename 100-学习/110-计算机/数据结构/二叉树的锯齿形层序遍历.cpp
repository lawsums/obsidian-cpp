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

// class Solution {
// public:
//     vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
//         // 层序遍历，然后每一层通过一个标志位进行正序或倒序遍历，每一层标志位翻转
//         if (!root) return {};

//         queue<TreeNode*> q;
//         vector<vector<int>> ans;
//         int sign = 1;
//         q.push(root);
//         while (!q.empty()) {
//             int n = q.size();
//             vector<int> tmp;
//             for (int i = 0; i < n; i++) {
//                 auto node = q.front(); q.pop();
//                 tmp.push_back(node->val);
//                 if (node->left) q.push(node->left);
//                 if (node->right) q.push(node->right);
//             }
//             if (!sign) { // 翻转当前层
//                 std::reverse(tmp.begin(), tmp.end());
//             }
//             sign ^= 1;
//             ans.push_back(tmp);
//         }

//         return ans;
//     }
// };

class Solution {
public:
    vector<vector<int>> zigzagLevelOrder(TreeNode* root) 
    {
        vector<vector<int>> res;
        queue<TreeNode*> q;
        if(root)
        q.push(root);
        bool lr = true;

        while(!q.empty())
        {
            int size = q.size();
            vector<int> level(size,0);

            for(int i = 0;i < size;i++)
            {
                root = q.front();
                q.pop();
                level[lr ? i : size - i - 1] = root->val;
                if(root->left) q.push(root->left);
                if(root->right) q.push(root->right);
            }

            res.push_back(move(level));
            lr = !lr;
        }
        return res;
    }
};
