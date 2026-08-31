#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <map>
#include <cmath>
#include <cctype>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin >> n;
    cin.ignore();

    vector<map<string, int>> experiments;
    vector<double> energies;
    map<string, int> particle_to_col;
    int next_col_idx = 0;

    for (int i = 0; i < n; ++i) {
        string line;
        getline(cin, line);
        stringstream ss(line);

        map<string, int> counts;
        string particle_name;
        int count;
        bool has_iflytek = false;

        while (ss >> particle_name && !(isdigit(particle_name[0]) || (particle_name[0] == '-' && particle_name.length() > 1))) {
            ss >> count;
            counts[particle_name] = count;
            if (particle_name == "iflytek") has_iflytek = true;
        }

        if (has_iflytek) {
            experiments.push_back(counts);
            energies.push_back(stod(particle_name));
            for (auto const& [name, val] : counts) {
                if (particle_to_col.find(name) == particle_to_col.end())
                    particle_to_col[name] = next_col_idx++;
            }
        }
    }

    if (particle_to_col.find("iflytek") == particle_to_col.end()) {
        cout << -1 << endl;
        return 0;
    }

    int num_equations = experiments.size();
    int num_variables = particle_to_col.size();

    if (num_equations < num_variables) {
        cout << -1 << endl;
        return 0;
    }

    vector<vector<double>> matrix(num_equations, vector<double>(num_variables + 1, 0.0));
    for (int i = 0; i < num_equations; ++i) {
        for (auto const& [name, count] : experiments[i])
            matrix[i][particle_to_col[name]] = count;
        matrix[i][num_variables] = energies[i];
    }

    int rank = 0;
    for (int j = 0; j < num_variables && rank < num_equations; ++j) {
        int pivot = rank;
        for (int i = rank + 1; i < num_equations; ++i)
            if (abs(matrix[i][j]) > abs(matrix[pivot][j])) pivot = i;
        swap(matrix[rank], matrix[pivot]);

        if (abs(matrix[rank][j]) < 1e-9) continue;

        for (int i = rank + 1; i < num_equations; ++i) {
            double factor = matrix[i][j] / matrix[rank][j];
            for (int k = j; k <= num_variables; ++k)
                matrix[i][k] -= factor * matrix[rank][k];
        }
        rank++;
    }

    if (rank < num_variables) {
        cout << -1 << endl;
        return 0;
    }

    for (int i = rank; i < num_equations; ++i)
        if (abs(matrix[i][num_variables]) > 1e-9) {
            cout << -1 << endl;
            return 0;
        }

    vector<double> solution(num_variables);
    for (int i = num_variables - 1; i >= 0; --i) {
        double sum = 0.0;
        for (int j = i + 1; j < num_variables; ++j)
            sum += matrix[i][j] * solution[j];

        int pivot_col = -1;
        for (int k = 0; k < num_variables; ++k)
            if (abs(matrix[i][k]) > 1e-9) { pivot_col = k; break; }

        solution[pivot_col] = (matrix[i][num_variables] - sum) / matrix[i][pivot_col];
    }

    int iflytek_col = particle_to_col["iflytek"];
    cout << static_cast<long long>(round(solution[iflytek_col])) << endl;

    return 0;
}
