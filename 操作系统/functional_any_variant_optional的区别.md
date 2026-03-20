
DECK: 面试题

## functional_any_variant_optional的区别

### 1. std::optional
## 标准答案
std::optional 是处理「单一类型可选值」的类型安全容器，核心解决“用魔法值（-1/NULL）表示空值”的问题，特性是仅存储指定类型值或无值（std::nullopt），编译期类型安全且无额外运行时开销。

## TODO
1. 为什么用 std::optional 比返回 -1/NULL 更安全？
2. std::optional 的 value_or 方法和直接判空后取值有什么区别？

## 应用场景
**场景**：实现一个“查找文件路径中扩展名”的函数。
- 不用 std::optional：只能返回空字符串（""）或特殊值（如 "none"）表示无扩展名，调用方需额外判断特殊值，易误判（比如文件名本身就是 "none"）；
- 用 std::optional：函数返回 std::optional<std::string>，有扩展名则返回对应字符串，无则返回 std::nullopt，调用方可通过 has_value() 明确判断，类型安全且逻辑清晰。
```cpp
std::optional<std::string> get_extension(const std::string& path) {
    size_t dot_pos = path.find_last_of('.');
    if (dot_pos == std::string::npos || dot_pos == path.length()-1) {
        return std::nullopt;
    }
    return path.substr(dot_pos+1);
}
// 调用：明确判断，无歧义
auto ext = get_extension("test.txt");
if (ext) {
    std::cout << "扩展名：" << *ext << std::endl; // 输出 txt
}
auto ext2 = get_extension("test");
std::cout << "扩展名：" << ext2.value_or("无") << std::endl; // 输出 无
```

---

### 2. std::variant
## 标准答案
std::variant 是 C++ 类型安全的联合体，核心解决“C语言union类型不安全、无类型检查”的问题，特性是仅存储预定义的一组类型中的一个，编译期确定类型范围，可通过 std::visit/std::holds_alternative 安全访问。

## TODO
1. std::variant 和 C 语言 union 相比，核心安全优势是什么？
2. 为什么遍历 std::variant 推荐用 std::visit 而非多次 std::holds_alternative？

## 应用场景
**场景**：解析简单的配置项（值仅支持 int/string/bool 三种类型）。
- 不用 std::variant：用 C 语言 union 存储，需手动维护“类型标记”（如 enum），易出现类型不匹配（比如存 int 却取 string），编译期无法检查；
- 用 std::variant：定义 using ConfigValue = std::variant<int, std::string, bool>，编译器强制检查类型，访问时可自动匹配类型，避免手动维护类型标记的错误。
```cpp
using ConfigValue = std::variant<int, std::string, bool>;
void parse_config(const std::string& key, const ConfigValue& val) {
    std::visit([&key](auto&& arg) {
        std::cout << "配置项[" << key << "]：";
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, int>) {
            std::cout << "数字-" << arg << std::endl;
        } else if constexpr (std::is_same_v<T, std::string>) {
            std::cout << "字符串-" << arg << std::endl;
        } else if constexpr (std::is_same_v<T, bool>) {
            std::cout << "布尔-" << (arg ? "true" : "false") << std::endl;
        }
    }, val);
}
// 调用：类型安全，编译期检查
parse_config("timeout", 5000);    // 输出 配置项[timeout]：数字-5000
parse_config("name", "app");      // 输出 配置项[name]：字符串-app
parse_config("debug", true);      // 输出 配置项[debug]：布尔-true
```

---

### 3. std::any
## 标准答案
std::any 是存储任意类型值的动态容器，核心解决“需要存储完全未知类型值”的问题，特性是运行时类型擦除、可存储任意类型，需通过 std::any_cast 安全转换，有轻微运行时开销。

## TODO
1. std::any 和 std::variant 如何选择？为什么优先用 std::variant？
2. 用 std::any_cast 指针方式转换和直接转换有什么区别？

## 应用场景
**场景**：实现一个简单的脚本交互接口（接收脚本传入的任意类型参数）。
- 不用 std::any：需定义多个重载函数（handle_int/handle_string/handle_bool），新增类型需修改代码；
- 用 std::any：只需一个接口接收 std::any 类型参数，运行时判断类型并处理，兼容任意类型，适配脚本动态类型特性。
```cpp
void handle_script_arg(const std::any& arg) {
    // 指针方式转换，避免异常
    if (auto* i = std::any_cast<int>(&arg)) {
        std::cout << "脚本传入整数：" << *i << std::endl;
    } else if (auto* s = std::any_cast<std::string>(&arg)) {
        std::cout << "脚本传入字符串：" << *s << std::endl;
    } else if (auto* b = std::any_cast<bool>(&arg)) {
        std::cout << "脚本传入布尔：" << *b << std::endl;
    } else {
        std::cout << "未知类型参数" << std::endl;
    }
}
// 调用：兼容任意类型，适配脚本动态传参
handle_script_arg(100);                // 输出 脚本传入整数：100
handle_script_arg(std::string("test"));// 输出 脚本传入字符串：test
handle_script_arg(true);               // 输出 脚本传入布尔：1
```

---

### 4. std::function
## 标准答案
std::function 是可调用对象的通用包装器，核心解决“函数指针灵活性差、无法存储带捕获的lambda”的问题，特性是类型擦除、兼容任意匹配签名的可调用对象（函数/lambda/成员函数），有轻微运行时多态开销。

## TODO
1. std::function 和普通函数指针相比，核心优势是什么？
2. 为什么 std::function 能存储带捕获的 lambda，而函数指针不行？

## 应用场景
**场景**：实现一个异步任务回调系统（支持注册任意类型的回调函数）。
- 不用 std::function：只能用函数指针存储回调，无法捕获外部变量（比如回调需要用到的任务名称），需通过全局变量传递，代码耦合高；
- 用 std::function：可存储带捕获的 lambda、普通函数、成员函数，灵活注册回调，无需全局变量，代码解耦。
```cpp
using TaskCallback = std::function<void(bool /*success*/)>;
void run_async_task(const std::string& task_name, TaskCallback cb) {
    // 模拟异步任务执行完成
    bool success = true; // 假设任务执行成功
    std::cout << "异步任务[" << task_name << "]执行完成" << std::endl;
    cb(success); // 触发回调
}
// 调用：灵活注册不同类型的回调
// 1. 带捕获的lambda回调
std::string log_prefix = "任务日志：";
run_async_task("文件下载", [&log_prefix](bool success) {
    std::cout << log_prefix << (success ? "下载成功" : "下载失败") << std::endl;
});
// 2. 普通函数回调
void task_finish(bool success) {
    std::cout << "普通函数回调：任务" << (success ? "成功" : "失败") << std::endl;
}
run_async_task("数据解析", task_finish);
```


END
<!--ID: 1773973207995-->
