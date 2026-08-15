# 1 代码

```cpp
#ifndef HWDATAACCESS_H
#define HWDATAACCESS_H

#include <stdint.h>
#include "mock_hw.h"

// ===================== 编译期硬件开关 =====================
// 把某个开关设成 0，就能"关掉"对应外设：代码不再调用硬件，而是走安全默认值。
// 例如：只想在 PC 上调 UI、没有任何硬件，就把 HW_USE_HARDWARE 设成 0。
#ifndef HW_USE_HARDWARE
  #define HW_USE_HARDWARE 1
#endif

#if HW_USE_HARDWARE
  #define HW_USE_RTC    1
  #define HW_USE_POWER  1
  #define HW_USE_LCD    1
#endif

// ===================== 接口类型定义 =====================
// UI 层只依赖这些"函数指针结构体"，不依赖任何具体硬件。

// 时间结构（对 UI 层友好的格式）
typedef struct {
    uint8_t WeekDay;
    uint8_t Month;
    uint8_t Date;
    uint8_t Year;
    uint8_t Hours;
    uint8_t Minutes;
    uint8_t Seconds;
} HW_DateTimeTypeDef;

// RTC 接口
typedef struct {
    void (*GetTimeDate)(HW_DateTimeTypeDef *nowdatetime);
    void (*SetDate)(uint8_t year, uint8_t month, uint8_t date);
    void (*SetTime)(uint8_t hours, uint8_t minutes, uint8_t seconds);
} HW_RTC_InterfaceTypeDef;

// 电源接口
typedef struct {
    uint8_t power_remain;               // 剩余电量百分比
    void (*Init)(void);
    uint8_t (*BatCalculate)(void);
} HW_Power_InterfaceTypeDef;

// LCD 接口
typedef struct {
    void (*SetLight)(uint8_t dc);       // 设置背光
} HW_LCD_InterfaceTypeDef;

// 汇总接口：一个全局实例暴露所有硬件
typedef struct {
    HW_RTC_InterfaceTypeDef RealTimeClock;
    HW_Power_InterfaceTypeDef Power;
    HW_LCD_InterfaceTypeDef LCD;
} HW_InterfaceTypeDef;

extern HW_InterfaceTypeDef HWInterface;

// ===================== 无硬件时的默认值 =====================
// 当 HW_USE_HARDWARE=0 时，GetTimeDate 返回这些默认值（供 UI 仿真展示）：
//   Year=24, Month=6, Date=23, WeekDay=7, Hours=11, Minutes=59, Seconds=55
// BatCalculate 返回 0。

#endif // HWDATAACCESS_H

```


```cpp
#include "HWDataAccess.h"
#include "mock_hw.h"

// TODO: 实现硬件中间层。参考 lecture.md 与 HWDataAccess.h 的接口约定。
//   1. 实现各个具体函数（如 HW_RTC_Get_TimeDate），用 #if HW_USE_xxx 区分：
//        - 硬件开启：调用 mock_hw.h 里的 mock 函数
//        - 硬件关闭：返回默认值（见 HWDataAccess.h 末尾的注释）
//   2. 用"指定初始化器"（designated initializer）组装全局 HWInterface。
//
//   约定：
//   - HW_RTC_Get_TimeDate(HW_DateTimeTypeDef*)  读 mock_RTC_Get 填充；关闭时填默认值
//   - HW_RTC_Set_Date/Set_Time                  开启时调 mock_RTC_SetDate/SetTime
//   - HW_Power_Init                             开启时调 mock_Power_Init
//   - HW_Power_BatCalculate                     开启时返回 mock_Power_Calculate()，关闭返回 0
//   - HW_LCD_Set_Light(dc)                      开启时调 mock_LCD_SetLight(dc)
//
//   UI 层只通过 HWInterface.xxx 调用，不知道（也不关心）背后是真实硬件还是 mock。

static void HW_RTC_Get_TimeDate(HW_DateTimeTypeDef *nowdatetime) {
#if HW_USE_RTC
    // 硬件开启：调用 mock_RTC_Get 填充 nowdatetime
    mock_RTC_Get((MockRTC_t*)nowdatetime);
#else
    // 硬件关闭：填默认值
    nowdatetime->WeekDay = 1;
    nowdatetime->Month = 1;
    nowdatetime->Date = 1;
    nowdatetime->Year = 0;
    nowdatetime->Hours = 0;
    nowdatetime->Minutes = 0;      
    nowdatetime->Seconds = 0;
#endif
}

static void HW_RTC_Set_Date(uint8_t year, uint8_t month, uint8_t date) {
#if HW_USE_RTC
    mock_RTC_SetDate(year, month, date);
#endif
}

static void HW_RTC_Set_Time(uint8_t hours, uint8_t minutes, uint8_t seconds) {
#if HW_USE_RTC
    mock_RTC_SetTime(hours, minutes, seconds);
#endif
}

static void HW_Power_Init(void) {
#if HW_USE_POWER
    mock_Power_Init();
#endif
}

static uint8_t HW_Power_BatCalculate(void) {
#if HW_USE_POWER
    return mock_Power_Calculate();
#else
    return 0;
#endif
}

static void HW_LCD_Set_Light(uint8_t dc) {
#if HW_USE_LCD
    mock_LCD_SetLight(dc);
#endif
}

HW_InterfaceTypeDef HWInterface = {
    .RealTimeClock = {
        .GetTimeDate = HW_RTC_Get_TimeDate,
        .SetDate = HW_RTC_Set_Date,
        .SetTime = HW_RTC_Set_Time
    },
    .Power = {
        .power_remain = 0,
        .Init = HW_Power_Init,
        .BatCalculate = HW_Power_BatCalculate
    },
    .LCD = {
        .SetLight = HW_LCD_Set_Light
    }
};

```

