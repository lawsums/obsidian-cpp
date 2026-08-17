```easy-tracker-daily-overview
```
```easy-tracker-year-calendar-heatmap
```
```easy-tracker-buttons
  打卡 | 1
```

---
# 1 目录 

[学习网站](https://beatai.org/rust-course/about-book)


### 1.1.1 第二部分：RUST 基础入门

- [x] 变量绑定与解构 ✅ 2026-08-09
- [x] 基本类型 ✅ 2026-08-09
- [ ] 所有权和借用
- [ ] 复合类型
	- [ ] 字符串与切片
	- [x] 元组 ✅ 2026-08-16
	- [x] 结构体 ✅ 2026-08-16
	- [ ] 枚举
	- [ ] 数组
- [ ] 流程控制
- [ ] 模式匹配
- [ ] 方法 Method
- [ ] 泛型和特征
- [ ] 集合类型
- [ ] 认识生命周期
- [ ] 返回值和错误处理
- [ ] 包和模块
- [ ] 注释和文档
- [x] 格式化输出 ✅ 2026-08-09

### 1.1.2 第三部分：入门实战

- [x] 基本功能 ✅ 2026-08-10
- [ ] 模块化和错误处理
- [ ] 测试驱动开发
- [ ] 使用环境变量
- [ ] 重定向错误输出
- [ ] 使用迭代器改进

### 1.1.3 第四部分：RUST 高级进阶

- [ ] 生命周期
- [ ] 函数式编程
- [ ] 深入类型
- [ ] 智能指针
- [ ] 循环引用与自引用
- [ ] 多线程并发编程
- [ ] 全局变量
- [ ] 错误处理
- [ ] Unsafe Rust
- [ ] Macro 宏编程
- [ ] async/await 异步编程

### 1.1.4 第五部分：进阶实战 1 - WEB 服务器

- [ ] 单线程版本
- [ ] 多线程版本
- [ ] 优雅关闭和资源清理

### 1.1.5 第六部分：进阶实战 2 - 实现 REDIS

- [ ] tokio 概览
- [ ] 使用初印象
- [ ] 创建异步任务
- [ ] 共享状态
- [ ] 消息传递
- [ ] I/O
- [ ] 解析数据帧
- [ ] 深入 async
- [ ] select
- [ ] 类似迭代器的 Stream
- [ ] 优雅的关闭
- [ ] 异步跟同步共存

### 1.1.6 RUST 难点攻关

- 切片和切片引用
- Eq 和 PartialEq

### 1.1.7 常用工具链

- 自动化测试
- Cargo 使用指南

### 1.1.8 开发实践

- 企业落地实践
- 日志和监控
- Rust 最佳实践
- 手把手带你实现链表

### 1.1.9 攻克编译错误

- 对抗编译检查
- Rust 常见陷阱

### 1.1.10 性能优化

- 深入内存
- 性能调优
- 编译优化

### 1.1.11 附录

- 关键字
- 运算符与符号
- 表达式
- 派生特征 trait
- Rust 版本说明
- Rust 历次版本更新解读


---
# 2 笔记
## 2.1 常用数据集合

### 2.1.1 字符串String

### 2.1.2 数组和动态数组Vector
在 Rust 中，通过 `vec!` 宏以初始化列表的方式初始化数组。
```rust
let v = vec![1, 2, 3];
```

### 2.1.3 struct 结构体
使用 `#[derive(Debug)]` 来打印结构体的信息
#### 2.1.3.1 元组结构体(Tuple Struct)

结构体必须要有名称，但是结构体的字段可以没有名称，这种结构体长得很像元组，因此被称为元组结构体，例如：

```rust
    struct Color(i32, i32, i32);
    struct Point(i32, i32, i32);

    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
```

元组结构体在你希望有一个整体名称，但是又不关心里面字段的名称时将非常有用。例如上面的 `Point` 元组结构体，众所周知 3D 点是 `(x, y, z)` 形式的坐标点，因此我们无需再为内部的字段逐一命名为：`x`, `y`, `z`。

#### 2.1.3.2 单元结构体(Unit-like Struct)

还记得之前讲过的基本没啥用的[单元类型](https://beatai.org/rust-course/basic/base-type/char-bool#%E5%8D%95%E5%85%83%E7%B1%BB%E5%9E%8B)吧？单元结构体就跟它很像，没有任何字段和属性，但是好在，它还挺有用。

如果你定义一个类型，但是不关心该类型的内容，只关心它的行为时，就可以使用 `单元结构体`：

```rust
struct AlwaysEqual;

let subject = AlwaysEqual;

// 我们不关心 AlwaysEqual 的字段数据，只关心它的行为，因此将它声明为单元结构体，然后再为它实现某个特征
impl SomeTrait for AlwaysEqual {

}
```


#### 2.1.3.3 结构体数据的所有权

在之前的 `User` 结构体的定义中，有一处细节：我们使用了自身拥有所有权的 `String` 类型而不是基于引用的 `&str` 字符串切片类型。这是一个有意而为之的选择：因为我们想要这个结构体拥有它所有的数据，而不是从其它地方借用数据。

你也可以让 `User` 结构体从其它对象借用数据，不过这么做，就需要引入[生命周期(lifetimes)](https://beatai.org/rust-course/basic/lifetime) 这个新概念（也是一个复杂的概念），简而言之，生命周期能确保结构体的作用范围要比它所借用的数据的作用范围要小。


总之，如果你想在结构体中使用一个引用，就必须加上生命周期，否则就会报错：

```rust
struct User {
    username: &str,
    email: &str,
    sign_in_count: u64,
    active: bool,
}

fn main() {
    let user1 = User {
        email: "someone@example.com",
        username: "someusername123",
        active: true,
        sign_in_count: 1,
    };
}
```
编译器会抱怨它需要生命周期标识符：
```rust
error[E0106]: missing lifetime specifier
 --> src/main.rs:2:15
  |
2 |     username: &str,
  |               ^ expected named lifetime parameter // 需要一个生命周期
  |
help: consider introducing a named lifetime parameter // 考虑像下面的代码这样引入一个生命周期
  |
1 ~ struct User<'a> {
2 ~     username: &'a str,
  |

error[E0106]: missing lifetime specifier
 --> src/main.rs:3:12
  |
3 |     email: &str,
  |            ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
1 ~ struct User<'a> {
2 |     username: &str,
3 ~     email: &'a str,
  |
```

未来在[生命周期](https://beatai.org/rust-course/basic/lifetime)中会讲到如何修复这个问题以便在结构体中存储引用，不过在那之前，我们会避免在结构体中使用引用类型。

## 2.2 流程控制
### 2.2.1 for

| 使用方法                          | 等价使用方式                                            | 所有权   |
| ----------------------------- | ------------------------------------------------- | ----- |
| `for item in collection`      | `for item in IntoIterator::into_iter(collection)` | 转移所有权 |
| `for item in &collection`     | `for item in collection.iter()`                   | 不可变借用 |
| `for item in &mut collection` | `for item in collection.iter_mut()`               | 可变借用  |

### 2.2.2 loop
类似于 `while (true)`
```rust
fn main() {
    loop {
        println!("again!");
    }
}
```

你可以在 loop 里使用 `break`，因为如果不使用 break，它就永远退不出来了，这是一个死循环。使用 break 的时候可以后面带一个表达式，其实有点类似于 `return`。
```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2;
        }
    };

    println!("The result is {}", result);
}
```

### 2.2.3 loop 标签
当有多层循环时，你可以使用 `continue` 或 `break` 来控制外层的循环。要实现这一点，外部的循环必须拥有一个标签 `'label`, 然后在 `break` 或 `continue` 时指定该标签
```rust

// 填空
fn main() {
    let mut count = 0;
    'outer: loop {
        'inner1: loop {
            if count >= 20 {
                // 这只会跳出 inner1 循环
                break 'inner1; // 这里使用 `break` 也是一样的
            }
            count += 2;
        }

        count += 5;

        'inner2: loop {
            if count >= 30 {
                break 'outer;
            }

            continue 'outer;
        }
    }

    assert!(count == 30)
}
```

## 2.3 格式化输出
格式化输出主要使用 println! 和 print!，还有 format! 这个函数。
打印错误的话主要有 eprint! 和 eprintln!

### 2.3.1 `{}` 与 `{:?}`

与其它语言常用的 `%d`，`%s` 不同，Rust 特立独行地选择了 `{}` 作为格式化占位符（说到这个，有点想吐槽下，Rust 中自创的概念其实还挺多的，真不知道该夸奖还是该吐槽-,-），事实证明，这种选择非常正确，它帮助用户减少了很多使用成本，你无需再为特定的类型选择特定的占位符，统一用 `{}` 来替代即可，剩下的类型推导等细节只要交给 Rust 去做。

与 `{}` 类似，`{:?}` 也是占位符：

- `{}` 适用于实现了 `std::fmt::Display` 特征的类型，用来以更优雅、更友好的方式格式化文本，例如展示给用户
- `{:?}` 适用于实现了 `std::fmt::Debug` 特征的类型，用于调试场景

其实两者的选择很简单，当你在写代码需要调试时，使用 `{:?}`，剩下的场景，选择 `{}`。

`{:#?}` 与 `{:?}` 几乎一样，唯一的区别在于它能更优美地输出内容：

### 2.3.2 位置参数和格式化参数
Rust 在打印的时候，大括号中间有一个冒号。冒号前面放的是位置参数，用于把格式化字符串之后的所有输入当做参数列表，然后从 0 开始。所以位置参数填 0 的话，就会调用 0 位置的那个参数，而与这个大括号的位置无关。可能有很多个大括号，但是你在最后一个大括号填 0 的话，它还是获取位置为 0 的参数，这个就是位置参数。

然后我们其实不一定一定要使用位置参数，我们还可以使用命名参数，就是给后面的参数起个名，写一个 a=什么什么，然后就可以在前面位置参数的地方填 a。

格式化参数在冒号之后填，包括指定宽度、指定对齐、指定精度、指定进制、指定指数、指定指针地址以及转义。格式化参数其实不需要记，想用的时候去看一下就行了。同时 Rust 现在还支持类似 Python 的 f-string。

---
* 2026-08-09 - 1
* 2026-08-10 - 1
* 2026-08-14 - 1
* 2026-08-16 - 1
* 2026-08-17 - 1