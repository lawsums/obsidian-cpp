
// 嵌套模式
class Solution {
private:
    int max_size;
    int n, m;
    string version1;
    string version2;

public:
    int compareVersion(string version1, string version2) {
        this->version1 = string(version1.begin(), version1.end());
        this->version2 = string(version2.begin(), version2.end());
        n = version1.size(), m = version2.size();
        max_size = max(n, m); 
         
        return f(0, 0);

    }

    int f(int i, int j) {

        int num1 = 0, num2 = 0;
        while (i < n && version1[i] != '.') {
            num1 = num1 * 10 + (version1[i++] - '0');
        }
        while (j < m && version2[j] != '.') {
            num2 = num2 * 10 + (version2[j++] - '0');
        }

        if (num1 < num2) {
            return -1;
        } else if (num1 > num2) {
            return 1;
        }    

        if (i < max_size && j < max_size) {
            return f(i + 1, j + 1);
        } 
        return 0;
    }
};

// 循环模式, 因为其实不需要回来, 所以不用嵌套也可以
class Solution {
public:
    int compareVersion(string version1, string version2) {
        int i = 0, j = 0;
        int n = version1.size(), m = version2.size();
        
        while (i < n || j < m) {
            int num1 = 0, num2 = 0;
            
            // 解析 version1 的当前段
            while (i < n && version1[i] != '.') {
                num1 = num1 * 10 + (version1[i++] - '0');
            }
            
            // 解析 version2 的当前段
            while (j < m && version2[j] != '.') {
                num2 = num2 * 10 + (version2[j++] - '0');
            }
            
            // 比较当前段
            if (num1 < num2) return -1;
            if (num1 > num2) return 1;
            
            // 跳过点号，继续下一段
            i++;
            j++;
        }
        
        return 0;
    }
};
