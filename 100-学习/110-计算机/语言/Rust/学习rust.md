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
	- [x] 字符串与切片 ✅ 2026-08-23
	- [x] 元组 ✅ 2026-08-16
	- [x] 结构体 ✅ 2026-08-16
	- [ ] 枚举
	- [ ] 数组
- [x] 流程控制 ✅ 2026-08-21
- [ ] 模式匹配
- [x] 方法 Method ✅ 2026-08-21
- [ ] 泛型和特征
- [ ] 集合类型
	- [x] Vector ✅ 2026-08-21
	- [ ] HashMap
- [ ] 认识生命周期
- [ ] 返回值和错误处理
- [x] 包和模块 ✅ 2026-08-31
- [ ] 注释和文档
- [x] 格式化输出 ✅ 2026-08-09

### 1.1.2 第三部分：入门实战

- [x] 基本功能 ✅ 2026-08-10
- [x] 模块化和错误处理 ✅ 2026-08-29
- [x] 测试驱动开发 ✅ 2026-08-31
- [x] 使用环境变量 ✅ 2026-09-04
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

### 2.1.1 [[字符串String]]

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

你的理解非常精准！你完全抓住了 Rust 中“关联函数”和“析构器”的核心概念。我们分两部分来深入探讨你的问题。

### 2.2.5 关联函数（Associated Functions）：除了构造器还有什么？

你的类比非常到位：**关联函数确实非常类似于 C++ 或 Java 中的静态方法（Static Methods）**。它们属于类型（Type）的命名空间，而不依赖于任何具体的实例。

虽然它们最常见的用途是作为构造器（如 `String::new()`、`Vec::with_capacity()`），但它们的能力远不止于此。关联函数是类型的命名空间成员，还可以用于实现以下设计模式或功能：

- **工厂方法（Factory Pattern）**：根据不同的输入条件，返回类型实例。例如 `String::from_utf8()` 会尝试将字节数组转换为字符串，如果失败会返回一个错误。
- **类型转换（Type Conversion）**：将一个类型转换为另一个类型。例如 `String::from("hello")` 将字符串切片 `&str` 转换为 `String`。
- **工具函数（Utility Functions）**：实现与类型强相关，但不需要访问实例内部状态的计算。例如 `f64::is_nan()` 或 `Option::unwrap_or()`。
- **常量与哨兵值**：在类型命名空间下提供默认的常量。例如 `std::u32::MAX`。

所以，你说“关联函数是构造器方法的超集”是完全正确的。构造器只是关联函数最典型的一种应用场景。

### 2.2.6 有没有“析构方法”？

**有的！** Rust 中不仅有析构方法，而且它的机制比 C++ 更加安全和自动化。

在 Rust 中，析构器的概念是通过 **`std::ops::Drop` 特征（Trait）** 来实现的。

#### 2.2.6.1 自动触发与 RAII

Rust 遵循 **RAII（Resource Acquisition Is Initialization，资源获取即初始化）** 原则。当一个变量离开其作用域（Scope），或者一个临时变量不再被需要时，Rust 会**自动**调用它的析构函数，释放它拥有的资源（如堆内存、文件句柄等）。你不需要像 C++ 那样手动 `delete`，也永远不用担心内存泄漏。

#### 2.2.6.2 如何自定义析构行为？

如果你需要在对象销毁时执行一些自定义的清理逻辑（比如打印日志、关闭网络连接等），你可以为你的类型实现 `Drop` trait：

```rust
struct MyResource {
    name: String,
}

// 为 MyResource 实现 Drop trait
impl Drop for MyResource {
    fn drop(&mut self) {
        println!("正在销毁资源: {}", self.name);
        // 在这里执行自定义的清理逻辑
    }
}

fn main() {
    {
        let res = MyResource { name: String::from("数据库连接") };
        println!("资源已创建");
    } // <--- 当离开这个花括号时，res 的 drop 方法会被自动调用
    println!("程序结束");
}
```

#### 2.2.6.3 析构的顺序

Rust 对析构的顺序有严格的规定，以确保内存安全：

1. **变量之间**：按照声明的**相反顺序**（Reverse order of declaration）进行析构。后声明的变量会先被销毁。
2. **结构体/元组内部**：结构体的字段、元组的元素按照**声明的顺序**（Declaration order）依次析构。

