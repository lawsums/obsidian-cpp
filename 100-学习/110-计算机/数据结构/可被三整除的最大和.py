# class Solution:
#     def maxSumDivThree(self, nums: List[int]) -> int:
#         # % 3 == 1的和% 3 == 2的数字个数要一样多
#         dp = [-1 for _ in range(3)]
#         dp[0] = 0
#         sum_ = sum(num for num in nums if num % 3 == 0)
#         nums = [num for num in nums if num % 3 != 0]

#         for num in nums:
#             if num % 3 == 1:
#                 if dp[2] != -1: dp[0] = max(dp[0], dp[2] + num)
#                 dp[1] = max(dp[1], dp[0] + num)
#                 if dp[1] != -1: dp[2] = max(dp[2], dp[1] + num)
#             elif num % 3 == 2:
#                 dp[2] = max(dp[2], dp[0] + num)
#                 if dp[1] != -1: dp[0] = max(dp[0], dp[1] + num)
#                 if dp[2] != -1: dp[1] = max(dp[1], dp[2] + num)
        
#         return dp[0] + sum_

class Solution:
    def maxSumDivThree(self, nums: List[int]) -> int:
        dp = [0, -float('inf'), -float('inf')]
        
        for num in nums:
            temp = dp[:]
            for i in range(3):
                if dp[i] != -float('inf'):
                    remainder = (i + num) % 3
                    temp[remainder] = max(temp[remainder], dp[i] + num)
            dp = temp
        
        return dp[0]