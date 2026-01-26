#include <bits/stdc++.h>
using namespace std;


/*
 * @lc app=leetcode.cn id=394 lang=cpp
 *
 * [394] 字符串解码
 */

// @lc code=start
class Solution {
private:
    int where;

public:
    string decodeString(string s) {
        where = 0;
        return f(0, s);
    }

    string f(int i, string &s) {
        string ans = "";
        int k = 0;
        while (i < s.size() && s[i] != ']') {
            // cout << i << endl;
            if (isdigit(s[i])) {
                k = 10 * k + (s[i++] - '0');
            } else if (isalpha(s[i])) {
                ans.push_back(s[i++]);
            } else if (s[i] = '[') {
                string ss = f(i + 1, s);
                for (size_t i = 0; i < k; i++) { ans.append(ss); }
                i = where + 1;// 跳过']'
                k = 0;        // k清零
            }
        }

        where = i;
        return ans;
    }
};
// @lc code=end