#### 2.2.6.4 阻止自动析构

在某些极端的底层操作（比如实现自己的智能指针或内存管理）中，如果你确实需要阻止一个变量被自动销毁，Rust 提供了 `std::mem::ManuallyDrop` 包装器来安全地阻止析构器的运行。

**总结一下：**

- **关联函数** = 类型的静态方法（构造器、工厂、工具函数等）。
- **析构器** = 通过实现 `Drop` trait 定义，并在变量离开作用域时由 Rust 编译器自动、安全地调用。

---

你前面提到的"注册制"其实正好和`Drop` trait配合得非常好——比如资源释放时自动清理注册表。要不要我帮你写个完整的例子，把协议注册和自动清理串起来？


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

## 2.4 集合类型
### 2.4.1 Vector
#### 2.4.1.1 申请方式

有两种方式创建动态数组：

```rust
// 方式一：使用 vec![] 宏，在初始化的同时完成赋值
let v = vec![1, 2, 3];

// 方式二：使用 Vec::new()，创建空的动态数组
let mut v: Vec<i32> = Vec::new();
```

> 注意：`Vec::new()` 创建的是空数组，元素类型通常需要由后续操作（如 `push`）推断；如果编译器无法推断，就需要手动添加类型标注，例如 `let mut v: Vec<i32> = Vec::new();`。

#### 2.4.1.2 推入元素

使用 `push` 方法在数组尾部追加元素，需要 `v` 声明为可变的（`mut`）：

```rust
let mut v = Vec::new();
v.push(1);
v.push(2);
v.push(3);
```

#### 2.4.1.3 读取元素

读取元素有两种方式：

1. `&v[index]`：直接使用索引访问，**越界会直接 panic（程序崩溃）**
2. `v.get(index)`：返回 `Option<&T>`，越界时返回 `None`，**不会 panic**，需要自己处理 `None` 的情况

```rust
let v = vec![1, 2, 3, 4, 5];

// 方式一：&v[index]，越界会 panic
let third: &i32 = &v[2];
println!("第三个元素是 {third}");

// 方式二：v.get(index)，越界返回 None，更安全
match v.get(2) {
    Some(third) => println!("第三个元素是 {third}"),
    None => println!("没有第三个元素"),
}

// 越界访问对比（下面两行是两种方式，分别运行观察结果）
let does_not_exist = &v[100];      // panic: index out of bounds
let does_not_exist = v.get(100);   // 返回 None，不会 panic
```

> 类比 C++：`&v[index]` 与 C++ 的 `v.at(index)` 类似——越界都会报错（C++ 抛异常，Rust 直接 panic）；`v.get(index)` 则相当于更安全的版本，把「越界」变成了可处理的 `None`。注意 C++ 的 `v[i]` 越界是未定义行为，而 Rust 中 `&v[index]` 越界会明确 panic，不存在未定义行为。

#### 2.4.1.4 同时借用多个数组元素

先看下面的代码，它试图同时进行不可变借用和可变借用：

```rust
let mut v = vec![1, 2, 3, 4, 5];

let first = &v[0];   // 对 v 的不可变借用

v.push(6);           // 对 v 的可变借用 —— 报错！

println!("The first element is: {first}");
```

编译时会报错：

```text
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
```

原因：`first` 是对数组第一个元素的**不可变借用**，而 `v.push(6)` 需要的是对 `v` 的**可变借用**，两者不能同时存在（借用规则：同一时刻只能有一个可变借用，或多个不可变借用，但两者不能混用）。

更深层的原因是：动态数组的大小是可变的，当容量不足时，Rust 会重新申请一块更大的内存并把旧元素拷贝过去。此时旧的引用 `first` 会指向被释放的内存，成为悬垂指针。因此 Rust 编译器在编译期就拦截了这种写法，保证内存安全。

#### 2.4.1.5 迭代遍历 Vector 中的元素

如果想要依次访问数组中的元素，可以使用迭代的方式去遍历数组，这种方式比用下标的方式去遍历数组更安全也更高效（每次下标访问都会触发数组边界检查）：

```rust
let v = vec![1, 2, 3];
for i in &v {
    println!("{i}");
}
```

也可以在迭代过程中，修改 Vector 中的元素：

```rust
let mut v = vec![1, 2, 3];
for i in &mut v {
    *i += 10;
}
```

