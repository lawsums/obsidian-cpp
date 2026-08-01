from common_imports import *

class Solution:
    def maxArea(self, height: List[int]) -> int:
        n = len(height)
        l = 0
        r = n - 1
        ans = 0

        while l < r:
            # print(f"l, r = {l}, {r}")
            # print(f"\theight[l] = {height[l]}, height[r] = {height[r]}")
            ans = max(ans, 
                      min(height[l], height[r]) * (r - l)
                      )
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
            # print(f"\tcur = {min(height[l], height[r]) * (l - r)}")
            # print(f"\tans = {ans}")

        return ans
        