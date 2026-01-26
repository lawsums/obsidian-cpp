
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