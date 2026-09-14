这张图讲的是 **Linux 内核对设备树（Device Tree）的处理流程**，核心是一条转换链：

```
DTS  →  DTB  →  device_node  →  platform_device
```

下面按图中的四个步骤和结构体逐一解释。

---

## 一、整体流程（图的顶部那条箭头链）

```
   PC端             内核                内核
DTS ──→ DTB ──→ device_node ──→ platform_device
```

| 阶段 | 在哪做 | 产物 |
|------|--------|------|
| ① 编译 | PC 上（dtc 工具） | `.dtb` |
| ② 传递 | u-boot | 把 `.dtb` 交给内核 |
| ③ 解析 | 内核 | `device_node` 树 |
| ④ 转换 | 内核 | `platform_device` |

一句话：**设备树从“文本描述”一步步变成“内核能用的数据结构”。**

---

## 二、四个步骤详解

### ① DTS 在 PC 上被编译为 DTB

- **DTS**（Device Tree Source）：人写的文本，描述板子上有什么硬件。
- **DTB**（Device Tree Blob）：编译后的二进制，给内核读。
- 编译工具：`dtc`（Device Tree Compiler）。

```
foo.dts  --dtc-->  foo.dtb
```

### ② u-boot 把 DTB 文件传给内核

- u-boot 启动内核时，把 `.dtb` 的**内存地址**作为参数传给内核。
- 内核启动早期就知道“去哪读设备树”。

### ③ 内核解析 DTB，每个节点变成 `device_node`

- 内核把 DTB 里的每个节点（node）解析成一个 **`struct device_node`**。
- 整棵树变成一棵 `device_node` 树，和 DTS 里的层级一一对应。

### ④ 某些 `device_node` 会被转换为 `platform_device`

- 不是所有节点都转，**只有需要参与 platform 总线匹配的节点**才转。
- 转换后，就变成了我们前面聊的 `platform_device`，可以和 `platform_driver` 配对，触发 `probe`。

---

## 三、左侧结构体：`struct device_node`

这是内核对**设备树一个节点**的表示。

```c
struct device_node {
    const char *name;              // 节点名
    const char *type;              // 设备类型
    phandle phandle;               // 节点句柄（被别的节点引用时用）
    const char *full_name;         // 完整路径名
    struct fwnode_handle fwnode;   // 统一的固件节点句柄

    struct property *properties;   // 本节点的属性链表
    struct property *deadprops;    // 已删除的属性
    struct device_node *parent;    // 父节点
    struct device_node *child;     // 第一个子节点
    struct device_node *sibling;   // 下一个兄弟节点
    struct kobject kobj;           // 对应 /sys 里的 kobject
    unsigned long _flags;
    void *data;
    ...
};
```

**关键点：**

- **`properties`**：一个节点上的所有属性（如 `reg`、`compatible`、`gpios`）组成一个链表。
- **`parent` / `child` / `sibling`**：靠这三个指针把整棵树串起来。
  - `parent` → 父节点
  - `child` → 第一个孩子
  - `sibling` → 下一个兄弟

所以 `device_node` 树就是**用“左孩子 + 右兄弟”方式表示的树**。

对应到 DTS：

```dts
leds {                  // 一个 device_node
    compatible = "100ask,leds";   // 属性
    led0 {              // 子 device_node
        gpios = <...>;
    };
    led1 {              // 兄弟 device_node（led0 的 sibling）
        gpios = <...>;
    };
};
```

---

## 四、右侧结构体：`struct property`

这是内核对**节点里一个属性**的表示。

```c
struct property {
    char *name;                      // 属性名，如 "compatible"
    int length;                      // 值的长度
    void *value;                     // 值（二进制）
    struct property *next;           // 下一个属性（链表）
    unsigned long _flags;
    unsigned int unique_id;
    struct bin_attribute attr;       // 对应 /sys 里的属性文件
};
```

**关键点：**

- **`name` / `value` / `length`**：一个属性就是“名字 + 一段二进制值”。
- **`next`**：所有属性串成链表，头就是 `device_node->properties`。
- 比如 DTS 里的：

```dts
compatible = "100ask,leds";
reg = <0x020c406c 0x04>;
```

解析后就是两个 `property`：

```
property("compatible", "100ask,leds")
property("reg", <0x020c406c 0x04>)
```

用 `next` 连起来，挂在 `device_node->properties` 上。

---

## 五、把两个结构体和 DTS 对应起来

```dts
leds {                          ┐
    compatible = "100ask,leds"; │  ← 一个 device_node
    reg = <0x020c406c 0x04>;    │     它的 properties 链表有两条 property
                                │
    led0 {                      │  ← child
        gpios = <...>;          │
    };                          │
                                │
    led1 {                      │  ← child 的 sibling
        gpios = <...>;          │
    };                          ┘
};
```

对应关系：

| DTS 元素 | 内核结构 |
|----------|---------|
| 一个节点 `leds {}` | 一个 `device_node` |
| 节点里的 `compatible = ...` | 一个 `property` |
| 嵌套的子节点 `led0 {}` | `device_node->child` |
| 同级的 `led1 {}` | `led0` 的 `sibling` |
| 节点的父级 | `device_node->parent` |

---

## 六、和第 ④ 步的关系：为什么要转成 `platform_device`

`device_node` 只是“设备树的解析结果”，是**描述性的**。  
而 `platform_device` 是**能被 platform 总线用来和 driver 配对的实体**。

所以流程是：

```
device_node（描述“有什么”）
        │  内核挑选一部分节点
        ▼
platform_device（可参与总线匹配的“设备”）
        │  和 platform_driver 名字/compatible 匹配
        ▼
      probe()
```

这正好接上你之前的问题：

- **设备**从哪来？→ 设备树解析成 `device_node`，再转成 `platform_device`。
- **驱动**从哪来？→ `platform_driver_register()` 注册。
- **谁配对？** → platform 总线，按 `compatible` / `name` 匹配，成功调 `probe`。

---

## 七、一句话总结

这张图讲的是：

> **设备树在内核里的“落地过程”**：  
> PC 上把 `.dts` 编成 `.dtb` → u-boot 传给内核 → 内核解析成 `device_node` 树（每个节点含一串 `property`）→ 其中一部分再转成 `platform_device`，供 platform 总线与驱动配对。

- `device_node`：内核眼中的“一个设备树节点”
- `property`：内核眼中的“一个属性”
- `platform_device`：能被总线用来配对的“设备”

这样，设备树里的硬件描述就真正变成了驱动可以使用的数据结构。