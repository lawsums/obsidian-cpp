#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trap(vector<int>& nums) {
        int n = nums.size();
        vector<int> pre(n, 0);
        vector<int> suf(n, 0);
        partial_sum(nums.begin(), nums.end(), pre.begin(), [](int a, int b) { return max(a, b); });
        partial_sum(nums.rbegin(), nums.rend(), suf.rbegin(), [](int a, int b) { return max(a, b); });
        
        int ans = 0;
        for (int i = 0; i < n; i++) {
            ans += (min(pre[i], suf[i]) - nums[i]);
        }
        return ans;
    }
};
