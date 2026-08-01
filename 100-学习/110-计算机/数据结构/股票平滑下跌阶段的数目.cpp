// 股票平滑下跌阶段的数目
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    long long getDescentPeriods(vector<int> &prices) {
    }

    long long f1(vector<int> &prices) {
        vector<int> stk;
        long long ans = 0;
        for (int i = 0; i < prices.size(); i++) {
            // 单调栈
            while (!stk.empty() && prices[i] != stk.back() - 1) {
                stk.pop_back();
            }
            stk.push_back(prices[i]);
            ans += stk.size();
        }
        return ans;
    }

    long long f2(vector<int> &prices) {
        // 一遍遍历
        int pre = INT_MAX, cnt = 1;
        long long ans = 0;
        for (int i = 0; i < prices.size(); i++) {
            if (prices[i] == pre - 1) {
                cnt++;
            } else {
                cnt = 1;
            }
            ans += cnt;

            pre = prices[i];
        }
    }
};