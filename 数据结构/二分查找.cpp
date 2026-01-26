
class Solution {
public:
    int search(vector<int> &nums, int target) {
        int id = lower_bound(nums, target);
        return (0 <= id && id < nums.size() && nums[id] == target) ? id : -1;
    }

    int lower_bound(vector<int> &nums, int target) {
        int l = 0, r = nums.size() - 1;
        // nums[left - 1] < target
        // nums[right + 1] >= target
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] < target) {
                l = mid + 1;
            } else {// nums[mid] >= target
                r = mid - 1;
            }
        }
        // nums[left] = nums[right + 1] >= target
        return l;
    }
};
