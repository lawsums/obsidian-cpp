#include <bits/stdc++.h>
#include <deque>
using namespace std;

// ### 2.3.2 输入描述
// - 第一行：`M N`，表示图片尺寸（M、N < 1024）
// - 接下来 `M` 行：输入图片像素值
// - 接下来 `M` 行：输出图片像素值

int dirs[4][2] = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};

int main() {
    // 核心模板：解除 C 和 C++ 输入输出绑定，并取消 cin/cout 的绑定
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    auto vec = vector<vector<int>>(n, vector<int>(m, 0));

    // 为什么这里输入图片像素值初始化要初始化为全零？因为全零的话，方便我们用异或来代替读入。用两次异或，如果结果还是零，就说明这个像素未被修改。然后我们对零进行 DFS，这就是这道题。
    
    // 正常使用 cin/cout，注意不要混用 scanf/printf
    int num;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            cin >> num;
            vec[i][j] ^= num;
        }
    }

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            cin >> num;
            vec[i][j] ^= num;
        }
    }

    auto legal = [=](int r, int c) {
        return 0 <= r && r < n && 0 <= c && c < m;
    };

    auto bfs = [&](int i0, int j0) {
        deque<int> dq;
        // 这里等于-1，就相当于表示它已经被访问过
        int res = 1;
        vec[i0][j0] = -1;
        dq.push_back(i0 * m + j0);     
        while (!dq.empty()) {
            // 在 DQ 非零之前，一直进行 BFS，所以 BFS 结束后 DQ 又会变成 0，不需要手动清空。
            int cur = dq.front(); dq.pop_front();
            int r = cur / m, c = cur % m;
            for (int k = 0, nr, nc; k < 4; k++) {
                nr = r + dirs[k][0];
                nc = c + dirs[k][1];
                if (legal(nr, nc) && vec[nr][nc] == 0) {
                    vec[nr][nc] = -1; 
                    dq.push_back(nr * m + nc);
                    res++; 
                }
            }
        }
        return res;
    };

    // 此时我们可以去检测这个vec矩阵了
    int ans = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (vec[i][j] == 0) {
                ans = max(ans, bfs(i, j));
            }
        }
    }

    // 输出使用 '\n' 而不是 endl（endl 会强制刷新缓冲区，很慢）
    cout << ans << '\n';
    
    return 0;
}
