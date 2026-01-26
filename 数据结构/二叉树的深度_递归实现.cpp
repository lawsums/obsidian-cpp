#include <algorithm>

class TreeNode {
public:
    int val;
    TreeNode* left;
    TreeNode* right;
};

    
int binaryTreeDepth(TreeNode* root) {
    if (!root) return 0;
    return std::max(binaryTreeDepth(root->left),
               binaryTreeDepth(root->right)) + 1;
}


