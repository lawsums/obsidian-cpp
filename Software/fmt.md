
{fmt} 库 API 包含以下组件：

- [`fmt/base.h`](https://fmt.dev/12.0/api/#base-api)：提供主要格式化功能的基础API。 适用于/UTF-8，采用C++20编译时检查和最小依赖`char`
- [`fmt/format.h`](https://fmt.dev/12.0/api/#format-api)：以及其他格式化功能 以及当地支持`fmt::format`
- [`FMT/Ranges.H`](https://fmt.dev/12.0/api/#ranges-api)：范围和元组的格式化
- [`FMT/Chrono.H`](https://fmt.dev/12.0/api/#chrono-api)：日期和时间格式
- [`FMT/Std.H`](https://fmt.dev/12.0/api/#std-api)：标准库类型的格式化器
- [`FMT/Compile.H`](https://fmt.dev/12.0/api/#compile-api)：格式字符串编译
- [`FMT/Color.H`](https://fmt.dev/12.0/api/#color-api)：终端颜色和文本样式
- [`FMT/OS.H`](https://fmt.dev/12.0/api/#os-api)：系统API
- [`FMT/ostream.h`](https://fmt.dev/12.0/api/#ostream-api)：支持`std::ostream`
- [`FMT/ARGS.H`](https://fmt.dev/12.0/api/#args-api)：动态参数列表
- [`FMT/PrintF.H`](https://fmt.dev/12.0/api/#printf-api)：安全`printf`
- [`FMT/XCHAR.h`](https://fmt.dev/12.0/api/#xchar-api)：可选支持`wchar_t`

库提供的所有函数和类型都位于命名空间中，宏的前缀为。`fmt``FMT_`

