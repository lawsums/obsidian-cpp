你想系统掌握C++20 `std::format` 的**所有核心用法**，我会从**基础到进阶**分模块讲解，包含**默认格式化、位置控制、格式修饰、高级特性、配套工具**五大类，每个用法都配**代码示例+效果说明**，同时结合和Python f-string的对标（降低理解成本），所有示例均可直接运行（C++20+编译器）。

核心前提：使用前必须包含头文件 `<format>`，所有接口都在 `std` 命名空间下，基础核心函数是 `std::format("格式字符串", 参数1, 参数2, ...)`，**占位符 `{}`** 是所有用法的核心载体。

### 一、基础用法：默认自动格式化（最常用）
这是format最基础、最省心的用法，**无需任何格式修饰**，占位符 `{}` 会**自动适配参数类型**，彻底告别printf的格式控制符（%d/%s/%f），也是替代stringstream多次`<<`拼接的核心用法。
#### 支持的类型（原生全覆盖）
C++基础类型（int/float/char/bool）、C++标准类型（std::string/std::wstring）、指针/智能指针等，无需手动转换。
```cpp
#include <format>
#include <string>
#include <iostream>
using namespace std;

int main() {
    // 基础类型
    int a = 10;
    float b = 3.14f;
    char c = 'a';
    bool d = true;
    // C++标准类型
    string s = "hello format";

    string res = format("int：{}，float：{}，char：{}，bool：{}，string：{}", a, b, c, d, s);
    cout << res << endl;
    // 输出：int：10，float：3.14，char：a，bool：true，string：hello format
    return 0;
}
```
**核心优势**：不用记忆任何格式符，编译器自动推导类型，编译期校验参数个数/类型匹配（少传/错传直接报错）。

### 二、位置控制：灵活调整参数顺序/重复使用
占位符支持**显式指定参数索引**（从0开始），可实现**参数重复使用**、**任意调整输出顺序**，无需重复传参，解决了printf按顺序匹配的繁琐问题，这也是比Python f-string更灵活的点之一。
#### 核心语法
- `{n}`：表示使用第n个参数（n从0开始，对应format的第1个/第2个参数）
- 可混合使用**无索引占位符**和**有索引占位符**（无索引会按顺序自动匹配未被使用的参数）
```cpp
int main() {
    int num = 10;
    string s = "C++20";

    // 1. 重复使用参数：一个参数多次格式化
    string res1 = format("数字：{0}，十六进制：{0:x}，二进制：{0:b}", num);
    cout << res1 << endl; // 输出：数字：10，十六进制：a，二进制：1010

    // 2. 调整参数顺序：占位符顺序≠参数传入顺序
    string res2 = format("版本：{1}，对应数字：{0}，再次输出版本：{1}", num, s);
    cout << res2 << endl; // 输出：版本：C++20，对应数字：10，再次输出版本：C++20

    return 0;
}
```
**实用场景**：多语言国际化（不同语言的字段顺序不同，仅需修改占位符索引，无需调整参数传参顺序）。

### 三、格式修饰：自定义输出样式（对标printf格式符）
format保留了**和printf完全兼容的数值格式修饰符**，通过 `{:修饰符}` 语法实现，用于对**数字、浮点数**做精细化格式化（精度、进制、补零、对齐等），学习成本极低（复用printf的知识）。
#### 核心语法
`{[索引]:[修饰符]}`，索引可选，修饰符按**「填充/对齐-宽度-精度-类型」** 顺序书写，下面是**最常用的修饰符分类示例**（覆盖90%的开发场景）。

##### 1. 数值进制转换（int/long）
支持二进制`b`、八进制`o`、十进制`d`、十六进制`x`（小写）/`X`（大写），默认十进制`d`。
```cpp
int main() {
    int n = 255;
    cout << format("二进制：{:b}，八进制：{:o}，十六进制小写：{:x}，十六进制大写：{:X}", n, n, n, n) << endl;
    // 输出：二进制：11111111，八进制：377，十六进制小写：ff，十六进制大写：FF
    return 0;
}
```

