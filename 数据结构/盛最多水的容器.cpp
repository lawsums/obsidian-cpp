#include <bits/stdc++.h>
#include <iterator>
using namespace std;

// TODO 错啦！！！
class Solution {
public:
    int maxArea(vector<int>& height) {
        vector<int> pre(height.size(), 0);
        vector<int> suf(height.size(), 0);
        // partial_sum(height.begin(), height.end(), pre.begin());
        // partial_sum(height.rbegin(), height.rend(), suf.rbegin());



        // pre: 存储当前遍历过的最高柱子的坐标
        // suf: 反过来同理
        for (int i = 0; i < height.size(); i++) {
            if (i > 0) {
                if (height[i] > height[pre[i - 1]]) {
                    pre[i] = i;
                } else {
                    pre[i] = pre[i - 1];
                }
            } else {
                pre[i] = i;
            }
        }

        for (int i = height.size() - 1; i > -1; i--) {
            if (i < height.size() - 1) {
                if (height[i] > height[suf[i + 1]]) {
                    suf[i] = i;
                } else {
                    suf[i] = suf[i + 1];
                }
            } else {
                suf[i] = i;
            }
        }

        for (const auto& elem : pre) cout << elem << ", "; 
        cout << endl;
        for (const auto& elem : suf) cout << elem << ", "; 
        cout << endl; 

        int ans = 0;
        for (int i = 0; i < height.size(); i++) {
            ans = max(ans,
                (suf[i] - pre[i]) * min(height[suf[i]], height[pre[i]]));
        }

        return ans;
    }
};

int main() {
    vector<int> height = {1,8,6,2,5,4,8,3,7};
    cout << Solution().maxArea(height) << endl;
}
