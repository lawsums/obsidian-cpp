
DECK: 面试题

## Qt有哪些类


## 标准答案
你想了解除了 `QTimer` / `QFileDialog` / `QPixmap` / `QTcpSocket` / `QString` 之外的 Qt 核心类，Qt 作为一站式开发框架，按功能模块划分有大量常用类，我会按**核心功能场景**分类梳理，每个类别给出最常用的类及用途，方便你理解和使用。

### 一、基础核心类（QObject 体系）
这类是 Qt 所有功能的基础，继承自 `QObject` 或为核心数据类型，是开发的「基石」：

| 类名 | 核心用途 |
|------|----------|
| `QObject` | 所有 Qt 对象的基类，提供信号槽、对象树、线程管理、事件处理等核心能力（你之前问的信号槽、对象树都基于它） |
| `QVariant` | 通用数据类型容器，可存储 int、QString、QList 等几乎所有 Qt 数据类型，常用于界面与逻辑层的数据传递 |
| `QList`/`QVector`/`QMap` | Qt 封装的容器类，比 STL 容器更适配 Qt 信号槽和跨线程场景（如 `QList<QString>` 存储字符串列表） |
| `QThread` | 线程管理类，用于创建和管理子线程，配合 `moveToThread()` 实现安全的多线程编程（避免直接继承 QThread 重写 run() 的坑） |
| `QMetaObject` | 元对象系统核心类，提供运行时类型信息、动态调用信号/槽函数（比如 `invokeMethod()` 跨线程调用函数） |

### 二、UI 界面核心类（Qt Widgets 模块）
这类是构建桌面端可视化界面的核心，也是 Qt 最常用的模块之一：
#### 1. 窗口/容器类
| 类名 | 核心用途 |
|------|----------|
| `QWidget` | 所有可视化控件的基类，可作为独立窗口或其他控件的容器（比如你之前示例中的主窗口） |
| `QMainWindow` | 带菜单栏、工具栏、状态栏的标准主窗口类，几乎所有桌面应用的主窗口都用它 |
| `QDialog` | 对话框基类，用于创建弹窗（如登录框、设置框），派生类有 `QMessageBox`（提示框）、`QFileDialog`（你提到的文件对话框） |
| `QStackedWidget` | 堆叠容器，可切换显示多个子控件（比如 App 的「首页/我的」等页面切换） |
| `QScrollArea` | 滚动容器，当子控件超出显示区域时自动生成滚动条 |

#### 2. 基础控件类
| 类名 | 核心用途 |
|------|----------|
| `QLabel` | 文本/图片显示控件（显示文字、QPixmap 图片、超链接等） |
| `QPushButton` | 按钮控件（普通按钮、复选按钮、单选按钮派生自它） |
| `QLineEdit` | 单行文本输入框（支持密码隐藏、正则验证、自动补全） |
| `QTextEdit` | 多行文本编辑控件（支持富文本、图片插入） |
| `QComboBox` | 下拉选择框（可选择预设选项，也可自定义输入） |
| `QCheckBox`/`QRadioButton` | 复选框/单选按钮（用于选项选择） |
| `QSlider`/`QSpinBox` | 滑动条/数字输入框（用于数值调节，如音量、数量） |

#### 3. 布局管理类
UI 控件需要通过布局类自动适配窗口大小，无需手动设置坐标：

| 类名            | 核心用途                   |
| ------------- | ---------------------- |
| `QVBoxLayout` | 垂直布局（控件从上到下排列）         |
| `QHBoxLayout` | 水平布局（控件从左到右排列）         |
| `QGridLayout` | 网格布局（按行/列排列控件，如表格式布局）  |
| `QFormLayout` | 表单布局（标签+输入框的成对布局，如注册页） |

### 三、图形绘制与多媒体类
用于自定义绘图、图像处理、音视频播放等场景：

| 类名              | 核心用途                                                  |
| --------------- | ----------------------------------------------------- |
| `QPainter`      | 绘图核心类，可在 `QWidget`/`QPixmap` 上绘制直线、矩形、文字、图片等（自定义控件必用） |
| `QImage`        | 像素级图像处理类（比 QPixmap 更适合像素操作，如裁剪、滤镜）                    |
| `QMediaPlayer`  | 音视频播放类（播放本地/网络音频、视频文件）                                |
| `QCamera`       | 摄像头操作类（获取摄像头画面、拍照、录像）                                 |
| `QOpenGLWidget` | OpenGL 绘图控件（高性能 3D 图形绘制）                              |

