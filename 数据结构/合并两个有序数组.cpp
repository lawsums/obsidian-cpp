#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        vector<int> nums1_(nums1.begin(), nums1.end());
        int id1 = 0, id2 = 0;
        for (int i = 0; i < nums1.size(); i++) {
            if (id1 < m && id2 < n) {
                if (nums1_[id1] <= nums2[id2]) {
                    nums1[i] = nums1_[id1++];
                } else {
                    nums1[i] = nums2[id2++];
                }
            }  
            // id1 >= m || id2 >= n
            else {
                // 假如id1 < m
                if (id1 < m) nums1[i] = nums1_[id1++];
                // 否则id2 < n
                else nums1[i] = nums2[id2++]; 
            }
        }
        
    }
};