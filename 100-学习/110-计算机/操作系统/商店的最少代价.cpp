#include <bits/stdc++.h>
#include <climits>
using namespace std;

class Solution {
public:
    int bestClosingTime(string customers) {
        // 左边的0的数目
        // 右边的1的数目可以通过(1的总数 - 左边1的数量)得到
        auto pre = vector<int>(customers.size() + 1, 0);
        for (int i = 1; i < pre.size(); i++) {
            pre[i] = pre[i - 1] + (customers[i - 1] == 'Y' ? 1 : 0);
        }

        int max_costs = INT_MAX;
        int ans = -1;
        for (int i = 0; i < pre.size(); i++) {
            int left_zeros = i - pre[i];
            int right_ones = pre.back() - pre[i];
            if (max_costs > left_zeros + right_ones) {
                max_costs = left_zeros + right_ones;
                ans = i;
            }
        }

        return ans;
    }

};

