

DECK: 面试题-hot100

## 实现前缀树


## 思路

前缀树需要实现两个类
1. TrieNode
2. Trie

TrieNode 主要提供属性，和**多叉树节点**有些相像，不过要记录 pass 和 end
- Pass: 经过这个节点的 word 数
- End: 以这个节点作为结尾的 word 数，也就是同一个 word 添加了多少次

Trie 里面有 3个要实现的方法
1. Insert
2. Search
3. StartWith

有一个隐藏方法必须要实现也就是 **delete_**，虽然这道题用不到
还有两个方法 
1. countWordsEqualTo 
2. countWordsStartingWith
也就是 Search 和 StartWith 非 bool 返回值形式

Cpp 中 delete_ 特有的难点在于释放空间，需要添加两部分
1. TrieNode 的析构函数

```cpp
~TrieNode() {
	for (auto& child : nexts) {
		delete child;
	}
}
```
2. Trie 的析构函数

```cpp
// 析构函数：释放根节点（会触发整个树的递归释放）
~Trie() {
	delete root;  // 根节点的析构函数会释放所有子节点
	root = nullptr;  // 避免野指针
}
```
3. Delete_函数中使用 delete TrieNode 提前释放子树

## 标准解法


```cpp
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
```

END
<!--ID: 1763361756226-->



