#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int cur = 0;
        int ans = INT_MIN;
        for (int i = 0; i < nums.size(); i++) {
            cur = max(nums[i], cur + nums[i]); // 舍去小于零的部分
            ans = max(ans, cur);
        }
        
        return ans;
    }
};