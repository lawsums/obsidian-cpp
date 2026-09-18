// 参考实现 · 题目1：数组游戏——找出连胜 k 场的数字
// 笔记：[[笔试—深信服嵌入式软件开发笔试]]
// 输入：一行，n 个数字用空格隔开；前 n-1 个为数组 arr，第 n 个为 k
// 输出：赢得 k 个连续回合的数字
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <deque>      // 使用双端队列，在头部和尾部操作效率很高
#include <algorithm>  // 用于 std::max_element

int main() {
    // 1. 读取整行输入
    std::string line;
    std::getline(std::cin, line);

    // 2. 使用 stringstream 解析输入到 vector
    std::stringstream ss(line);
    int num;
    std::vector<int> numbers;
    while (ss >> num) {
        numbers.push_back(num);
    }

    // 3. 分离 k 和 arr
    int k = numbers.back();
    numbers.pop_back();

    int arr_size = numbers.size();

    // 4. 【重要优化】
    // 如果 k 远大于数组长度，我们不需要模拟。
    // 数组中的最大值最终会到达头部并连续击败所有其他 (arr_size - 1) 个元素。
    // 如果 k >= arr_size，获胜者必定是数组中的最大值。
    if (k >= arr_size) {
        std::cout << *std::max_element(numbers.begin(), numbers.end()) << std::endl;
        return 0;
    }

    // 5. 将数组元素放入双端队列 (deque) 以便高效模拟
    std::deque<int> dq(numbers.begin(), numbers.end());

    // 6. 开始模拟游戏
    int current_winner = -1;  // 记录当前的连胜者
    int consecutive_wins = 0; // 记录连胜次数

    while (true) {
        // 取出前两个元素
        int p1 = dq.front();
        dq.pop_front();
        int p2 = dq.front();
        dq.pop_front();

        int winner, loser;

        // 比较大小
        if (p1 > p2) {
            winner = p1;
            loser = p2;
        } else {
            winner = p2;
            loser = p1;
        }

        // 胜者放回队首，败者放到队尾
        dq.push_front(winner);
        dq.push_back(loser);

        // 7. 检查连胜
        if (winner == current_winner) {
            consecutive_wins++;
        } else {
            current_winner = winner;
            consecutive_wins = 1;
        }

        // 8. 检查游戏是否结束
        if (consecutive_wins == k) {
            std::cout << current_winner << std::endl;
            break; // 游戏结束
        }
    }

    return 0;
}
