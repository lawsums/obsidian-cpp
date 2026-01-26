
#include <bits/stdc++.h>
using namespace std;

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
    ListNode* deleteDuplicates(ListNode* head) {
        auto dummy = new ListNode();
        auto mp = unordered_map<int, int>{};

        dummy->next = head;
        auto cur = dummy->next;
        auto pre = dummy;
        while (cur) {
            mp[cur->val]++;
            cur = cur->next;
        }

        cur = dummy->next;
        // 再遍历一次，构造一个新的链表
        auto root = new ListNode();
        auto cur2 = root;
        while (cur) {
            if (!mp.count(cur->val)) {
                cur2->next = cur;
            } 
            cur = cur->next;
        }

        return root->next;
    }
};