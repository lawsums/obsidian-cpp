
class Solution {
    // lower_bound 返回最小的满足 nums[i] >= target 的下标 i
    // 如果数组为空，或者所有数都 < target，则返回 nums.size()
    // 要求 nums 是非递减的，即 nums[i] <= nums[i + 1]
    int lower_bound(vector<int> &nums, int target) {
        int left = 0, right = (int) nums.size() - 1;// 闭区间 [left, right]
        while (left <= right) {                     // 区间不为空
            // 循环不变量：
            // nums[left-1] < target
            // nums[right+1] >= target
            int mid = left + (right - left) / 2;
            if (nums[mid] >= target) {
                right = mid - 1;// 范围缩小到 [left, mid-1]
            } else {
                left = mid + 1;// 范围缩小到 [mid+1, right]
            }
        }
        // 循环结束后 left = right+1
        // 此时 nums[left-1] < target 而 nums[left] = nums[right+1] >= target
        // 所以 left 就是第一个 >= target 的元素下标
        return left;
    }

public:
    vector<int> searchRange(vector<int> &nums, int target) {
        int start = lower_bound(nums, target);
        if (start == nums.size() || nums[start] != target) {
            return {-1, -1};// nums 中没有 target
        }
        // 如果 start 存在，那么 end 必定存在
        int end = lower_bound(nums, target + 1) - 1;
        return {start, end};
    }
};

class Solution {
private:
    int n;

public:
    vector<int> searchRange(vector<int> &nums, int target) {
        n = nums.size();

        // 边界条件, n == 0
        if (n == 0) return {-1, -1};

        // 边界条件, n == 1
        if (n == 1) {
            if (nums[0] == target) return {0, 0};
            return {-1, -1};
        }
        // return(nums[0] == target ? {0, 0} : {-1, -1});

        int first = search(target, nums);
        int second = search(target + 1, nums) - 1;
        // printf("first = %d\n", first);
        // printf("second = %d\n", second);
        return {(0 <= first && first < nums.size() && nums[first] == target) ? first : -1,
                (0 <= second && second < nums.size() && nums[second] == target) ? second : -1};
    }

    int search(int target, vector<int> &nums) {
        int l = 0, r = n - 1;
        int mid;
        while (l <= r) {
            mid = (l + r) / 2;
            // printf("mid = %d\n", mid);
            if (nums[mid] < target) {
                l = mid + 1;
            } else {// nums[mid] >= target;
                r = mid - 1;
            }
        }

        // return target == nums[mid] ? mid : -1;
        return mid;
    }
};
