#include <bits/stdc++.h>
using namespace std;

class LRUCache {
private:
    int capacity_;
    // list 存储 key-value 对，最近使用的在链表头部
    list<pair<int, int>> cacheList;
    // 哈希表映射 key 到 list 中的迭代器
    unordered_map<int, list<pair<int, int>>::iterator /*存的是iterator*/> cacheMap;
    
public:
    LRUCache(int capacity) : capacity_(capacity) {}
    
    int get(int key) {
        // 如果 key 不存在，返回 -1
        if (cacheMap.find(key) == cacheMap.end()) {
            return -1;
        }

        // 找到对应的迭代器
        auto it = cacheMap[key];
        int value = it->second;
        
        // 将访问的节点移到链表头部（最近使用）
        cacheList.erase(it);
        cacheList.push_front({key, value});
        
        // 更新哈希表中的迭代器
        cacheMap[key] = cacheList.begin();
        
        return value;
    }
    
    void put(int key, int value) {
        // 如果 key 已存在
        if (cacheMap.find(key) != cacheMap.end()) {
            // 删除原来的节点
            auto it = cacheMap[key];
            cacheList.erase(it);
        }
        // 如果缓存已满且要插入新key
        else if (cacheList.size() == capacity_) {
            // 删除链表尾部的节点（最久未使用）
            auto last = cacheList.back();
            cacheMap.erase(last.first);
            cacheList.pop_back();
        }
        
        // 插入新节点到链表头部
        cacheList.push_front({key, value});
        cacheMap[key] = cacheList.begin();
    }
};