#### 2.4.1.6 存储不同类型对象

可以通过使用[[枚举类型]]和[[特征对象]]来实现不同类型元素的存储。

以枚举方式为例：先把所有可能出现的类型统一到一个枚举中，再存入 `Vec`：

```rust
#[derive(Debug)]
enum IpAddr {
    V4(String),
    V6(String),
}

fn main() {
    let v = vec![
        IpAddr::V4("127.0.0.1".to_string()),
        IpAddr::V6("::1".to_string()),
    ];

    for ip in v {
        show_addr(ip);
    }
}

fn show_addr(ip: IpAddr) {
    println!("{:?}", ip);
}
```

特征对象（`Box<dyn Trait>`）的方式更灵活，但需要先掌握[[特征对象]]。

#### 2.4.1.7 排序

**整数数组排序** — 整数类型实现了 `Ord`（全序比较），可以直接调用 `sort_unstable()`：

```rust
fn main() {
    let mut vec = vec![1, 5, 10, 2, 15];
    vec.sort_unstable();
    assert_eq!(vec, vec![1, 2, 5, 10, 15]);
}
```

**浮点数数组排序** — 我们尝试使用同样的方法来对浮点数进行排序：

```rust
fn main() {
    let mut vec = vec![1.0, 5.6, 10.3, 2.0, 15f32];
    vec.sort_unstable();
    assert_eq!(vec, vec![1.0, 2.0, 5.6, 10.3, 15f32]);
}
```

结果，居然报错了：

```text
error[E0277]: the trait bound `f32: Ord` is not satisfied
    --> src/main.rs:29:13
     |
29   |         vec.sort_unstable();
     |             ^^^^^^^^^^^^^ the trait `Ord` is not implemented for `f32`
     |
     = help: the following other types implement trait `Ord`:
               i128
               i16
               i32
               i64
               i8
               isize
               u128
               u16
               ...
note: required by a bound in `core::slice::sort_unstable`
    --> .../library/core/src/slice/mod.rs:2635:12
     |
2635 |         T: Ord,
     |            ^^^ required by this bound in `core::slice::sort_unstable`

For more information about this error, try `rustc --explain E0277`.
```

原因：浮点数中存在 `NaN`（Not a Number），它无法与其它浮点数进行大小比较，因此浮点类型没有实现全序比较 `Ord`，只实现了部分比较 `PartialOrd`。

如果确定数组中不包含 `NaN` 值，就可以使用 `partial_cmp` 作为大小比较的依据：

```rust
fn main() {
    let mut vec = vec![1.0, 5.6, 10.3, 2.0, 15f32];
    vec.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap());
    assert_eq!(vec, vec![1.0, 2.0, 5.6, 10.3, 15f32]);
}
```

现在可以正确执行了。

**结构体数组排序** — 结构体默认没有实现 `Ord`，可以像浮点数一样，通过 `sort_unstable_by` 自定义比较函数。例如按照年龄倒序排序：

```rust
#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
}

impl Person {
    fn new(name: String, age: u32) -> Person {
        Person { name, age }
    }
}

fn main() {
    let mut people = vec![
        Person::new("Zoe".to_string(), 25),
        Person::new("Al".to_string(), 60),
        Person::new("John".to_string(), 1),
    ];
    // 定义一个按照年龄倒序排序的对比函数
    people.sort_unstable_by(|a, b| b.age.cmp(&a.age));

    println!("{:?}", people);
}
```

执行后输出：

```text
[Person { name: "Al", age: 60 }, Person { name: "Zoe", age: 25 }, Person { name: "John", age: 1 }]
```

结果正确。

> 总结：`sort_unstable()` / `sort()` 要求元素实现 `Ord`（全序比较）。整数满足；浮点数因为 `NaN` 的存在只实现了 `PartialOrd`；结构体默认不实现——后两者都需要借助 `sort_unstable_by()` / `sort_by()` 传入自定义比较函数。

#### 2.4.1.8 Vector 常用方法

**初始化 vec 的更多方式：**

```rust
fn main() {
    let v = vec![0; 3];   // 默认值为 0，初始长度为 3
    let v_from = Vec::from([0, 0, 0]);
    assert_eq!(v, v_from);
}
```
**容量管理（扩容机制）** — 动态数组在增加元素时，如果容量不足就会扩容（目前策略是重新申请一块 2 倍大小的内存，再将所有元素拷贝到新的内存位置，同时更新指针数据）。频繁扩容或元素较多时，大量的内存拷贝会降低程序性能。

