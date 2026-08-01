
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */

class Solution {
public:
    bool hasCycle(ListNode *head) {
        unordered_map<ListNode*, int> mp;

        ListNode *cur;
        for (cur = head; cur != nullptr; cur = cur->next) {
            if (mp.count(cur)) return true;
            mp[cur]++;            
        }

        return false;
        
        
    }
};
