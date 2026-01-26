#include <bits/stdc++.h>
using namespace std;

// 前缀和实现
class Solution {
public:
    int subarraySum(vector<int> &nums, int k) {
        unordered_map<int, int> mp;// <数值，出现过的个数>
        mp[0]++;

        long long cur = 0;
        int ans = 0;
        for (int l = 0, r = 0; r < nums.size(); r++) {
            cur += nums[r];
            ans += mp[cur - k];
            mp[cur]++;
        }

        return ans;
    }
};