# 2 体现出的设计模式

### 2.1.1 单例模式 (Singleton Pattern)

- **出处**：GoF（Gang of Four）23种经典设计模式之一。
- **你的体现**：`HWInterface` 这个全局结构体。
- **目的**：保证整个系统中，硬件抽象层只有**唯一一个实例**。UI 层不需要每次都去创建硬件对象，直接通过全局唯一的入口访问即可，避免了状态不一致的问题。

### 2.1.2 适配器模式 (Adapter Pattern)

- **出处**：同样是 GoF 23种经典设计模式之一。
- **你的体现**：`HW_InterfaceTypeDef` 里面的那些**函数指针**。
- **目的**：将底层千奇百怪的硬件接口（比如 `mock_RTC_Get`、`mock_LCD_SetLight`），转换成了 UI 层统一认识的标准接口（比如 `GetTimeDate`、`SetLight`）。
- **好处**：如果明天你把底层的 LCD 驱动从 A 厂商换成了 B 厂商，UI 层的代码**一行都不用改**，只需要在底层修改适配器的实现即可。这就是设计模式中常说的“面向接口编程，而不是面向实现编程”。

### 2.1.3 （进阶）硬件抽象层 (HAL, Hardware Abstraction Layer)

虽然 HAL 严格来说更像是一种**架构模式**或**设计原则**，但它大量借用了设计模式的思想。

- **你的体现**：通过 `#if HW_USE_RTC` 这种宏开关，把真实硬件和 Mock 测试环境隔离开来。
- **目的**：让软件架构与具体的物理硬件解耦。UI 层只关心“我要显示什么”，完全不关心“底层是哪块芯片在发光”。

**总结一下：**  
你在写这段代码时，其实已经不知不觉地运用了高级软件工程的思维。把**单例模式**（提供唯一访问点）和**适配器模式**（统一接口标准）结合起来，这就是为什么你的代码看起来非常整洁、解耦做得非常好的原因！

---

要不要我帮你把 `HW_Init()` 加进去？这是最顺手的一步，加完你就可以直接用它了。

# 3 单例模式的两个形式：饿汉式和懒汉式

“饿汉式”（Eager Initialization）和它的兄弟“懒汉式”（Lazy Initialization）是单例模式中最经典的两种实现方式。这两个词非常形象地描述了对象创建的时机。

### 3.1.1 饿汉式（Eager Initialization）

**“饿了，所以一出生（程序启动）就赶紧把东西准备好。”**

- **特点**：不管后面用不用得到，在程序启动、加载全局变量时，就立刻把单例对象创建出来并初始化好。
- **在你的代码中**：
    
    ```c
    // 全局变量，在 main() 函数执行之前，系统就已经把它分配好并赋值了
    HW_InterfaceTypeDef HWInterface = { ... }; 
    ```
    
- **优点**：非常安全，不存在多线程竞争的问题（因为程序启动时就建好了），随时拿来就能用。
- **缺点**：如果这个对象很大，或者初始化非常耗时，而程序最终可能根本不用它，就会白白浪费启动时间和内存。

### 3.1.2 懒汉式（Lazy Initialization）

**“懒，不到万不得已（第一次被调用时）绝不动手。”**

- **特点**：一开始什么都不创建。只有当 UI 层或其他模块**第一次**真正需要用到这个单例时，才去检查它存不存在，不存在的话再去创建它。
- **C 语言伪代码**：
    
    ```c
    // 一开始指针是空的
    HW_InterfaceTypeDef *g_HWInterface = NULL; 
    
    // 提供一个获取接口
    HW_InterfaceTypeDef* HWInterface_GetInstance() {
        if (g_HWInterface == NULL) {
            // 第一次调用时才去分配内存和初始化
            g_HWInterface = malloc(sizeof(HW_InterfaceTypeDef));
            // 执行初始化...
        }
        return g_HWInterface;
    }
    ```
    
- **优点**：节省启动时间，如果系统一直不用这个模块，它就永远不会被创建。
- **缺点**：在多线程环境下，如果两个线程同时调用 `GetInstance()`，可能会创建出两个实例（需要加锁解决，很麻烦）。而且每次调用都要判断一次 `if (== NULL)`，有一点点性能损耗。

### 3.1.3 总结：嵌入式中怎么选？

在嵌入式开发中，**90% 以上的情况都会选择“饿汉式”**（也就是你现在的做法）。

因为嵌入式系统的资源（内存、Flash）是确定的，硬件模块（如 RTC、电源、LCD）在系统启动后大概率都是要用的。用“饿汉式”直接在编译期或启动期把结构体组装好，既没有运行时 `malloc` 内存碎片的风险，也不需要加锁，简单、高效、绝对安全。

所以，你现在的代码就是非常标准的**C语言全局单例（饿汉式）**写法，非常棒！

---

要不要我把 `HW_Init()` 加进去？这样 UI 层只需要在 main() 里调用一次，既清晰又不容易漏掉。