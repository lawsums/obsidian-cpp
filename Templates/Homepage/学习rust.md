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

## 2.2 方法 Method
下面的图片将 Rust 方法定义与其它语言的方法定义做了对比：
![[Pasted image 20260817210129.png]]
#### 2.2.1.1 self、&self 和 &mut self

接下来的内容非常重要，请大家仔细看。在 `area` 的签名中，我们使用 `&self` 替代 `rectangle: &Rectangle`，`&self` 其实是 `self: &Self` 的简写（注意大小写）。在一个 `impl` 块内，`Self` 指代被实现方法的结构体类型，`self` 指代此类型的实例，换句话说，`self` 指代的是 `Rectangle` 结构体实例，这样的写法会让我们的代码简洁很多，而且非常便于理解：我们为哪个结构体实现方法，那么 `self` 就是指代哪个结构体的实例。

需要注意的是，`self` 依然有所有权的概念：

- `self` 表示 `Rectangle` 的所有权转移到该方法中，这种形式用的较少
- `&self` 表示该方法对 `Rectangle` 的不可变借用
- `&mut self` 表示可变借用

总之，`self` 的使用就跟函数参数一样，要严格遵守 Rust 的所有权规则。

回到上面的例子中，选择 `&self` 的理由跟在函数中使用 `&Rectangle` 是相同的：我们并不想获取所有权，也无需去改变它，只是希望能够读取结构体中的数据。如果想要在方法中去改变当前的结构体，需要将第一个参数改为 `&mut self`。仅仅通过使用 `self` 作为第一个参数来使方法获取实例的所有权是很少见的，这种使用方式往往用于把当前的对象转成另外一个对象时使用，转换完后，就不再关注之前的对象，且可以防止对之前对象的误调用。

简单总结下，使用方法代替函数有以下好处：

- 不用在函数签名中重复书写 `self` 对应的类型
- 代码的组织性和内聚性更强，对于代码维护和阅读来说，好处巨大

### 2.2.2 `->` 运算符到哪去了？

在 C/C++ 语言中，有两个不同的运算符来调用方法：`.` 直接在对象上调用方法，而 `->` 在一个对象的指针上调用方法，这时需要先解引用指针。换句话说，如果 `object` 是一个指针，那么 `object->something()` 和 `(*object).something()` 是一样的。

Rust 并没有一个与 `->` 等效的运算符；相反，Rust 有一个叫 **自动引用和解引用**的功能。方法调用是 Rust 中少数几个拥有这种行为的地方。

他是这样工作的：当使用 `object.something()` 调用方法时，Rust 会自动为 `object` 添加 `&`（视可见性添加`&mut`)、 `*` 以便使 `object` 与方法签名匹配。也就是说，这些代码是等价的：

```rust
# #[derive(Debug,Copy,Clone)]
# struct Point {
#     x: f64,
#     y: f64,
# }
#
# impl Point {
#    fn distance(&self, other: &Point) -> f64 {
#        let x_squared = f64::powi(other.x - self.x, 2);
#        let y_squared = f64::powi(other.y - self.y, 2);
#
#        f64::sqrt(x_squared + y_squared)
#    }
# }
# let p1 = Point { x: 0.0, y: 0.0 };
# let p2 = Point { x: 5.0, y: 6.5 };
p1.distance(&p2);
(&p1).distance(&p2);
```


第一行看起来简洁的多。这种自动引用的行为之所以有效，是因为方法有一个明确的接收者———— `self` 的类型。在给出接收者和方法名的前提下，Rust 可以明确地计算出方法是仅仅读取（`&self`），做出修改（`&mut self`）或者是获取所有权（`self`）。事实上，Rust 对方法接收者的隐式借用让所有权在实践中更友好。

### 2.2.3 为枚举实现方法

枚举类型之所以强大，不仅仅在于它好用、可以[同一化类型](https://beatai.org/rust-course/basic/compound-type/enum#%E5%90%8C%E4%B8%80%E5%8C%96%E7%B1%BB%E5%9E%8B)，还在于，我们可以像结构体一样，为枚举实现方法：

```rust
#![allow(unused)]
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

impl Message {
    fn call(&self) {
        // 在这里定义方法体
    }
}

fn main() {
    let m = Message::Write(String::from("hello"));
    m.call();
}
```

除了结构体和枚举，我们还能为特征(trait)实现方法，这将在下一章进行讲解，在此之前，先来看看泛型。

### 2.2.4 TODO
关联函数我看教程说是定义在 impl 中且没有 self 的函数，举的例子是 Rust 里的构造器方法。那除了构造器方法，还有什么其他的关联函数呢？关联函数可以看作是构造器方法的一种超集，对不对？在我看来，关联函数有点类似于 C++ 里的静态方法，就是它属于这个类，但不需要依托于实例，是不是这个意思？
然后还有一个问题是有构造器方法，那么有没有这个析构方法？


## 2.3 流程控制
### 2.3.1 for

| 使用方法                          | 等价使用方式                                            | 所有权   |
| ----------------------------- | ------------------------------------------------- | ----- |
| `for item in collection`      | `for item in IntoIterator::into_iter(collection)` | 转移所有权 |
| `for item in &collection`     | `for item in collection.iter()`                   | 不可变借用 |
| `for item in &mut collection` | `for item in collection.iter_mut()`               | 可变借用  |

### 2.3.2 loop
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

### 2.3.3 loop 标签
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

## 2.4 格式化输出
格式化输出主要使用 println! 和 print!，还有 format! 这个函数。
打印错误的话主要有 eprint! 和 eprintln!

### 2.4.1 `{}` 与 `{:?}`

与其它语言常用的 `%d`，`%s` 不同，Rust 特立独行地选择了 `{}` 作为格式化占位符（说到这个，有点想吐槽下，Rust 中自创的概念其实还挺多的，真不知道该夸奖还是该吐槽-,-），事实证明，这种选择非常正确，它帮助用户减少了很多使用成本，你无需再为特定的类型选择特定的占位符，统一用 `{}` 来替代即可，剩下的类型推导等细节只要交给 Rust 去做。

与 `{}` 类似，`{:?}` 也是占位符：

- `{}` 适用于实现了 `std::fmt::Display` 特征的类型，用来以更优雅、更友好的方式格式化文本，例如展示给用户
- `{:?}` 适用于实现了 `std::fmt::Debug` 特征的类型，用于调试场景

其实两者的选择很简单，当你在写代码需要调试时，使用 `{:?}`，剩下的场景，选择 `{}`。

`{:#?}` 与 `{:?}` 几乎一样，唯一的区别在于它能更优美地输出内容：

### 2.4.2 位置参数和格式化参数
Rust 在打印的时候，大括号中间有一个冒号。冒号前面放的是位置参数，用于把格式化字符串之后的所有输入当做参数列表，然后从 0 开始。所以位置参数填 0 的话，就会调用 0 位置的那个参数，而与这个大括号的位置无关。可能有很多个大括号，但是你在最后一个大括号填 0 的话，它还是获取位置为 0 的参数，这个就是位置参数。

然后我们其实不一定一定要使用位置参数，我们还可以使用命名参数，就是给后面的参数起个名，写一个 a=什么什么，然后就可以在前面位置参数的地方填 a。

格式化参数在冒号之后填，包括指定宽度、指定对齐、指定精度、指定进制、指定指数、指定指针地址以及转义。格式化参数其实不需要记，想用的时候去看一下就行了。同时 Rust 现在还支持类似 Python 的 f-string。

---
* 2026-08-09 - 1
* 2026-08-10 - 1
* 2026-08-14 - 1
* 2026-08-16 - 1
* 2026-08-17 - 1