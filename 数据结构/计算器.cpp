#include <iostream>
#include <vector>
#include <string>
#include <cctype>
using namespace std;

class Solution {
private:
    string s;          // 存储输入字符串
    int where;         // 记录递归处理时的当前位置
    const int MAX_DEPTH = 10000; // 递归深度限制，防止栈溢出
    int cur_depth;     // 当前递归深度

    // 处理数字和运算符入栈，考虑运算符优先级
    void push(vector<long long>& nums, vector<char>& ops, long long cur_num, char cur_op) {
        if (ops.empty() || ops.back() == '+' || ops.back() == '-') {
            nums.push_back(cur_num);
            ops.push_back(cur_op);
        } else {
            // 处理乘除法的优先级
            if (ops.back() == '*') {
                nums.back() *= cur_num;
            } else { // 除法，向零取整（C++整数除法默认向零取整）
                nums.back() = static_cast<long long>(nums.back() / cur_num);
            }
            ops.back() = cur_op; // 更新运算符
        }
    }

    // 递归处理表达式，i是当前处理位置
    long long f(int i) {
        // 递归深度超限保护，避免栈溢出
        if (++cur_depth > MAX_DEPTH) {
            cur_depth--;
            return 0;
        }

        vector<long long> nums;  // 存储数字，预分配容量减少扩容
        vector<char> ops;
        nums.reserve(100);       // 预设容量，降低内存碎片
        ops.reserve(100);
        long long tmp = 0;       // 临时存储当前数字
        
        while (i < s.size() && s[i] != ')') {
            if (isdigit(s[i])) { // 解析数字
                tmp = tmp * 10 + (s[i] - '0');
                i++;
            } else if (s[i] == '+' || s[i] == '-' || s[i] == '*' || s[i] == '/') { // 遇到运算符
                push(nums, ops, tmp, s[i]);
                i++;
                tmp = 0;
            } else if (s[i] == '(') { // 遇到左括号，递归处理
                tmp = f(i + 1);
                // 边界检查：防止where越界导致无限循环
                if (where >= s.size()) {
                    break;
                }
                i = where + 1; // 跳转到括号后的位置
            } else { // 跳过空格
                i++;
            }
        }
        
        // 处理最后一个数字
        push(nums, ops, tmp, '+');
        where = i; // 更新位置信息
        cur_depth--; // 递归深度回退
        return compute(nums, ops);
    }

    // 计算加减法表达式
    long long compute(vector<long long>& nums, vector<char>& ops) {
        // 边界保护：空容器直接返回0
        if (nums.empty()) return 0;
        
        long long res = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            // 防越界：运算符数量应比数字少1
            if (i-1 >= ops.size()) break;
            if (ops[i-1] == '+') {
                res += nums[i];
            } else {
                res -= nums[i];
            }
        }
        return res;
    }

public:
    int calculate(string s) {
        this->s = s;
        where = 0;          // 重置位置
        cur_depth = 0;      // 重置递归深度
        return static_cast<int>(f(0));
    }
};
