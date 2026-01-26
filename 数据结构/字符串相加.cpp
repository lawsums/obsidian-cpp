class Solution {
public:
    string addStrings(string num1, string num2) {
        reverse(num1.begin(), num1.end());
        reverse(num2.begin(), num2.end());
        
        int n1 = num1.size(), n2 = num2.size();
        string ans;
        ans.reserve(max(n1, n2) + 1);  // 预分配空间，避免多次重新分配
        
        int carry = 0;
        for (int i = 0; i < max(n1, n2) || carry; i++) {
            int cur = carry;
            if (i < n1) cur += num1[i] - '0';
            if (i < n2) cur += num2[i] - '0';
            carry = cur / 10;
            ans.push_back('0' + (cur % 10));
        }
        
        reverse(ans.begin(), ans.end());
        return ans;
    }
};
