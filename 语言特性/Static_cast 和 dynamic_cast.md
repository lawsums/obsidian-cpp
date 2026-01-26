
在C++中，`static_cast` 和 `dynamic_cast` 是两种常用的类型转换运算符，用于在不同类型之间进行转换，但它们的适用场景、转换时机和安全性有显著区别。以下是详细介绍：


### 一、static_cast：编译时的静态转换
`static_cast`是编译阶段进行的类型转换，依赖于程序员保证转换的合理性，编译器不进行运行时检查。


#### 主要用途：
1. **基本数据类型之间的转换**  
   例如整数与浮点数、字符与整数等：  
   ```cpp
   int a = 10;
   float b = static_cast<float>(a);  // int转float
   char c = static_cast<char>(65);   // 整数转字符（'A'）
   ```

2. **指针/引用的上行转换（派生类→基类）**  
   多态场景中，将派生类指针/引用转换为基类指针/引用（天然安全，与隐式转换效果一致）：  
   ```cpp
   class Base {};
   class Derived : public Base {};
   Derived d;
   Base* b_ptr = static_cast<Base*>(&d);  // 派生类指针→基类指针（安全）
   Base& b_ref = static_cast<Base&>(d);  // 派生类引用→基类引用（安全）
   ```

3. **指针/引用的下行转换（基类→派生类）**  
   将基类指针/引用转换为派生类指针/引用（**不安全**，编译器不检查实际类型）：  
   ```cpp
   Base* base = new Base();  // 实际指向基类对象
   Derived* der = static_cast<Derived*>(base);  // 编译通过，但运行时访问der可能崩溃
   ```

4. **void*与其他类型指针的转换**  

   `void*` 可以暂存任意类型指针，`static_cast` 可将其转回原类型：  
   ```cpp
   int x = 10;
   void* vp = &x;
   int* ip = static_cast<int*>(vp);  // 正确转回int*
   ```

5. **类类型的显式转换**  
   若类定义了转换构造函数或类型转换运算符，`static_cast`可触发显式转换：  
   ```cpp
   class MyInt {
   public:
       MyInt(int x) : val(x) {}  // 转换构造函数
       operator int() { return val; }  // 类型转换运算符
   private:
       int val;
   };
   MyInt m(100);
   int n = static_cast<int>(m);  // 触发operator int()
   MyInt m2 = static_cast<MyInt>(200);  // 触发转换构造函数
   ```


#### 特点：
- **编译时完成**：转换在编译阶段确定，无运行时开销。  
- **不检查安全性**：下行转换（基类→派生类）时，即使实际对象类型不匹配，编译器也不会报错，可能导致运行时错误。  
- **不能移除`const`属性**：如需转换`const`，需用`const_cast`。  


### 二、dynamic_cast：运行时的动态转换
`dynamic_cast`主要用于**多态类型**（含虚函数的类）的指针或引用转换，在运行时检查转换的安全性，依赖运行时类型信息（RTTI）。


#### 主要用途：
1. **安全的下行转换（基类→派生类）**  
   多态场景中，将基类指针/引用转换为派生类指针/引用时，`dynamic_cast`会在运行时检查实际对象类型：  
   - 若转换安全（实际对象是目标类型），返回有效指针/引用；  
   - 若转换不安全（实际对象不是目标类型），指针转换返回`nullptr`，引用转换抛出`std::bad_cast`异常。  

   示例：  
   ```cpp
   class Base { 
   public:
       virtual void func() {}  // 必须有虚函数（多态类型）
   };
   class Derived : public Base {};

   // 情况1：实际指向派生类对象（安全转换）
   Base* base1 = new Derived();
   Derived* der1 = dynamic_cast<Derived*>(base1);  // der1 != nullptr（成功）

   // 情况2：实际指向基类对象（不安全转换）
   Base* base2 = new Base();
   Derived* der2 = dynamic_cast<Derived*>(base2);  // der2 == nullptr（失败）

   // 引用转换（失败时抛异常）
   try {
       Base& ref = *base2;
       Derived& der_ref = dynamic_cast<Derived&>(ref);
   } catch (std::bad_cast& e) {
       // 捕获异常：转换失败
   }
   ```

2. **上行转换（派生类→基类）**  
   与`static_cast`效果一致（安全），但通常无需使用`dynamic_cast`（多余开销）。

3. **交叉转换（多继承中的基类间转换）**  
   在多继承中，可将一个基类指针转换为另一个基类指针（前提是它们共享同一个派生类对象）：  
   ```cpp
   class Base1 { virtual void f() {} };
   class Base2 { virtual void g() {} };
   class Derived : public Base1, public Base2 {};

   Derived* d = new Derived();
   Base1* b1 = d;
   Base2* b2 = dynamic_cast<Base2*>(b1);  // 交叉转换：Base1*→Base2*（成功）
   ```


#### 特点：
- **运行时检查**：依赖RTTI，有一定性能开销（需查询对象实际类型）。  
- **仅支持多态类型**：转换的源类型必须是含虚函数的类（否则编译报错）。  
- **安全性高**：下行转换时会验证实际对象类型，避免无效访问。  


### 三、核心区别对比
| 维度        | static_cast       | dynamic_cast              |
| --------- | ----------------- | ------------------------- |
| 转换时机      | 编译时               | 运行时                       |
| 适用类型      | 任意类型（包括非多态类、基本类型） | 仅多态类型（含虚函数的类）的指针/引用       |
| 安全性（下行转换） | 不检查，可能不安全         | 运行时检查，安全（失败返回nullptr/抛异常） |
| 性能        | 无运行时开销            | 有RTTI查询开销                 |
| 依赖RTTI    | 不依赖               | 依赖                        |


### 四、使用建议
- 若转换在编译时可确定安全（如基本类型转换、上行转换），优先用`static_cast`（高效）。  
- 若需在多态场景中进行下行转换（基类→派生类），且需确保安全，用`dynamic_cast`（牺牲性能换安全）。  
- 避免用`static_cast`进行未知安全性的下行转换（易导致运行时错误）。