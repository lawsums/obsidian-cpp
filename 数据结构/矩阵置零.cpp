
class Solution {
private:
    vector<bool> rows;
    vector<bool> cols;

public:
    void setZeroes(vector<vector<int>>& matrix) {
        int n = matrix.size(), m = matrix[0].size();
        rows.assign(n, false);
        cols.assign(m, false);

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if (matrix[i][j] == 0) {
                    rows[i] = true;
                    cols[j] = true;
                }
            }
        }

        
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if ((rows[i] || cols[j]) && matrix[i][j] != 0) {
                    matrix[i][j] = 0;
                }
            }
        }
    }
};

