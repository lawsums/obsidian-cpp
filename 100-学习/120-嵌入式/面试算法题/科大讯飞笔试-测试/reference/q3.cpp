#include <iostream>
#include <vector>
#include <algorithm>

int M, N;
std::vector<std::vector<int>> unchanged_grid;

int dfs(int r, int c) {
    if (r < 0 || r >= M || c < 0 || c >= N || unchanged_grid[r][c] == 0)
        return 0;

    unchanged_grid[r][c] = 0;
    int area = 1;
    area += dfs(r + 1, c);
    area += dfs(r - 1, c);
    area += dfs(r, c + 1);
    area += dfs(r, c - 1);
    return area;
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::cin >> M >> N;

    std::vector<std::vector<int>> original_image(M, std::vector<int>(N));
    for (int i = 0; i < M; ++i)
        for (int j = 0; j < N; ++j)
            std::cin >> original_image[i][j];

    unchanged_grid.assign(M, std::vector<int>(N, 0));
    for (int i = 0; i < M; ++i) {
        for (int j = 0; j < N; ++j) {
            int output_pixel;
            std::cin >> output_pixel;
            if (original_image[i][j] == output_pixel)
                unchanged_grid[i][j] = 1;
        }
    }

    int max_area = 0;
    for (int i = 0; i < M; ++i) {
        for (int j = 0; j < N; ++j) {
            if (unchanged_grid[i][j] == 1) {
                max_area = std::max(max_area, dfs(i, j));
            }
        }
    }

    std::cout << max_area << std::endl;
    return 0;
}
