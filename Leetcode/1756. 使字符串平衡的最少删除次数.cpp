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
        // int n = s.size();
        // vector<int> w(n, 0);
        // for (int i = 0, cur = 0; i < n; i++) {
        //     if (s[i] == 'b') cur++;
        //     else w[i] = cur;
        // }
        // for (int i = n - 1, cur = 0; i >= 0; i--) {
        //     if (s[i] == 'a') cur++;
        //     else w[i] = cur;
        // }
        //
        // for (int i = 0; i < n; i++) {
        //     printf("%d, ", w[i]);
        // }


        // 如果没有a或者b直接返回0
        if (s.find('a') == string::npos || s.find('b') == string::npos) return 0; 

        // [(0, 0), (0, 1), (1, 3), (3, 6)]
        // [(0, 7), (1, 5), (1, 4), (2, 2)]
        // 3 > 2
        // 我们取出一个(3, 6), 删除之后(3, 6)影响到所有的其他小于6的b_stk, 
        // end_idx = 7, [0, 0, 0, 1] [6, 5, 4, 2]
        // start_idx = 0, [0, 0, 1], [0, 1, 3]
        
        // 删除之后呢我们通过这个优先队列判断是否还有逆序对
        int n = s.size();
        int start_a = -1;
        int end_b = -1;
        vector<int> a_stk{0}, b_stk{0};
        for (int i = 0, pre_a = -1; i < n; i++) {
            if (s[i] == 'a') {
                if (start_a == -1) start_a = i;
                // 如果已经存在
                else {
                    a_stk.push_back(i - pre_a - 1); 
                }
                pre_a = i;
            }
        }

        for (int i = n - 1, pre_b = -1; i >= 0; i--) {
            if (s[i] == 'b') {
                if (end_b == -1) end_b = i;
                // 如果已经存在
                else {
                    b_stk.push_back(pre_b - i - 1); 
                }
                pre_b = i;
            }
        }

        for (int i = 0; i < a_stk.size(); i++) {
            printf("%d, ", a_stk[i]);
        }
        cout << '\n';
        for (int i = 0; i < b_stk.size(); i++) {
            printf("%d, ", b_stk[i]);
        }
        cout << '\n';

        return 2;
    }
};


