#include <algorithm>
#include <bits/stdc++.h>
using namespace std;

class TrieNode {
public:
    int pass;
    int end;
    vector<TrieNode*> nexts;

    TrieNode() {
        pass = 0;
        end = 0;
        nexts = vector<TrieNode*>(26, nullptr);
    }

    ~TrieNode() {
        for (auto& child : nexts) {
            delete child;
        }
    }
};

class Trie {
private:
    TrieNode *root;

public:
    Trie() {
        root = new TrieNode();
    }

    // 析构函数：释放根节点（会触发整个树的递归释放）
    ~Trie() {
        delete root;  // 根节点的析构函数会释放所有子节点
        root = nullptr;  // 避免野指针
    }

    void insert(string word) {
        auto cur = root;
        cur->pass++;
        for (const auto& c : word) {
            auto path = c - 'a';
            // 如果不存在就创建
            if (cur->nexts[path] == nullptr) { 
                cur->nexts[path] = new TrieNode();
            }
            cur = cur->nexts[path];
            cur->pass++;
        }
        cur->end++;
    }

    bool search(string word) {
        return countWordsEqualTo(word) > 0;
    }

    bool startsWith(string prefix) {
        return countWordsStartingWith(prefix) > 0;
    }

// 这道题里面startsWith和search都是bool类型返回值，不需要暴露以下方法
private:
    int countWordsEqualTo(const string& word) {
        auto cur = root;
        for (const auto& c : word) {
            auto path = c - 'a';
            // 如果这个路径不存在直接返回0
            if (cur->nexts[path] == nullptr) { 
                return 0;
            }
            cur = cur->nexts[path];
        }
        // 最后返回是否是end
        return cur->end;
    }

    int countWordsStartingWith(const string& prefix) {
        auto cur = root;
        for (const auto& c : prefix) {
            auto path = c - 'a';
            // 如果这个路径不存在直接返回0
            if (cur->nexts[path] == nullptr) { 
                return 0;
            }
            cur = cur->nexts[path];
        }
        // 最后返回pass
        return cur->pass;
    }

    // 如果word存在过才有必要删除，否则不需要删除
    void delete_(const string& word) {
        if (countWordsEqualTo(word) > 0) {
            auto cur = root;
            cur->pass--;

            for (const auto& c : word) {
                auto path = c - 'a';
                // 如果删除完了之后pass == 0, 直接删除后面的整条分支
                if (--cur->nexts[path]->pass == 0) {
                    delete cur->nexts[path];
                    cur->nexts[path] = nullptr;
                    return;
                }
                // pass > 0
                cur = cur->nexts[path];
            }

            cur->end--;
        }
    }

};

