#include <bits/stdc++.h>
#include <list>
using namespace std;

class Node {
public:
    int key;
    int val;
    Node *prev;
    Node *next;
    Node() : key(-1), val(-1), prev(nullptr), next(nullptr) {}
    Node(int key, int val) : key(key), val(val), prev(nullptr), next(nullptr) {}
};

class LRUCache {
private:
    size_t capacity;
    Node *head;
    Node *tail;
    unordered_map<int, Node *> nodeMap;

public:
    LRUCache(int capacity) : capacity(capacity) {
        // 我们需要一个哈希表来存储键值对，以及一个双向链表来维护访问顺序。哈希表的键是缓存的键，值是指向双向链表节点的指针。双向链表的每个节点包含键和值。当我们访问一个键时，我们需要将对应的节点移动到链表的头部，以表示它是最近使用的。当缓存达到容量时，我们需要删除链表尾部的节点，即最久未使用的节点。
        head = new Node(); 
        tail = new Node(); 
        head->next = tail;
        tail->prev = head;
    }

    int get(int key) {
        // 去nodeMap中寻找
        if (nodeMap.find(key) != nodeMap.end()) {
            // 如果找到了
            auto node = nodeMap[key];
            update(node);
            return node->val;
        }

        // 没找到返回-1
        return -1;
    }

    void put(int key, int value) {

        if (nodeMap.find(key) != nodeMap.end()) {
            // 如果已经存在直接更新
            auto node = nodeMap[key];
            node->val = value;
            update(node);
        } else {
            // 如果内存满了需要驱逐一个节点
            if (nodeMap.size() == capacity) {
                evictNode();
            }

            // 交给内部实现
            putInternal(key, value);
        }
    }

private:
    void eraseNode(Node *node) {
        auto pre = node->prev;
        pre->next = node->next;
        node->next->prev = pre;
        // 这里是使用shared_ptr的时候需要析构所以用赋值函数置为空
        node->next = nullptr;
        node->prev = nullptr;
    }

    void appendNode(Node *node) {
        auto pre = tail->prev;
        //
        node->prev = pre;
        pre->next = node;

        // 连接node和tail
        node->next = tail;
        tail->prev = node;
    }

    // 驱逐最早的节点
    void evictNode() {
        auto node = head->next;
        eraseNode(node);
        auto it = nodeMap.find(node->key);
        nodeMap.erase(it);
    }

    // 缓存更新
    void update(Node *node) {
        eraseNode(node);
        appendNode(node);
    }

    void putInternal(int key, int value) {
        Node *node = new Node(key, value);
        nodeMap[key] = node;
        appendNode(node);
    }
};

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache* obj = new LRUCache(capacity);
 * int param_1 = obj->get(key);
 * obj->put(key,value);
 */

