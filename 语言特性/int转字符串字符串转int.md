
Int 转字符串 -> to_string

字符串转 int
1. Stoi
2. Stol
3. Stoll
4. Stoull


在C++中，`int` 与字符串的转换主要依赖标准库函数，核心差异体现在**转换方向**和**目标/源类型的范围适配**上，以下是简要解析：


### 一、int 转字符串：`to_string()`
- **功能**：将整数类型（包括`int`、`long`、`long long`、`unsigned int`等）转换为对应的`std::string`。
- **适用场景**：需将`int`值转为字符串用于拼接、输出等场景（如把`int a = 123`转成`"123"`）。
- **示例**：
  ```cpp
  int num = 456;
  std::string str = std::to_string(num); // str 结果为 "456"
  ```
- **特点**：用法简单，无需手动处理格式，返回值直接是`std::string`，避免C语言`sprintf`的缓冲区问题。


### 二、字符串转 int 相关函数（4个核心函数）
这4个函数均定义在`<string>`头文件中，功能是将`std::string`（或C风格字符串）转为整数类型，但**支持的目标类型范围不同**，需根据实际需求选择，避免溢出。

| 函数名      | 目标类型                 | 适用场景（字符串内容）                 | 关键特点                                          |
| -------- | -------------------- | --------------------------- | --------------------------------------------- |
| `stoi`   | `int`                | 字符串表示的整数在`int`范围内（通常±21亿左右） | 最常用，超出范围会抛异常                                  |
| `stol`   | `long`               | 字符串整数超出`int`但在`long`范围内     | 范围比`int`大（如32位系统`long`同`int`，64位系统`long`为64位） |
| `stoll`  | `long long`          | 字符串整数是64位有符号整数（±9e18）       | 处理大整数（如身份证号、大ID）                              |
| `stoull` | `unsigned long long` | 字符串整数是64位无符号整数（0~1.8e19）    | 仅用于无符号大整数，避免负数                                |

- **示例**：
  ```cpp
  #include <iostream>
  #include <string>
  using namespace std;
  
  std::string s1 = "12345";
  std::string s2 = "9876543210123"; // 超出int范围，需用stoll
  std::string s3 = "18446744073709551615"; // 64位无符号最大值，用stoull

  int a = std::stoi(s1);          // 正确，a=12345
  long long b = std::stoll(s2);   // 正确，b=9876543210123
  unsigned long long c = std::stoull(s3); // 正确，c=18446744073709551615
  
  cout << s1 << endl; 
  cout << s2 << endl; 
  cout << s3 << endl; 
  ```
- **注意**：若字符串内容非有效整数（如 `"12a3"`）或超出目标类型范围，会抛出 `std::invalid_argument`（无效格式）或 `std::out_of_range`（溢出）异常，需注意捕获。

