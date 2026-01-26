#include <iostream>
#include <bits/stdc++.h>
using namespace std;

//  * Definition for singly-linked list.
 struct ListNode {
     int val;
     ListNode *next;
     ListNode() : val(0), next(nullptr) {}
     ListNode(int x) : val(x), next(nullptr) {}
     ListNode(int x, ListNode *next) : val(x), next(next) {}
 };

class Solution {
public:
    ListNode* reverseBetween(ListNode* head, int left, int right) {
        int index = 0;
        auto dummy = new ListNode();
        dummy->next = head;
        auto cur = dummy;

        while (index < left - 1) {
            cur = cur->next;
            index++;
        } // 
        auto p1 = cur;
        auto need_reverse = p1->next;
        while (index < right + 1) {
            cur = cur->next;
            index++;
        }

        auto [p2, p3] = reverseList(need_reverse);
        if (cur == nullptr) {
            p1->next = p2;
        } else {
            p1->next = p2;
            p3->next = cur;
        }

        return head;
    }

    pair<ListNode*, ListNode*> reverseList(ListNode* head) {
        ListNode *pre = nullptr, *cur = head, *nxt = nullptr;
        
        while (cur) {
            nxt = cur->next;

            cur->next = pre;
            pre = cur;
            cur = nxt;
        } // pre = nullptr

        return {head, pre};
    }
};
