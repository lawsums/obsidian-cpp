// 验证IP地址

#include <bits/stdc++.h>
using namespace std;

class Solution {
private:
    // vector<string> path;

public:
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 验证IP地址
     * @param IP string字符串 一个IP地址字符串
     * @return string字符串
     */
    string solve(string IP) {
        if (isIPv4(IP)) return "IPv4";
        if (isIPv6(IP)) return "IPv6";
        return "Neither";
    }

    bool isIPv4(string &IP) {
        auto legal = [](string &s) {
            // 1. 空字符串 或 长度超过3 → 非法
            if (s.empty() || s.size() > 3) return false;
            // 2. 检查所有字符是否都是数字:
            for (char c: s) {
                if (!isdigit(c)) return false;
            }
            if (s.size() > 1 && s[0] == '0') return false;// 不能有前导零
            int num = stoi(s);
            if (!(0 <= num && num <= 255)) {
                return false;
            }
            return true;
        };

        string tmp = "";
        vector<string> path;
        for (int i = 0; i < IP.size(); i++) {
            // 如果遇到了'.',判断一下tmp的有效性,如果有效就加入path
            if (IP[i] == '.') {
                if (legal(tmp)) path.push_back(tmp);
                tmp = "";
            } else {
                tmp.push_back(IP[i]);
            }
        }

        if (legal(tmp)) {
            path.push_back(tmp);
        }

        if (path.size() == 4) {
            return true;
        } else {
            return false;
        }
    }

    bool isIPv6(string &IP) {
        auto legal = [](string &s) {
            cout << "s = " << s << endl;
            if (s.empty() || s.size() > 4) {
                return false;
            }// 默认格式16bit,即四个hex数
            for (int i = 0; i < s.size(); i++) {
                if (!(('0' <= s[i] && s[i] <= '9') || ('a' <= s[i] && s[i] <= 'f') ||
                      ('A' <= s[i] && s[i] <= 'F'))) {
                    return false;
                }
            }
            return true;
        };

        int cnt = 1;
        string tmp = "";
        vector<string> path;

        for (int i = 0; i < IP.size(); i++) {
            // 如果遇到了'.',判断一下tmp的有效性,如果有效就加入path
            if (IP[i] == ':') {
                cnt++;
                if (legal(tmp)) path.push_back(tmp);
                tmp = "";
            } else {
                tmp.push_back(IP[i]);
            }
        }

        if (legal(tmp)) {
            path.push_back(tmp);
        }

        if (path.size() == 8 && cnt == 8) {
            return true;
        } else {
            return false;
        }
    }
};