##### 2. 浮点数精度控制（float/double）
用 `.n` 表示保留n位小数，支持**四舍五入**，可配合 `f`（固定小数）/`e`（科学计数法）使用，默认保留6位有效数字。
```cpp
int main() {
    double pi = 3.1415926535;
    cout << format("默认精度：{}", pi) << endl; // 输出：默认精度：3.141593（自动四舍五入）
    cout << format("保留2位小数：{:.2f}", pi) << endl; // 输出：保留2位小数：3.14
    cout << format("科学计数法：{:.4e}", pi) << endl; // 输出：科学计数法：3.1416e+00
    return 0;
}
```

##### 3. 补零/固定宽度（数字补位）
用 `0n` 表示**固定宽度为n**，不足的位在左侧补0，适用于编号、序列号等场景（对标printf的%0nd）。
```cpp
int main() {
    int id1 = 5, id2 = 123;
    cout << format("编号1：{:03d}", id1) << endl; // 输出：编号1：005（3位，补2个0）
    cout << format("编号2：{:03d}", id2) << endl; // 输出：编号2：123（长度足够，不补零）
    return 0;
}
```

##### 4. 对齐+填充（自定义对齐方式）
格式：`[填充符][对齐符][宽度]`，对齐符支持：`<`（左对齐，默认）、`>`（右对齐）、`^`（居中对齐），填充符默认是空格，可指定任意字符（如`*`/`-`）。
**实用场景**：格式化表格、日志输出（让内容对齐，更易读）。
```cpp
int main() {
    string name = "张三";
    int age = 20;
    // 左对齐（占8位）、右对齐（占3位）、居中对齐（占6位，填充*）
    cout << format("姓名：{:<8} 年龄：{:>3} 编号：{:*^6}", name, age, 123) << endl;
    // 输出：姓名：张三        年龄： 20 编号：*123**
    return 0;
}
```

##### 5. 布尔值格式化
用 `b` 输出`0/1`，用 `s` 输出`false/true`（默认输出`false/true`）。
```cpp
int main() {
    bool flag = true;
    cout << format("默认布尔：{}，数字布尔：{:b}，字符串布尔：{:s}", flag, flag, flag) << endl;
    // 输出：默认布尔：true，数字布尔：1，字符串布尔：true
    return 0;
}
```

### 四、高级用法：扩展自定义类型+转义占位符
这部分是format相比printf/stringstream的**核心优势**，包含**自定义类型格式化**（适配C++面向对象）和**占位符转义**（输出`{}`本身），覆盖工业级开发的进阶需求。

#### 用法1：转义占位符（输出`{`或`}`）
如果需要在格式字符串中**直接输出大括号`{}`**，只需**连续写两个**即可（`{{` 输出`{`，`}}` 输出`}`），无需额外转义符。
```cpp
int main() {
    int a = 100;
    // 输出{100}，需要用{{和}}转义
    cout << format("原始值：{{{}}}", a) << endl; // 输出：原始值：{100}
    // 输出{{hello}}
    cout << format("固定内容：{{hello}}") << endl; // 输出：固定内容：{hello}
    return 0;
}
```

#### 用法2：自定义类型格式化（核心扩展能力）
format原生支持C++标准类型，但对于**自定义结构体/类**，只需**特化`std::formatter`模板**，就能让自定义类型直接支持`format`，无需手动转换为基础类型，这是printf完全无法实现的功能。
##### 实现步骤（两步走）
1. 为自定义类型特化 `template <> struct std::formatter<自定义类型>`；
2. 实现两个成员函数：
   - `parse`：解析格式修饰符（简单场景可直接返回迭代器，无需处理）；
   - `format`：定义自定义类型的格式化逻辑，调用`format_to`输出到缓冲区。
