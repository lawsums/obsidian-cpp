#include <bits/stdc++.h>
#include <functional>
#include <queue>
using namespace std;

class MedianFinder {
private:
    priority_queue<int, vector<int>, greater<>> minH;
    priority_queue<int, vector<int>, less<>> maxH;

public:
    MedianFinder() {
        
    }
    
    void addNum(int num) {
        if (minH.empty()) { // 如果最小堆没有元素
            minH.push(num);
            return;
        }
        
        // 假设minH.size() == maxH.size() or minH.size() == maxH.size() + 1
        // 不能直接都给最小堆
        // 需要和最大堆堆顶对比一下
        // 如果大于等于最大堆堆顶，直接给最小堆，否则给最大堆
        if (!maxH.empty() && num < maxH.top()) {
            maxH.push(num);
        } else {
            minH.push(num);
        }

        if (minH.size() > maxH.size() + 1) {
            maxH.push(minH.top()); 
            minH.pop();
        }
        if (minH.size() < maxH.size()) {
            minH.push(maxH.top()); 
            maxH.pop();
        }
    }
    
    double findMedian() {
        if (minH.size() == maxH.size()) {
            return (minH.top() + maxH.top()) / 2.0;
        }
        return minH.top();
    }
};

/**
 * Your MedianFinder object will be instantiated and called as such:
 * MedianFinder* obj = new MedianFinder();
 * obj->addNum(num);
 * double param_2 = obj->findMedian();
 */