
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string longestPalindrome(string s) {
        if (s.size() == 0) return "";

        int ans = 1;
        int id_ = 0;
        for (int i = 0; i < s.size() - 1; i++) {
            for (int j = s.size() - 1; j > i /* + ans - 1 */; j--) {
                if (check(s, i, j)) {
                    if (j - i + 1 > ans) {
                        ans = j - i + 1;
                        id_ = i;
                    }
                    break;
                }
            }
        }

        return s.substr(id_, ans);
    } 

    bool check(string& s, int l, int r) {
        while (l < r) {
            if (s[l++] != s[r--]) {
                return false;
            }
        }
        return true;
    }
};