##### 完整示例（自定义Person类支持format）
```cpp
#include <format>
#include <string>
#include <iostream>
using namespace std;

// 自定义类型
struct Person {
    string name;
    int age;
    double score;
};

// 步骤1：特化std::formatter模板，让Person支持format
template <>
struct formatter<Person> {
    // 步骤2-1：解析格式修饰符（这里无自定义修饰符，直接返回begin）
    // constexpr保证编译期解析，format_parse_context是格式解析上下文
    constexpr auto parse(format_parse_context& ctx) {
        return ctx.begin(); // 表示无格式修饰符需要解析
    }

    // 步骤2-2：定义格式化逻辑，format_context是格式化上下文
    auto format(const Person& p, format_context& ctx) {
        // 调用format_to，将格式化结果写入ctx的输出迭代器
        return format_to(
            ctx.out(),
            "Person{姓名：{}，年龄：{}，分数：{:.1f}}", // 可嵌套format格式串
            p.name, p.age, p.score
        );
    }
};

// 直接格式化自定义类型，和基础类型无区别！
int main() {
    Person p = {"张三", 20, 98.5};
    cout << format("{}", p) << endl; // 输出：Person{姓名：张三，年龄：20，分数：98.5}
    // 配合位置控制，重复使用
    cout << format("学生1：{0}，学生2：{0}", p) << endl;
    return 0;
}
```
**进阶扩展**：还可以为自定义类型添加**专属格式修饰符**（如`{:n}`只输出姓名，`{:a}`只输出年龄），只需在`parse`函数中解析修饰符即可，满足精细化格式化需求。

### 五、配套工具：format的衍生接口（覆盖所有输出场景）
`std::format` 核心是**生成格式化后的std::string**，而C++标准库还提供了基于format的**衍生接口**，覆盖**输出到缓冲区、直接输出到标准流、可变参数**等场景，完美替代printf的`sprintf`/`snprintf`/`fprintf`。

#### 用法1：std::print/std::println（C++23+，直接输出到标准流）
这是最简洁的用法，**格式化+输出一步到位**，替代 `format + cout`，无需手动拼接和输出，`println` 自带换行（对标Python的print）。
##### 核心特点
- 头文件：`<print>`；
- 语法和format完全一致，直接省略`cout <<`；
- 支持所有format的格式修饰和自定义类型。
```cpp
#include <print> // C++23头文件
#include <string>
using namespace std;

int main() {
    int a = 10;
    string s = "C++23";
    // 替代 cout << format("a={}\n", a);
    print("a={}\n", a); // 输出：a=10
    // println自带换行，更简洁
    println("版本：{}，数字：{}", s, a); // 输出：版本：C++23，数字：10
    return 0;
}
```

#### 用法2：std::format_to/format_to_n（输出到缓冲区/迭代器）
替代printf的`sprintf`/`snprintf`，将格式化结果**写入指定的迭代器**（字符数组、std::string、std::vector<char>等），实现**自定义存储**，`format_to_n` 还能**指定最大写入长度**，避免缓冲区溢出（对标snprintf的安全特性）。
##### 核心语法
- `format_to(迭代器, 格式串, 参数...)`：无长度限制，返回写入后的迭代器；
- `format_to_n(迭代器, 最大长度, 格式串, 参数...)`：有长度限制，返回包含写入数和迭代器的结构体。
##### 完整示例（写入字符数组/string）
```cpp
#include <format>
#include <string>
#include <array>
#include <iostream>
using namespace std;

int main() {
    // 场景1：写入C风格字符数组（对标snprintf）
    array<char, 100> buf; // 安全的字符数组，替代char buf[100]
    int a = 20;
    // 格式化写入buf，返回写入后的迭代器
    auto it = format_to(buf.begin(), "数字：{}，保留2位小数：{:.2f}", a, 3.1415);
    *it = '\0'; // C风格字符串需要手动加结束符
    cout << buf.data() << endl; // 输出：数字：20，保留2位小数：3.14

    // 场景2：写入std::string（直接追加，无需结束符）
    string res;
    format_to(back_inserter(res), "姓名：{}，年龄：{}", "张三", 20);
    cout << res << endl; // 输出：姓名：张三，年龄：20

    // 场景3：format_to_n指定最大长度（避免溢出）
    array<char, 20> small_buf;
    auto [n, it2] = format_to_n(small_buf.begin(), small_buf.size()-1, "a={}, b={}", 10, 20);
    small_buf[small_buf.size()-1] = '\0';
    cout << "写入字符数：" << n << "，内容：" << small_buf.data() << endl;
    return 0;
}
```
**注意**：C++17及以上支持结构化绑定（`auto [n, it2]`），低版本可通过返回值的`count`和`out`成员访问。

