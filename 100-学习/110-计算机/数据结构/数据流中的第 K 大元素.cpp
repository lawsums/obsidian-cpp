#include <bits/stdc++.h>
#include <functional>
using namespace std;

class KthLargest {
private:
    priority_queue<int, vector<int>, greater<>> minH; // 小根堆（存储前k大的元素，堆顶为第k大）
    priority_queue<int, vector<int>, less<>> maxH;     // 大根堆（存储比第k大更小的元素）
    int k; // 记录k值

public:
    KthLargest(int k, vector<int>& nums) : k(k) { // 初始化k
        for (const auto& num : nums) {
            add(num); // 复用add逻辑，确保minH最终有k个元素（或所有元素）
        }
    }
    
    int add(int val) {
        // 第一步：先将新元素加入合适的堆，保证minH在未满k个时优先填满
        if (minH.size() < k) {
            minH.push(val);
        } else {
            // 若minH已满k个，比较新元素与当前第k大元素
            if (val > minH.top()) {
                maxH.push(minH.top());
                minH.pop();
                minH.push(val);
            } else {
                maxH.push(val);
            }
        }
        // 此时minH一定非空（因为构造时至少会处理完nums，add时会优先填满minH）
        return minH.top();
    }
};