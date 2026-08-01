// 二叉树的遍历_栈实现
#include <stack>
#include <iostream>

using namespace std;

class TreeNode {
public:
    int val;
    TreeNode* left;
    TreeNode* right;  
};

// 前序遍历
void preorder(TreeNode* root) {
    if (!root) return;

    stack<TreeNode*> stk;
    stk.push(root);

    while (!stk.empty()) {
        auto *cur = stk.top(); stk.pop();
        cout << cur->val << " ";
        if (cur->right) stk.push(cur->right); // 先右后左
        if (cur->left) stk.push(cur->left);
    }
}

// 中序遍历
void midorder(TreeNode* root) {
    if (!root) return;

    stack<TreeNode*> stk;
    TreeNode* cur = root;

    while (!stk.empty() || cur != nullptr) {
        if (cur != nullptr) { // 如果有左子树就一直先去处理左子树
            stk.push(cur);
            cur = cur->left;
        } else { // 如果没有左子树再去处理右子树
            cur = stk.top(); stk.pop();
            cout << cur->val << " ";
            cur = cur->right;
        }
    }
}

// 后序遍历
void suforder(TreeNode* root) {
    if (!root) return ;

    stack<TreeNode*> stk, ans;
    stk.push(root);

    while (!stk.empty()) {
        auto* cur = stk.top();
        stk.pop();
        ans.push(cur); // 压到另一个栈中
        if (cur->left) stk.push(cur->left);
        if (cur->right) stk.push(cur->right);
    }

    while (!ans.empty()) {
        cout << ans.top()->val << " ";
        ans.pop();
    }

}