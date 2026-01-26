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
    ListNode* sortList(ListNode* head) {
        // 我们使用一个vec进行存储   
        auto nodes = vector<ListNode*>();
        auto cur = head;
        while (cur) { 
            nodes.push_back(cur);
            cur = cur->next;
        }

        sort(nodes.begin(), nodes.end(), [](ListNode* a, ListNode* b){
                return a->val < b->val;
                });

        for (int i = 0; i < nodes.size() - 1; i++) {
            nodes[i]->next = nodes[i + 1];
        }
        nodes.back()->next = nullptr; // 最后一个节点指向nullptr

        return nodes.front();
    }
};
