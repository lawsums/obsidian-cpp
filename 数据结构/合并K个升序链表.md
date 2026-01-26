

DECK: 面试题-hot100

## 合并K个升序链表


## 思路

很简单，使用**堆**来判定哪一个链表需要给到下一个元素，不过呢在C++里面需要自定义比较函数，要不然链表无法自主比较，会卡在这里

## 标准解法

```cpp

#include <bits/stdc++.h>
using namespace std;

// TODO 写解析
// Definition for singly-linked list.
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        auto cmp = [](ListNode* l1, ListNode* l2) {
            return l1->val > l2->val;
        };

        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);

        for (const auto& elem : lists) {
            // if (elem) cout << "elem = " << elem->val << endl;
            if (elem) pq.push(elem);
        }

        ListNode* dummy = new ListNode();
        auto cur = dummy;
        while (!pq.empty()) {
            auto tmp = pq.top(); pq.pop();
            cur->next = new ListNode(tmp->val);
            cur = cur->next;
            if (tmp->next) pq.push(tmp->next);
        }

        return dummy->next;
    }
};
```

## 我的解法


END
<!--ID: 1763829269240-->


