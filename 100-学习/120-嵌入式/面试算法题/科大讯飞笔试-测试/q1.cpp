#include <bits/stdc++.h>
using namespace std;
using vvi = vector<vector<int>>;
using vi = vector<int>;

// #### 2.1.1.1 基本概念
//
// 1. **输入**：一个 `m × n` 的矩阵 `I`，表示图像数据。
// 2. **卷积核**：一个 `k × l` 的矩阵 `K`，`k` 和 `l` 为奇数，保证有中心元素。
// 3. **卷积操作**：将卷积核中心对准输入的某个元素，重合区域对应元素相乘后求和，得到输出中对应位置的值。卷积核从左到右、从上到下滑动，步长为 1。
// 4. **输出**：卷积结果按顺序放入二维数组，输出大小与输入相同。
// 5. **特殊要求**：输出值小于 0 时置为 0，大于 255 时置为 255。

// ### 2.1.2 输入描述
//
// - 第一行：`M N K L`，分别表示输入矩阵大小和卷积核大小（均不大于 256）
// - 接下来 `M` 行：输入矩阵数据
// - 接下来 `K` 行：卷积核数据

int main() {
    // 核心模板：解除 C 和 C++ 输入输出绑定，并取消 cin/cout 的绑定
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, k, l;
    
    // 正常使用 cin/cout，注意不要混用 scanf/printf
    cin >> n >> m >> k >> l;

    auto matrix = vvi(n, vi(m, 0));
    auto kernal = vvi(k, vi(l, 0));
    auto input_data = [&](int rows, int cols, vvi& vec) {
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                cin >> vec[i][j];
            }
        }
    };

    // 输入数据
    input_data(n, m, matrix);
    input_data(k, l, kernal);

    // ---------------------------------------
    // 主流程
    
    auto tackle = [&](int i0, int j0) {
        int res = 0;
        for (int i = 0; i < k; i++) {
            for (int j = 0; j < l; j++) {
                res += matrix[i0 + i][j0 + j] * kernal[i][j];
            }
        }
        return res;
    };

    int row_loops = n - k + 1, col_loops = m - l + 1;
    auto ans = vvi(row_loops, vi(col_loops, 0));
    for (int i = 0; i < row_loops; i++) {
        for (int j = 0; j < col_loops; j++) {
            ans[i][j] = tackle(i, j);
        }
    }

    // ---------------------------------------

    // 输出使用 '\n' 而不是 endl（endl 会强制刷新缓冲区，很慢）
    for (int i = 0; i < row_loops; i++) {
        for (int j = 0; j < col_loops; j++) {
            cout << ans[i][j] << ' ';
        }
        cout << '\n';
    }
    
    return 0;
}
