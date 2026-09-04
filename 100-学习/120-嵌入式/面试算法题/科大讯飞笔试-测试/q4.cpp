#include <bits/stdc++.h>
#include <set>
using namespace::std;
using vi = vector<int>;

int main() {
    //   0
    // 1 2 3
    //   4
    //   5

    int combos[8][3] = {
        {0, 1, 2}, 
        {0, 2, 3}, 
        {1, 2, 4},
        {2, 3, 4}, 
        {0, 1, 5}, 
        {0, 3, 5}, 
        {1, 4, 5}, 
        {3, 4, 5}
    };

    auto arr = vi(6, 0);

    std::set<int> s;
    for (int i = 0; i < 8; i++) {
        int combo = 0;
        for (int j = 0; j < 3; j++) {
            int ind = combos[i][j]; 
            combo += arr[ind];
        }
        // 找到一个组合
        s.insert(combo);
    }

    // 因为这个集合会自动去重，所以直接得到答案
    std::cout << s.size() << '\n';

    return 0;
}