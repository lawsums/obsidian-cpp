

```cpp
#include <iostream>
#include <cmath>
using namespace std;

// 点结构体
struct Point {
    float x, y;
    Point(float x=0, float y=0) : x(x), y(y) {}
};

// 计算三角形面积的2倍（省略除以2，减少运算）
float area2(const Point& a, const Point& b, const Point& c) {
    // 向量叉积的绝对值（面积的2倍，避免除法）
    return fabs( (b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x) );
}

// 判断点p是否在三角形abc内（含边界）
bool isInTriangle(const Point& a, const Point& b, const Point& c, const Point& p) {
    float total = area2(a, b, c);                  // 原三角形面积的2倍
    float sum = area2(a, b, p) + area2(b, c, p) + area2(c, a, p);  // 三个小三角形面积的2倍之和
    // 允许微小误差（因浮点数精度问题）
    return fabs(total - sum) < 1e-6;
}

// 测试
int main() {
    Point a(0,0), b(4,0), c(2,4);
    Point p1(2,2), p2(5,2);
    cout << boolalpha;
    cout << isInTriangle(a,b,c,p1) << endl;  // 输出true（内部）
    cout << isInTriangle(a,b,c,p2) << endl;  // 输出false（外部）
    return 0;
}
```
