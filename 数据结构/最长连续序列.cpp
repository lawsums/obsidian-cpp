// 第一个方法：红黑树(set/map)方法
// 时间复杂度：O(nlog(n)) 空间复杂度：O(n)
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        map<int, int> mp;

        for (const auto& num : nums) {
            mp[num]++;
        }

        int pre = INT_MIN;
        int cur = 0, ans = 0;
        for (const auto& [k, v] : mp) {
            if (k == pre + 1) {
                cur++;
            } else {
                cur = 1;
            }
            ans = max(ans, cur);
            pre = k;
        }
        return ans;
        
    }

};

// 第二个方法：哈希表(unordered_set)方法
// 时间复杂度：O(n) 空间复杂度：O(n)
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> num_set(nums.begin(), nums.end());
        int longest = 0;
        
        for (int num : num_set) {
            // 只从连续序列的起点开始计算
            // unordered_map/set查询
            // 时间复杂度O(1)
            if (num_set.find(num-1) == num_set.end()) {
                int current_num = num;
                int current_streak = 1;
                
                // 只对起点后的数字进行计算
                // 时间复杂度加上起始查询正好是O(n)
                while (num_set.find(current_num+1) != num_set.end()) {
                    current_num++;
                    current_streak++;
                }
                
                longest = max(longest, current_streak);
            }
        }
        return longest;
    }

};
