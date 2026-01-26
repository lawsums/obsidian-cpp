#include <stack>
#include <tuple>

using namespace std;

class TreeNode {
public:
    int val;
    TreeNode* left;
    TreeNode* right;
};

int binaryTreeDepth(TreeNode* root) {
    if (!root) { return 0; }
    
    stack<tuple<TreeNode*, int>>  stk;
    stk.push({root, 1});
    int ans = 0;
    while (!stk.empty()) {
        auto [cur_node, cur_val] = stk.top(); stk.pop();
        ans = max(ans, cur_val);
        // 先放右再放左，因为栈先进后出
        if (cur_node->right) { stk.push({cur_node->right, cur_val + 1}); }
        if (cur_node->left) { stk.push({cur_node->left, cur_val + 1}); }
    }
    return ans;
}

