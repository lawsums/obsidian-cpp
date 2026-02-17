
| 函数\语言        | C++                                                                                                                    | Python                                                                                                         | Golang                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 哈希表          | `std::unordered_map` / `std::unordered_set`                                                                            | `dict` / `set`/`defaultdict`                                                                                   | `map`                            |
| 有序表          | `std::map` / `std::set`                                                                                                | `collections.OrderedDict` (Python 3.7+ `dict` 默认保持插入顺序) / 自平衡二叉搜索树实现 (如 `treap` 或 `red-black tree` 的第三方库)      |                                  |
| 堆            | `std::priority_queue`                                                                                                  | `heapq` 模块                                                                                                     | 提供`container/heap`接口             |
| 自定义堆1        | `priority_queue`<int, vector<int>, `decltype<cmp>`> pq(`cmp`);                                                         |                                                                                                                |                                  |
| 自定义堆2        | 通过加入push(tuple(value, key))实现                                                                                          | 通过heappush((value, key))实现                                                                                     |                                  |
| 双端队列         | `std::deque`                                                                                                           | `deque`                                                                                                        |                                  |
| 视图           |                                                                                                                        |                                                                                                                |                                  |
| 比较器          | 函数对象 (functor) / Lambda 表达式 / 自定义结构体中重载 `operator<`                                                                    | `key` 参数 (用于 `sort()`, `sorted()`, `min()`, `max()`) / 自定义比较函数 (Python 2 中的 `cmp` 参数, Python 3 通常转换为 `key` 函数) |                                  |
| 前缀和累加        | `numeric::partial_sum`(arr.begin(), arr.end(), pre.begin(), (计算方式, 不写默认为累加[] (int prev, int cur){return prev ^ cur;})) | `itertools.accumulate`(arr, [计算方式, 默认为累加])                                                                     |                                  |
| 是否是数字        | `isdigit(c)`                                                                                                           | `c.isdigit()` -> bool                                                                                          | `unicode.IsDigit(c)`             |
| 是否是字母        | `isalpha(c)`                                                                                                           | `c.isalpha()` -> bool                                                                                          | `unicode.IsLetter(c)`            |
| 是否是数字或者字母    | `isalnum(c)`                                                                                                           | `c.isalnum()` -> bool                                                                                          | `unicode.IsLetterOrDigit(c) `    |
| 将单个字符转换为大写   | `toupper(c)`                                                                                                           | `str.upper()` -> str                                                                                           | `unicode.ToUpper(c)`             |
| 将字符串转换为小写    | `transform`(word.begin(), word.end(), word.begin(), `::tolower`);                                                      | `str.lower()` -> str                                                                                           | `strings.ToUpper(s)`             |
| 将字符串转为数字     | `stoi(str -> int)`/`stol(str -> long)`/`stoll(str -> long long)`                                                       | `eval(str)/int(str, base)` -> int                                                                              | `strconv.Atoi(str)`              |
| 缓冲区          | `sscanf(buf, format, argvs...)`                                                                                        |                                                                                                                | `fmt.Sscanf(buf, format, argvs)` |
| 统计一个数中二进制1个数 | `__builtin_popcount(i)`                                                                                                | `i.bit_count()`                                                                                                | `bits.OnesCount(uint(i))`        |
| 字符串中查找字符     | `str.find(c) != string::npos` -> bool                                                                                  | `c in str` -> bool                                                                                             | `strings.ContainsRune(str, c)`   |
| 通用查找         | `find(container.begin(), container.end(), val) != container.end()` -> bool                                             | `elem in container` -> bool                                                                                    |                                  |
| 合并字符串        | arr \| `views:: join_with ('符号')` \| `ranges::to<string>()`                                                            | `"符号".join(arr)`                                                                                               | `strings.Join(arr, "符号")`        |
| 字符数组形成字符串    | string(`chars.begin(), chars.end()`)                                                                                   | `"".join(chars)`                                                                                               | `string(chars)`<br>              |
|              |                                                                                                                        |                                                                                                                |                                  |

---
## [[容器对比]]

| 容器类型/语言 | Cpp | Python | Golang |
| ------- | --- | ------ | ------ |
| 数组      |     |        |        |
| 动态数组    |     |        |        |
| 哈希表     |     |        |        |
| 栈       |     |        |        |
| 有序集合    |     |        |        |
| 集合      |     |        |        |
| 队列      |     |        |        |
| 双端队列    |     |        |        |
| 线程      |     |        |        |
| 锁       |     |        |        |


---
## 自己写一些库函数

###  `split`
```cpp
vector<string> split(const string& s, char delimiter) {
	vector<string> tokens;
	string token;
	istringstream tokenStream(s);
	while (getline(tokenStream, token, delimiter)) {
		tokens.push_back(token);
	}
	return tokens;
}

/* 用法 */
// vector<string> result = split(text, '分隔符');
```

