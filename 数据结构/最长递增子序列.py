# 错误答案：单调栈
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        stk = []
        ans = 0
        for num in nums:
            # 如果stk不为空，而且不能维持严格递增，就弹出元素
            while stk and num <= stk[-1]:
                stk.pop()
            stk.append(num)
            ans = max(ans, len(stk))
        return ans

# 正确答案：动态规划法
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        stk = []
        ans = 0
        for num in nums:
            # 如果stk不为空，而且不能维持严格递增，就弹出元素
            while stk and num <= stk[-1]:
                stk.pop()
            stk.append(num)
            ans = max(ans, len(stk))
        return ans



