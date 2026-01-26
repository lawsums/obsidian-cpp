#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        unordered_map<char, char> mp = {
                {')', '('},
                {']', '['},
                {'}', '{'}};

        string leftBrackets = "([{";// 只创建一次
        stack<char> stk;

        for (char c: s) {
            if (leftBrackets.find(c) != string::npos) {
                stk.push(c);
            } else {
                if (stk.empty() || mp[c] != stk.top()) {
                    return false;
                }
                stk.pop();
            }
        }

        return stk.empty();
    }
};