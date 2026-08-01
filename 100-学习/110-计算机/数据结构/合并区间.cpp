class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](vector<int>& a, vector<int>& b) {
            return a[0] < b[0];
        });

        vector<vector<int>> ans;
        for (int i = 0; i < intervals.size(); i++) {
            if (!ans.empty() && ans.back()[1] >= intervals[i][0]) { // 如果栈不为空而且 pre_end >= nxt_start
                 ans.back()[1] = max(ans.back()[1], intervals[i][1]); // 两个交集的尾部取最大值
            } else {
                ans.push_back(intervals[i]);
            }
        } 

        return ans;
    }
};
