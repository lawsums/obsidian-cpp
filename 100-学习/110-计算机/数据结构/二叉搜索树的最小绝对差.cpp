
struct Info {
    int max_;
    int min_;

    Info(int max_, int min_) : 
        max_(max_), min_(min_) { }
};


class Solution {
private:
    int ans;

public:
    int getMinimumDifference(TreeNode* root) {
        ans = INT_MAX;
        f(root);
        return ans;
    }

    Info f(TreeNode* node) {
        if (!node) return Info(INT_MIN, INT_MAX);

        auto Infol = f(node->left);
        auto Infor = f(node->right);
        int max_ =  max(node->val, max(Infol.max_, Infor.max_));   
        int min_ =  min(node->val, min(Infol.min_, Infor.min_));   
        // 当前代码：
        // ans = min(ans, 
        //     min(Infol.max_ != INT_MIN ? abs(node->val - Infol.max_) : INT_MAX, 
        //         Infor.min_ != INT_MAX ? abs(node->val - Infor.min_) : INT_MAX)); 

        // 可以简化为：
        if (Infol.max_ != INT_MIN) 
            ans = min(ans, node->val - Infol.max_);  // BST中 node->val > Infol.max_
        if (Infor.min_ != INT_MAX) 
            ans = min(ans, Infor.min_ - node->val);  // BST中 Infor.min_ > node->val
        // 因为BST保证左子树所有值 < 当前节点 < 右子树所有值，所以不需要abs()

        return Info(max_, min_); 

    }
};
