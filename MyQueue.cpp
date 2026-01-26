#include <sstream>
#include <queue>
#include <string>
#include <vector>
#include <iostream>
using namespace std;

class MyQueue {
  private:
    vector<int> q;
    int l = 0, r = 0;


  public:
    MyQueue() {
        q.assign(10'001, 0);
    }

    int size() {
        cout << r - l << endl;
        return r - l;
    }

    void push(int val) {
        q[r++] = val;
    }

    int top() {
        if (r - l == 0) {
            cout << "ERR_CANNOT_QUERY" << endl;
            return -1;
        }
        cout << q[l] << endl;
        return q[l];
    }

    int pop() {
        if (r - l == 0) {
            cout << "ERR_CANNOT_POP" << endl;
            return -1;
        }
        return q[l++];
    }

};

int main() {
    MyQueue q;
    int n;
    cin >> n;
    cin.ignore(); // 忽略换行符

    for (int i = 0; i < n; i++) {
        string line;
        getline(cin, line);
        stringstream ss(line);
        vector<int> query;
        int tmp;
        while (ss >> tmp) {
            query.push_back(tmp);
        }

        // cout << "[ ";
        // for (const auto& elem : query) cout << elem << ", ";
        // cout << "] " << endl;

        if (query[0] == 1) {
            q.push(query[1]);
        } else if (query[0] == 2) {
            q.pop();
        } else if (query[0] == 3) {
            q.top();
        } else if (query[0] == 4) {
            q.size();
        }
    }
    return 0;
}
// 64 位输出请用 printf("%lld")