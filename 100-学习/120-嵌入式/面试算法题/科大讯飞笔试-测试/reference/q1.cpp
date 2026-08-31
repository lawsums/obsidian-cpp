#include <iostream>
#include <vector>
#include <algorithm>

void printMatrix(const std::vector<std::vector<int>>& matrix) {
    for (size_t r = 0; r < matrix.size(); ++r) {
        for (size_t c = 0; c < matrix[r].size(); ++c) {
            std::cout << matrix[r][c] << (c == matrix[r].size() - 1 ? "" : " ");
        }
        std::cout << std::endl;
    }
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    int M, N, K_rows, L_cols;
    std::cin >> M >> N >> K_rows >> L_cols;

    std::vector<std::vector<int>> inputMatrix(M, std::vector<int>(N));
    for (int i = 0; i < M; ++i)
        for (int j = 0; j < N; ++j)
            std::cin >> inputMatrix[i][j];

    std::vector<std::vector<int>> kernelMatrix(K_rows, std::vector<int>(L_cols));
    for (int i = 0; i < K_rows; ++i)
        for (int j = 0; j < L_cols; ++j)
            std::cin >> kernelMatrix[i][j];

    std::vector<std::vector<int>> outputMatrix(M, std::vector<int>(N));
    int centerX = L_cols / 2;
    int centerY = K_rows / 2;

    for (int r = 0; r < M; ++r) {
        for (int c = 0; c < N; ++c) {
            int sum = 0;
            for (int kr = 0; kr < K_rows; ++kr) {
                for (int kc = 0; kc < L_cols; ++kc) {
                    int input_r = r + (kr - centerY);
                    int input_c = c + (kc - centerX);
                    if (input_r >= 0 && input_r < M && input_c >= 0 && input_c < N) {
                        sum += inputMatrix[input_r][input_c] * kernelMatrix[kr][kc];
                    }
                }
            }
            sum = std::max(0, std::min(255, sum));
            outputMatrix[r][c] = sum;
        }
    }

    printMatrix(outputMatrix);
    return 0;
}
