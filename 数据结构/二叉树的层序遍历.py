# Definition for a binary tree node.

from common_imports import *

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:         
        if not root: return []
        
        dq = deque([root])
        ans = []

        while dq:
            tmp  = []
            for i in range(len(dq)):
                cur = dq.popleft()
                if cur.left: dq.append(cur.left)
                if cur.right: dq.append(cur.right)
                tmp.append(cur.val)
            ans.append(tmp)

        return ans
            
            

            