### 四、网络通信类
除了 `QTcpSocket`，Qt 还提供了覆盖主流网络协议的类：

| 类名                      | 核心用途                                           |
| ----------------------- | ---------------------------------------------- |
| `QTcpServer`            | TCP 服务器类（监听端口、接收客户端连接，配合 QTcpSocket 实现 C/S 架构） |
| `QUdpSocket`            | UDP 通信类（无连接的数据包传输，如广播、组播）                      |
| `QNetworkAccessManager` | HTTP/HTTPS 网络请求类（访问网页、接口调用，替代原生 curl）          |
| `QNetworkReply`         | 网络请求的响应类（接收 `QNetworkAccessManager` 的请求结果）     |
| `QSslSocket`            | 加密 TCP 通信类（基于 SSL/TLS 的安全套接字，如 HTTPS 底层）       |

### 五、文件与数据存储类
用于文件读写、数据库操作、配置文件管理：

| 类名 | 核心用途 |
|------|----------|
| `QFile` | 基础文件读写类（读取/写入文本/二进制文件） |
| `QDir` | 目录操作类（创建/删除目录、遍历文件列表、获取文件信息） |
| `QSettings` | 配置文件管理类（读写 ini/注册表/plist 文件，存储应用设置如窗口大小、用户偏好） |
| `QSqlDatabase` | 数据库连接类（连接 MySQL/SQLite/PostgreSQL 等数据库） |
| `QSqlQuery` | 数据库查询类（执行 SQL 语句、获取查询结果） |
| `QJsonDocument`/`QJsonObject` | JSON 解析/生成类（处理接口返回的 JSON 数据） |

### 六、其他常用功能类
| 类名 | 核心用途 |
|------|----------|
| `QTimer` | 定时器类（你提到的，用于定时触发任务，如倒计时、轮询） |
| `QProcess` | 外部进程管理类（启动/停止外部程序，如调用 cmd、python 脚本） |
| `QClipboard` | 剪贴板操作类（读写系统剪贴板的文本/图片） |
| `QDateTime` | 日期时间类（处理日期、时间、时间戳，支持格式转换） |
| `QShortcut` | 快捷键类（为控件/窗口设置键盘快捷键，如 Ctrl+C 复制） |

### 快速使用示例（基础 UI 布局）
下面用上述类搭建一个简单的 UI 界面，帮你直观理解常用类的配合：
```cpp
#include <QApplication>
#include <QMainWindow>
#include <QWidget>
#include <QVBoxLayout>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QMessageBox>

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);

    // 1. 主窗口（QMainWindow）
    QMainWindow window;
    QWidget *centralWidget = new QWidget(&window);
    window.setCentralWidget(centralWidget);

    // 2. 垂直布局（QVBoxLayout）
    QVBoxLayout *layout = new QVBoxLayout(centralWidget);

    // 3. 标签（QLabel）+ 输入框（QLineEdit）
    QLabel *label = new QLabel("请输入姓名：");
    QLineEdit *lineEdit = new QLineEdit;
    layout->addWidget(label);
    layout->addWidget(lineEdit);

    // 4. 按钮（QPushButton）+ 点击事件
    QPushButton *btn = new QPushButton("确认");
    layout->addWidget(btn);
    QObject::connect(btn, &QPushButton::clicked, [&]() {
        QString name = lineEdit->text(); // QString 读取输入
        if (name.isEmpty()) {
            // 消息框（QMessageBox）
            QMessageBox::warning(&window, "提示", "姓名不能为空！");
        } else {
            QMessageBox::information(&window, "欢迎", "你好，" + name + "！");
        }
    });

    window.setWindowTitle("Qt 常用类示例");
    window.resize(300, 200);
    window.show();

    return a.exec();
}
```

### 总结
1. Qt 类按功能可分为**基础核心类**（QObject/QVariant）、**UI 控件类**（QWidget/QMainWindow/布局类）、**图形多媒体类**（QPainter/QImage）、**网络类**（QTcpServer/QNetworkAccessManager）、**文件存储类**（QFile/QSettings/QSqlDatabase）等。
2. 开发中最常用的是 **UI 控件+布局类**（搭建界面）、**信号槽**（交互逻辑）、**文件/网络类**（数据交互），这些是 Qt 桌面应用开发的核心。
3. 所有类都围绕 `QObject` 的核心机制（信号槽、对象树）设计，掌握这个核心，学习其他类会更高效。

## 使用场景(举例)


## 我的答案



END
<!--ID: 1773973207967-->
