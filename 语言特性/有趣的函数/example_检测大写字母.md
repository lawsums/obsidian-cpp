
手动循环方法中使用 [[isupper]] 检测是否是大小写
同时也可以使用 [[all_of]] 节省循环
``` cpp
return std::all_of(word.begin(), word.end(), [](char c){ return 'a'<=c && c<='z'; });
```

## Code
```cpp
class Solution {
public:
    bool detectCapitalUse(string word) {
        if (word.size() <= 1) return true;

        if (isupper(word[0])) { // 用<cctype>的isupper更简洁，替代手动ASCII比较
            // 传递下标1到末尾，避免substr拷贝
            return checkUpper(word, 1) || checkLower(word, 1);
        } else {
            return checkLower(word, 1);
        }
    }

    // 常量引用+起始下标，避免字符串拷贝
    bool checkUpper(const string& word, int start) {
        for (int i = start; i < word.size(); ++i) {
            if (!isupper(word[i])) return false;
        }
        return true;
    }

    bool checkLower(const string& word, int start) {
        for (int i = start; i < word.size(); ++i) {
            if (!islower(word[i])) return false;
        }
        return true;
    }
};
```