可以考虑在初始化时就指定一个实际的预估容量，尽量减少内存拷贝：

```rust
fn main() {
    let mut v = Vec::with_capacity(10);
    v.extend([1, 2, 3]);    // 附加数据到 v
    println!("Vector 长度是: {}, 容量是: {}", v.len(), v.capacity());

    v.reserve(100);        // 调整 v 的容量，至少要有 100 的容量
    println!("Vector（reserve） 长度是: {}, 容量是: {}", v.len(), v.capacity());

    v.shrink_to_fit();     // 释放剩余的容量，一般情况下，不会主动去释放容量
    println!("Vector（shrink_to_fit） 长度是: {}, 容量是: {}", v.len(), v.capacity());
}
```
**常见方法示例：**

```rust
let mut v = vec![1, 2];
assert!(!v.is_empty());         // 检查 v 是否为空

v.insert(2, 3);                 // 在指定索引插入数据，索引值不能大于 v 的长度，v: [1, 2, 3]
assert_eq!(v.remove(1), 2);     // 移除指定位置的元素并返回, v: [1, 3]
assert_eq!(v.pop(), Some(3));   // 删除并返回 v 尾部的元素，v: [1]
assert_eq!(v.pop(), Some(1));   // v: []
assert_eq!(v.pop(), None);      // 记得 pop 方法返回的是 Option 枚举值
v.clear();                      // 清空 v, v: []

let mut v1 = [11, 22].to_vec(); // append 操作会导致 v1 清空数据，需要可变声明
v.append(&mut v1);              // 将 v1 中的所有元素附加到 v 中, v1: []
v.truncate(1);                  // 截断到指定长度，多余的元素被删除, v: [11]
v.retain(|x| *x > 10);          // 保留满足条件的元素，即删除不满足条件的元素

let mut v = vec![11, 22, 33, 44, 55];
// 删除指定范围的元素，同时获取被删除元素的迭代器, v: [11, 55], m: [22, 33, 44]
let mut m: Vec<_> = v.drain(1..=3).collect();

let v2 = m.split_off(1);        // 指定索引处切分成两个 vec, m: [22], v2: [33, 44]
```
当然也可以像数组切片的方式获取 vec 的部分元素：

```rust
fn main() {
    let v = vec![11, 22, 33, 44, 55];
    let slice = &v[1..=3];
    assert_eq!(slice, &[22, 33, 44]);
}
```

更多细节，阅读 [Vector 的标准库文档](https://doc.rust-lang.org/std/vec/struct.Vec.html)。

## 2.5 格式化输出
格式化输出主要使用 println! 和 print!，还有 format! 这个函数。
打印错误的话主要有 eprint! 和 eprintln!

### 2.5.1 `{}` 与 `{:?}`

与其它语言常用的 `%d`，`%s` 不同，Rust 特立独行地选择了 `{}` 作为格式化占位符（说到这个，有点想吐槽下，Rust 中自创的概念其实还挺多的，真不知道该夸奖还是该吐槽-,-），事实证明，这种选择非常正确，它帮助用户减少了很多使用成本，你无需再为特定的类型选择特定的占位符，统一用 `{}` 来替代即可，剩下的类型推导等细节只要交给 Rust 去做。

与 `{}` 类似，`{:?}` 也是占位符：

- `{}` 适用于实现了 `std::fmt::Display` 特征的类型，用来以更优雅、更友好的方式格式化文本，例如展示给用户
- `{:?}` 适用于实现了 `std::fmt::Debug` 特征的类型，用于调试场景

其实两者的选择很简单，当你在写代码需要调试时，使用 `{:?}`，剩下的场景，选择 `{}`。

`{:#?}` 与 `{:?}` 几乎一样，唯一的区别在于它能更优美地输出内容：

### 2.5.2 位置参数和格式化参数
Rust 在打印的时候，大括号中间有一个冒号。冒号前面放的是位置参数，用于把格式化字符串之后的所有输入当做参数列表，然后从 0 开始。所以位置参数填 0 的话，就会调用 0 位置的那个参数，而与这个大括号的位置无关。可能有很多个大括号，但是你在最后一个大括号填 0 的话，它还是获取位置为 0 的参数，这个就是位置参数。

然后我们其实不一定一定要使用位置参数，我们还可以使用命名参数，就是给后面的参数起个名，写一个 a=什么什么，然后就可以在前面位置参数的地方填 a。

格式化参数在冒号之后填，包括指定宽度、指定对齐、指定精度、指定进制、指定指数、指定指针地址以及转义。格式化参数其实不需要记，想用的时候去看一下就行了。同时 Rust 现在还支持类似 Python 的 f-string。

## 2.6 包和模块

### 2.6.1 避免同名引用

根据上一章节的内容，我们只要保证同一个模块中不存在同名项就行，模块之间、包之间的同名，谁管得着谁啊，话虽如此，一起看看，如果遇到同名的情况该如何处理。

使用 `模块::函数` 的方式即可避免同名冲突：

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    // --snip--
}

