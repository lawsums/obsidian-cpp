#include <bits/stdc++.h>
using namespace std;

#include <iostream>
#include <typeinfo>  // 包含 typeid 和 std::type_info

int main() {
    auto x = 10;
    decltype(x) y;
    const int a = 3;
    decltype(a) b = 5;

    // 打印 typeid(decltype(XXX)).name()
    std::cout << "decltype(x) = " << typeid(decltype(x)).name() << std::endl;
    std::cout << "decltype(a) = " << typeid(decltype(a)).name() << std::endl;
    std::cout << "decltype(y) = " << typeid(decltype(y)).name() << std::endl;
    std::cout << "decltype(b) = " << typeid(decltype(b)).name() << std::endl;

    return 0;
}
