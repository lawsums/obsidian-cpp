#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minimumDeletions(string s) {
        // a a b a b b a b
        // 0 0 2 1 1 1 3 0
        // a 统计前面有多少个 b
        // b 统计后面有多少个 a

        // b b a a a a a b b
        // 5 5 2 2 2 2 2 0 0
        int n = s.size();
        vector<int> w(n, 0);
        for (int i = 0, cur = 0; i < n; i++) {
            if (s[i] == 'b') cur++;
            else s[i] = cur;
        }
        for (int i = n - 1, cur = 0; i >= 0; i--) {
            if (s[i] == 'a') cur++;
            else s[i] = cur;
        }

        for (int i = 0; i < n; i++) {
            printf("%d, ", w[i]);
        }
    }
};
