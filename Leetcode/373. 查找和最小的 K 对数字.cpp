#include <bits/stdc++.h>
#include <queue>
using namespace std;

using ati = array<int, 3>;

class Solution {
public:
    vector<vector<int>> kSmallestPairs(vector<int>& nums1, vector<int>& nums2, int k) {
        priority_queue<ati, vector<ati>, greater<>> pq; // 最小堆

        for (int i = 0; i < nums1.size(); i++) {
            for (int j = 0; j < nums2.size(); j++) {
                pq.push({nums1[i] + nums2[j], i, j}); // 通过最小堆排序
            }
        }
    }
};
