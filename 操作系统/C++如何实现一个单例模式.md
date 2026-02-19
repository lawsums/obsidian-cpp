
DECK: 面试题

## C++如何实现一个单例模式


## 标准答案
==私有化构造函数和析构函数==, 禁用赋值/拷贝操作, 设置一个公有方法 `GetInstance()` 函数用于获取实例

## TODO
### 1. 为什么需要私有化构造函数和析构函数?
你想实现单例模式的核心目标是**确保一个类在程序生命周期内只有一个实例**，私有化构造/析构函数正是为了从根本上杜绝多实例的可能：
- **私有化构造函数**：
  构造函数是创建类实例的入口，若设为 `private`，外部代码就无法通过 `new 类名()` 或 `类名 对象` 的方式创建实例，只能通过类内部提供的唯一接口（如 `GetInstance()`）获取实例，从源头限制实例数量。
- **私有化析构函数**：
  析构函数是销毁实例的入口，私有化后外部无法主动调用 `delete` 销毁单例实例（避免误删导致实例消失）；单例的销毁逻辑由类自身控制（如程序结束时自动销毁，或提供内部销毁接口），保证实例生命周期的可控性。

补充：除了构造/析构函数，还需要禁用拷贝构造和赋值运算符重载（设为 `delete`），否则即便构造函数私有，也可能通过“拷贝已有实例”的方式创建新实例，破坏单例特性。

### 2. 怎么用代码实现?
#### 方式 1：饿汉式（线程安全，程序启动即创建）
```cpp
#include <iostream>
using namespace std;

class Singleton {
private:
    // 1. 私有化构造/析构函数：禁止外部创建/销毁实例
    Singleton() { cout << "Singleton 实例创建" << endl; }
    ~Singleton() { cout << "Singleton 实例销毁" << endl; }

    // 2. 禁用拷贝/赋值：禁止通过拷贝创建新实例
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

    // 3. 静态私有实例：程序启动时初始化（饿汉式）
    static Singleton* instance;

public:
    // 4. 公有接口：获取唯一实例
    static Singleton* GetInstance() {
        return instance;
    }

    // 测试方法
    void ShowMsg() {
        cout << "这是单例实例的方法调用" << endl;
    }
};

// 静态成员初始化（全局区，程序启动时创建）
Singleton* Singleton::instance = new Singleton();

// 测试代码
int main() {
    Singleton* s1 = Singleton::GetInstance();
    Singleton* s2 = Singleton::GetInstance();
    
    // 验证是否为同一个实例
    cout << "s1 地址：" << s1 << endl;
    cout << "s2 地址：" << s2 << endl; // 地址相同
    
    s1->ShowMsg();
    return 0;
}
```

#### 方式 2：懒汉式（C++11 线程安全版，按需创建）
```cpp
#include <iostream>
#include <mutex>
using namespace std;

class Singleton {
private:
    // 私有化构造/析构
    Singleton() { cout << "Singleton 实例创建" << endl; }
    ~Singleton() { cout << "Singleton 实例销毁" << endl; }

    // 禁用拷贝/赋值
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

public:
    // 公有接口：C++11 局部静态变量保证线程安全
    static Singleton& GetInstance() {
        static Singleton instance; // 第一次调用时创建，程序结束时自动销毁
        return instance;
    }

    void ShowMsg() {
        cout << "这是懒汉式单例实例的方法调用" << endl;
    }
};

// 测试代码
int main() {
    Singleton& s1 = Singleton::GetInstance();
    Singleton& s2 = Singleton::GetInstance();
    
    cout << "s1 地址：" << &s1 << endl;
    cout << "s2 地址：" << &s2 << endl; // 地址相同
    
    s1.ShowMsg();
    return 0;
}
```


## 使用场景(举例)
单例模式适用于**需要全局唯一实例、且创建/销毁成本较高**的场景，常见例子：
1. **配置管理器**：
   程序的配置文件（如数据库连接信息、系统参数）只需加载一次，全局共享，用单例管理配置数据，避免重复读取文件/解析配置。
   ```
   class ConfigManager {
   public:
       static ConfigManager& GetInstance() {
           static ConfigManager instance;
           return instance;
       }
       string GetDBHost() { return db_host; } // 获取配置项
   private:
       ConfigManager() { /* 加载配置文件 */ }
       string db_host = "127.0.0.1";
   };
   ```
2. **日志管理器**：
   日志输出需要保证顺序、避免多实例写文件冲突，单例的日志类统一管理日志文件的打开/写入/关闭，确保日志内容有序且完整。
3. **数据库连接池**：
   连接池的创建和初始化成本高，全局只需一个连接池实例，所有业务逻辑通过该实例获取/归还数据库连接，避免重复创建连接池。
4. **设备管理器**：
   对硬件设备（如打印机、串口）的操作，全局只能有一个实例控制，防止多实例同时操作设备导致冲突。


END