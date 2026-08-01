#include <bits/stdc++.h>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        if (s.empty()) return 0;

        vector<int> cnt(256, 0);
        int l = 0, ans = 1;        

        for (int r = 0; r < s.size(); r++) {
            auto c = s[r];
            while (l < r && cnt[c] > 0) {
                cnt[s[l++]]--;
            }
            // !cnt[c]
            cnt[c]++;
            ans = max(r - l + 1, ans);
            
        }

        return ans;
    }
};