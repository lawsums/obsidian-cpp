#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        vector<vector<int>> ans;
        int n = nums.size();
        sort(nums.begin(), nums.end());

        for (int i = 0; i < n - 2; i++) {
            int x = nums[i];
            if (x > 0) { // 不需要判断了
                break;
            }
            if (i > 0 /* 这里非常重要 */ && x == nums[i - 1]) { // 因为后面的数字是前面的子集，如果x == nums[i - 1]也只能形成一样的三元组，所以跳过
                continue;
            }
            
            int j = i + 1, k = n - 1;
            while (j < k) {
                if (x + nums[j] + nums[k] > 0) {
                    k--;   
                } 
                else if (x + nums[j] + nums[k] < 0) {
                    j++;
                } 
                // sum == 0
                else {
                    ans.push_back({x, nums[j], nums[k]});
                    // 如果后面一个元素和当前元素一样就一直跳过
                    while (j < k && nums[j] == nums[j + 1]) {
                        j++;
                    }
                    while (j < k && nums[k] == nums[k - 1]) {
                        k--;
                    }       
                    j++;
                    k--;             
                }
            }
        }

        return ans;
    }
};