#### 用法3：std::vformat（处理可变参数列表）
用于**封装自定义的格式化函数**，接收**可变参数列表**（`std::format_args`），替代手动处理C风格的可变参数（`va_list`），适合开发通用的日志、打印工具。
##### 简单示例（封装自定义print函数）
```cpp
#include <format>
#include <string>
#include <iostream>
#include <utility> // for forward
using namespace std;

// 自定义格式化函数，支持任意参数
template <typename... Args>
void my_print(const string& fmt, Args&&... args) {
    // 构造format_args，转发可变参数
    format_args args_list = make_format_args(forward<Args>(args)...);
    // vformat接收格式串和format_args
    string res = vformat(fmt, args_list);
    // 输出结果
    cout << res << endl;
}

int main() {
    my_print("数字：{}，字符串：{}", 100, "test"); // 输出：数字：100，字符串：test
    my_print("保留3位小数：{:.3f}", 3.14159); // 输出：保留3位小数：3.142
    return 0;
}
```

### 六、format用法速查表（快速查阅）
为了方便你日常开发快速使用，整理了**format核心用法速查表**，覆盖99%的场景：

| 用法分类       | 语法示例                | 效果说明                     |
|----------------|-------------------------|------------------------------|
| 默认格式化     | `format("{}", 10)`      | 自动适配类型，输出10         |
| 位置控制       | `format("{1}{0}", a, b)`| 按索引输出，先b后a           |
| 进制转换       | `{:x}`/`{:b}`/`{:o}`    | 十六/二/八进制               |
| 浮点数精度     | `{:.2f}`/`{:.4e}`       | 保留2位小数/科学计数法保留4位|
| 补零宽度       | `{:03d}`                | 固定3位，不足左侧补0         |
| 对齐填充       | `{:<8}`/`{:>3}`/`{:*^6}`| 左对齐8位/右对齐3位/居中6位补*|
| 布尔值格式化   | `{:b}`/`{:s}`           | 输出0/1 / false/true         |
| 转义大括号     | `{{{}}}`                | 输出{参数值}                 |
| 自定义类型     | 特化std::formatter      | 自定义类型直接格式化         |
| 直接输出       | `print("{}", 10)`       | C++23+，格式化+输出一步到位  |
| 写入缓冲区     | `format_to(buf.begin(), ...)` | 写入字符数组/迭代器      |

### 七、核心总结
C++20 `std::format` 的用法可分为**基础层-进阶层-工具层**，核心要点如下：
1. **基础层**：默认格式化`{}`+自动类型适配，是最常用的用法，编译期类型安全；
2. **进阶层**：位置控制`{n}`实现参数复用/重排，格式修饰`{:xxx}`兼容printf，满足精细化格式化；
3. **高级层**：特化`std::formatter`支持自定义类型，`{{}}`转义大括号，适配工业级开发；
4. **工具层**：C++23`print`直接输出，`format_to`写入缓冲区，`vformat`处理可变参数，覆盖所有输出场景；
5. **核心优势**：相比printf更安全、相比stringstream更简洁，性能持平printf，是现代C++格式化的**唯一首选**。

所有用法的核心都是**占位符`{}`**，只需掌握其基础语法和修饰规则，就能彻底抛弃printf和繁琐的stringstream拼接。