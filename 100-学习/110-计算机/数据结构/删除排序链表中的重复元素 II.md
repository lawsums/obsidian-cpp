

DECK: 面试题-hot100

## 删除排序链表中的重复元素 II


## 思路

最简单的解法是使用哈希表去进行检测哪些元素**已经出现过 2 次及以上**了，然后对于这些元素直接跳过，对于其他元素加入答案中。

另外还有一次遍历的解法，我暂时对你不做要求。

## 标准解法


## 第一个代码优化（保留单个重复元素）

```cpp
class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        if (!head) return nullptr;
        
        ListNode* cur = head;
        unordered_set<int> seen;
        seen.insert(cur->val);
        
        while (cur->next) {
            if (seen.count(cur->next->val)) {
                // 删除重复节点
                cur->next = cur->next->next;
            } else {
                seen.insert(cur->next->val);
                cur = cur->next;
            }
        }
        
        return head;
    }
};
```

**优化点：**
1. 移除了虚拟头节点，直接处理
2. 使用 `unordered_set` 更符合语义
3. 简化了删除逻辑，直接在遍历时处理下一个节点
4. 减少了指针操作

## 第二个代码优化（删除所有重复元素）

```cpp
class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        if (!head) return nullptr;
        
        unordered_map<int, int> freq;
        ListNode* cur = head;
        
        // 统计频率
        while (cur) {
            freq[cur->val]++;
            cur = cur->next;
        }
        
        // 使用虚拟头节点处理头节点可能被删除的情况
        ListNode* dummy = new ListNode(0);
        dummy->next = head;
        cur = dummy;
        
        while (cur->next) {
            if (freq[cur->next->val] > 1) {
                // 删除重复节点
                cur->next = cur->next->next;
            } else {
                cur = cur->next;
            }
        }
        
        return dummy->next;
    }
};
```

**优化点：**
1. 移除了创建新节点的开销，直接在原链表上操作
2. 使用虚拟头节点统一处理逻辑
3. 减少了内存分配（不需要 `new ListNode`）
4. 简化了遍历逻辑

## 进一步优化（单次遍历版本）

对于第二个问题，还可以进一步优化为单次遍历：

```cpp
class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode* dummy = new ListNode(0);
        dummy->next = head;
        ListNode* prev = dummy;
        
        while (head) {
            // 检查当前节点是否是重复节点
            if (head->next && head->val == head->next->val) {
                // 跳过所有重复节点
                while (head->next && head->val == head->next->val) {
                    head = head->next;
                }
                prev->next = head->next;
            } else {
                prev = prev->next;
            }
            head = head->next;
        }
        
        return dummy->next;
    }
};
```

这个版本不需要哈希表，空间复杂度 O (1)，时间复杂度 O (n)。

## 我的解法

``` cpp
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
```

END
<!--ID: 1764608754444-->

