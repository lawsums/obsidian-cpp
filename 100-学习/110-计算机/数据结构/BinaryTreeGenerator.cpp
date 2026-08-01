#include <iostream>
#include <cstdlib>
#include <ctime>
#include <vector>
#include <queue>
#include <functional>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

class EnhancedBinaryTreeGenerator {
private:
    int nodeCount;
    
public:
    EnhancedBinaryTreeGenerator(int count) : nodeCount(count) {
        srand(time(nullptr));
    }
    
    // 方法1：只生成树，不显示信息（用于你的算法测试）
    TreeNode* generateTreeOnly() {
        if (nodeCount <= 0) return nullptr;
        return generateSubtree(nodeCount);
    }
    
    // 方法2：生成并显示完整信息，同时返回树根
    TreeNode* generateAndDisplay() {
        cout << "=== 生成 " << nodeCount << " 个节点的随机二叉树 ===" << endl;
        
        TreeNode* root = generateTreeOnly();
        
        // 显示遍历结果
        displayTraversals(root);
        
        // 显示树的结构（简化版）
        cout << "\n树结构（简化表示）:" << endl;
        displayTreeStructure(root);
        
        // 验证遍历结果
        validateTraversals(root);
        
        cout << "\n✅ 二叉树已生成，根节点值为: " << root->val << endl;
        
        return root;  // 返回树的根节点
    }
    
    // 方法3：生成树并返回所有遍历结果
    struct TreeWithTraversals {
        TreeNode* root;
        vector<int> preorder;
        vector<int> inorder;
        vector<int> postorder;
    };
    
    TreeWithTraversals generateWithAllInfo() {
        TreeWithTraversals result;
        result.root = generateTreeOnly();
        
        if (result.root) {
            result.preorder = getTraversal(result.root, "pre");
            result.inorder = getTraversal(result.root, "in");
            result.postorder = getTraversal(result.root, "post");
        }
        
        return result;
    }
    
    // 清理树的内存（重要：使用完毕后调用）
    void deleteTree(TreeNode* root) {
        if (!root) return;
        deleteTree(root->left);
        deleteTree(root->right);
        delete root;
    }
    
private:
    TreeNode* generateSubtree(int n) {
        if (n == 0) return nullptr;
        
        TreeNode* root = new TreeNode(rand() % 100 + 1);
        
        if (n == 1) return root;
        
        int leftCount = rand() % n;
        root->left = generateSubtree(leftCount);
        root->right = generateSubtree(n - 1 - leftCount);
        
        return root;
    }
    
    void displayTraversals(TreeNode* root) {
        cout << "\n前序遍历: ";
        vector<int> pre = getTraversal(root, "pre");
        for (int val : pre) cout << val << " ";
        
        cout << "\n中序遍历: ";
        vector<int> in = getTraversal(root, "in");
        for (int val : in) cout << val << " ";
        
        cout << "\n后序遍历: ";
        vector<int> post = getTraversal(root, "post");
        for (int val : post) cout << val << " ";
        cout << endl;
    }
    
    vector<int> getTraversal(TreeNode* root, const string& type) {
        vector<int> result;
        
        function<void(TreeNode*)> traversal;
        
        if (type == "pre") {
            traversal = [&](TreeNode* node) {
                if (!node) return;
                result.push_back(node->val);
                traversal(node->left);
                traversal(node->right);
            };
        } else if (type == "in") {
            traversal = [&](TreeNode* node) {
                if (!node) return;
                traversal(node->left);
                result.push_back(node->val);
                traversal(node->right);
            };
        } else if (type == "post") {
            traversal = [&](TreeNode* node) {
                if (!node) return;
                traversal(node->left);
                traversal(node->right);
                result.push_back(node->val);
            };
        }
        
        traversal(root);
        return result;
    }
    
    void displayTreeStructure(TreeNode* root, int depth = 0) {
        if (!root) return;
        
        // 先右子树，再根节点，再左子树（便于观察）
        displayTreeStructure(root->right, depth + 1);
        
        for (int i = 0; i < depth; i++) cout << "    ";
        cout << root->val << endl;
        
        displayTreeStructure(root->left, depth + 1);
    }
    
    void validateTraversals(TreeNode* root) {
        vector<int> pre = getTraversal(root, "pre");
        vector<int> in = getTraversal(root, "in");
        vector<int> post = getTraversal(root, "post");
        
        cout << "\n验证信息:" << endl;
        cout << "节点总数: " << pre.size() << endl;
        cout << "前序第一个节点: " << (pre.empty() ? -1 : pre[0]) << " (应该是根节点)" << endl;
        cout << "后序最后一个节点: " << (post.empty() ? -1 : post.back()) << " (应该是根节点)" << endl;
    }
};

// 示例：你的测试函数
void myAlgorithm(TreeNode* root) {
    cout << "\n🎯 执行我的算法..." << endl;
    cout << "根节点值: " << root->val << endl;
    
    // 这里写你的算法逻辑
    // 比如：计算树的高度、节点数、验证某种性质等
    
    // 示例：计算节点数
    function<int(TreeNode*)> countNodes = [&](TreeNode* node) -> int {
        if (!node) return 0;
        return 1 + countNodes(node->left) + countNodes(node->right);
    };
    
    int nodeCount = countNodes(root);
    cout << "我的算法计算出的节点数: " << nodeCount << endl;
}

// 另一个示例算法：验证前序遍历
void verifyPreorder(TreeNode* root, const vector<int>& expected) {
    cout << "\n🔍 验证前序遍历..." << endl;
    
    vector<int> actual;
    function<void(TreeNode*)> preorder = [&](TreeNode* node) {
        if (!node) return;
        actual.push_back(node->val);
        preorder(node->left);
        preorder(node->right);
    };
    
    preorder(root);
    
    cout << "预期: ";
    for (int val : expected) cout << val << " ";
    cout << "\n实际: ";
    for (int val : actual) cout << val << " ";
    cout << "\n验证结果: " << (actual == expected ? "✅ 通过" : "❌ 失败") << endl;
}

int main() {
    srand(time(nullptr));
    
    cout << "=== 二叉树生成验证器 ===" << endl;
    
    // 方法1：生成树并显示信息，然后测试你的算法
    EnhancedBinaryTreeGenerator generator(8);
    TreeNode* tree_test = generator.generateAndDisplay();  // 现在可以返回TreeNode了
    
    // 使用生成的树测试你的算法
    myAlgorithm(tree_test);
    
    // 方法2：获取所有信息进行更详细的测试
    auto allInfo = generator.generateWithAllInfo();
    verifyPreorder(allInfo.root, allInfo.preorder);
    
    // 方法3：只生成树，不显示任何信息（用于性能测试）
    TreeNode* quickTree = generator.generateTreeOnly();
    cout << "\n🚀 快速生成的树根节点: " << quickTree->val << endl;
    
    // 重要：清理内存
    generator.deleteTree(tree_test);
    generator.deleteTree(quickTree);
    generator.deleteTree(allInfo.root);
    
    return 0;
}