fn function2() -> io::Result<()> {
    // --snip--
}
```

上面的例子给出了很好的解决方案，使用模块引入的方式，具体的 `Result` 通过 `模块::Result` 的方式进行调用。

可以看出，避免同名冲突的关键，就是使用父模块的方式来调用，除此之外，还可以给引入的项起一个别名。

#### 2.6.1.1 as 别名引用

对于同名冲突问题，还可以使用 `as` 关键字来解决，它可以赋予引入项一个全新的名称：

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    // --snip--
}

fn function2() -> IoResult<()> {
    // --snip--
}
```

如上所示，首先通过 `use std::fmt::Result` 将 `Result` 引入到作用域，然后使用 `as` 给予它一个全新的名称 `IoResult`，这样就不会再产生冲突：

- `Result` 代表 `std::fmt::Result`
- `IoResult` 代表 `std::io::Result`

### 2.6.2 使用 {} 简化引入方式

对于以下一行一行的引入方式：

```rust
use std::collections::HashMap;
use std::collections::BTreeMap;
use std::collections::HashSet;

use std::cmp::Ordering;
use std::io;
```

可以使用 `{}` 来一起引入进来，在大型项目中，使用这种方式来引入，可以减少大量 `use` 的使用：

```rust
use std::collections::{HashMap, BTreeMap, HashSet};
use std::{cmp::Ordering, io};
```

对于下面的同时引入模块和模块中的项：

```rust
use std::io;
use std::io::Write;
```

可以使用 `{}` 的方式进行简化：

```rust
use std::io::{self, Write};
```

#### 2.6.2.1 self 关键字

上面使用到了模块章节提到的 `self` 关键字，用来替代模块自身，结合上一节中的 `self`，可以得出它在模块中的两个用途：

- `use self::xxx`：表示加载当前模块中的 `xxx`，此时 `self` 可省略
- `use xxx::{self, yyy}`：表示加载当前路径下模块 `xxx` 本身，以及模块 `xxx` 下的 `yyy`

### 2.6.3 使用 * 引入模块下的所有项

对于之前一行一行引入 `std::collections` 的方式，我们还可以使用：

```rust
use std::collections::*;
```

以上这种方式来引入 `std::collections` 模块下的所有公共项，这些公共项自然包含了 `HashMap`、`HashSet` 等想手动引入的集合类型。

当使用 `*` 来引入的时候要格外小心，因为你很难知道到底哪些被引入到了当前作用域中，有哪些会和你自己程序中的名称相冲突：

```rust
use std::collections::*;

struct HashMap;

fn main() {
    let mut v = HashMap::new();
    v.insert("a", 1);
}
```

以上代码中，`std::collections::HashMap` 被 `*` 引入到当前作用域，但是由于存在另一个同名的结构体，因此 `HashMap::new` 根本不存在，因为对于编译器来说，本地同名类型的优先级更高。

在实际项目中，这种引用方式往往用于快速写测试代码，它可以把所有东西一次性引入到 `tests` 模块中。


---
* 2026-08-09 - 1
* 2026-08-10 - 1
* 2026-08-14 - 1
* 2026-08-16 - 1
* 2026-08-17 - 1
* 2026-08-21 - 1
* 2026-08-23 - 1
* 2026-08-29 - 1
* 2026-08-30 - 1
* 2026-08-31 - 1
* 2026-09-04 - 1
* 2026-09-06 - 1
* 2026-09-11 - 1