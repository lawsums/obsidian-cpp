
from common_imports import *
from functools import cache

# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        self.max_sum = float('-inf')
        
        def max_gain(node):
            if not node:
                return 0
                
            # 递归计算左右子树的最大贡献值
            left_gain = max(max_gain(node.left), 0)
            right_gain = max(max_gain(node.right), 0)
            
            # 当前节点作为路径拐点的路径和
            price_newpath = node.val + left_gain + right_gain
            
            # 更新全局最大值
            self.max_sum = max(self.max_sum, price_newpath)
            
            # 返回当前节点的最大贡献值（只能选择一条路径）
            return node.val + max(left_gain, right_gain)
        
        max_gain(root)
        return self.max_sum


class Solution2:
    
    def maxPathSum(self, root: Optional[TreeNode]) -> int:

        """
        返回这个节点当前的路径最大值
        param: node，当前节点
        param: turn，在当前节点是否拐弯
        """
        @cache
        def dfs(node: Optional[TreeNode], turn: bool) -> int:
            if node == None:
                return 0

            # node exist
            if turn == True:
                return node.val + dfs(node.left, False) + dfs(node.right, False)

            # turn == False
            # 1.要当前节点
            ans = node.val + max(dfs(node.left, False), dfs(node.right, False))

            # 2.不要当前节点
            ans = max(ans, 
                      dfs(node.left, True),
                      dfs(node.right, True),
                      dfs(node.left, False),
                      dfs(node.right, False)
                      )
            
            return ans
         
        return max(dfs(root, True),
                   dfs(root, False))
