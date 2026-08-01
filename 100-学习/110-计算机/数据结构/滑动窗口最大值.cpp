
#include <bits/stdc++.h>
using namespace std;

// 1.有序集合
class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        multiset<int, int> ls;
        vector<int> ans;
        int l = 0;
        for (int r = 0; r < nums.size(); r++) {
            ls.insert(nums[r]);
            if (r >= k - 1) {
                ans.push_back(*ls.rbegin());
                auto it = ls.find(nums[l++]);
                ls.erase(it);
            }
        }

        return ans;
    }
};

// 2.堆（优先队列）
// 懒删除
class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        int n = nums.size();
        priority_queue<pair<int, int>> q;
        for (int i = 0; i < k; ++i) {
            q.emplace(nums[i], i);
        }        

        vector<int> ans = {q.top().first};
        for (int i = k; i < n; ++i) {
            q.emplace(nums[i], i);
            // 懒删除，只有检查到堆顶的index <= i - k时删除
            while (q.top().second <= i - k) {
                q.pop();
            }
            ans.push_back(q.top().first);
        }
        return ans;
    }
};

// 3.单调队列
class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> ans(n - k + 1); // 窗口个数
        deque<int> q; // 双端队列

        for (int i = 0; i < n; i++) {
            // 1. 右边入
            while (!q.empty() && nums[q.back()] <= nums[i]) {
                q.pop_back(); // 维护 q 的单调性
            }
            q.push_back(i); // 注意保存的是下标，这样下面可以判断队首是否离开窗口

            // 2. 左边出
            int left = i - k + 1; // 窗口左端点
            if (q.front() < left) { // 队首离开窗口
                q.pop_front();
            }

            // 3. 在窗口左端点处记录答案
            if (left >= 0) {
                // 由于队首到队尾单调递减，所以窗口最大值就在队首
                ans[left] = nums[q.front()];
            }
        }

        return ans;
    }
};
