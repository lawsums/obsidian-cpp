// 二叉树的后序遍历_一个栈实现

#include <stack>
#include <iostream>

using namespace std;

class TreeNode {
public:
    int val;
    TreeNode* left;
    TreeNode* right;  
};

void postorder(TreeNode* h) {
    if (!h) return;

    stack<TreeNode*> stk;
    stk.push(h);
    while (!stk.empty()) {
        auto *cur = stk.top();
        if (cur->left != nullptr 
            && cur->left != h 
            && cur->right != h) {
            // cur = cur->left;
            stk.push(cur->left);
        } else if (cur->right != nullptr 
                   && cur->right != h) {
            // cur = cur->right;
            stk.push(cur->right);
        } else {
            cout << cur->val << " " << endl;
            h = stk.top(); 
            stk.pop();
        }
    }
    cout << endl;
}
