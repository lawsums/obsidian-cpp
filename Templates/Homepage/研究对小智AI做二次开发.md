```easy-tracker-daily-overview
```
```easy-tracker-year-calendar-heatmap
```
```easy-tracker-buttons
  打卡 | 1
```

---
# 1 目录 
- [ ] codebase-to-course
	- [ ] 生成教程
	- [ ] 过一遍
- [ ] promentor
	- [ ] 生成教程
	- [ ] 过一遍
- [ ] workbuddy 
	- [ ] 生成面试题
	- [ ] 过一遍
	- [ ] 掌握一般的、掌握不好的、没答出来的、不知道的，全都整理到 anki 里
- [ ] 

- [ ] 用 deepseek harness 了解新增的嵌入式岗位目前对于 ai 技能的需求
- [ ] 了解立芯以及多个培训班新增的嵌入式方向（不是说你要去羡慕或者去上这个培训班，而是说了解他们的方向，预判他们的方向，提前走他们的方向。）
- [x] 看看直接做 esp32-掌机agent 方向的研究可行性（感觉很大） ✅ 2026-08-22


那你觉得如果能对小智 AI 做二次开发，就完全抛弃之前的手表项目，实际上这种想法肯定是不对的。因为我们这手表项目，它培养的是我们对 LVGL 这个技术栈的知识掌握程度，还有手表这个项目里面的页面排布和 BSP 驱动功能实现等等，这个对整机来说道理差不多的。

[菜鸡专属/ESP32S3-AI桌面小电视](https://gitee.com/zerocjzs/esp32-s3-ai-desktop-small-tv)
[ai嵌入式开发ai小智，有手就会_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Vp9SBFE1S/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994)
[［开源］一个ESP32多功能掌机|FreeRTOS+LVGL_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1afCLBgEsR/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994)
[4-3.SquareLine如何使用_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1pfRCBPEdC?spm_id_from=333.788.videopod.sections&vd_source=cf6228c0b4a5c283905e22fd11934994&p=19)

## 1.1 智能药箱助手


---
# 2 笔记
## 2.1 IDF 安装
- [x] 安装环境 [ESP-IDF Installation Manager Downloads](https://dl.espressif.com/dl/eim/?tab=offline)，安装的时候路径不要有中文 ✅ 2026-08-23
- [x] 安装驱动程序 ✅ 2026-08-23
- [x] 安装 vscode 拓展 ✅ 2026-08-23

### 2.1.1 学习资源
[ESP32-IDF 使用说明 | 微雪文档平台](https://docs.waveshare.net/RGB-Matrix-Px-96x48/ESP32/ESP-IDF/#esp-idf-tutorial)

## 2.2 烧录
#### 2.2.1.1 第1步：获取源代码

1. **下载源码**：
    
    - 访问项目主页：[https://github.com/78/xiaozhi-esp32](https://github.com/78/xiaozhi-esp32)
        
    - 点击 **Code** 按钮，选择 **Download ZIP** 下载压缩包并解压到任意目录。
        
    - **（推荐）** 如果电脑已安装Git，建议使用命令行克隆，以避免ZIP下载可能出现的文件不完整问题：
        
        ```bash
        git clone https://github.com/78/xiaozhi-esp32
        ```
        
2. **打开ESP-IDF终端**：
    
    - 进入解压后的项目目录。
        
    - 打开命令终端，或双击桌面的 **ESP-IDF 5.5 PowerShell** 快捷方式。
        
3. **进入项目目录**（请将路径替换为你自己的实际解压路径）：
    
    ```bash
    cd J:\xiaozhi-esp32-main_2\xiaozhi-esp32-main
    ```
    

---

#### 2.2.1.2 第2步：设置芯片类型

**重要：** 默认目标芯片是 **ESP32**。如果你的开发板是其他型号，**必须先**执行对应命令。

- **若芯片为 ESP32-S3**：
    
    ```bash
    idf.py set-target esp32s3
    ```
    
- **若芯片为 ESP32-C3**：
    
    ```bash
    idf.py set-target esp32c3
    ```
    
    _（注意：设置完C3后，后续在menuconfig中需选择对应的C3板型）_
    

---

#### 2.2.1.3 第3步：选择开发板型号

1. 打开配置菜单：
    
    ```bash
    idf.py menuconfig
    ```
    
2. 在图形化界面中，进入 **Xiaozhi Assistant** 选项。
    
3. 进入 **Board Type** 子菜单，从列表中选择与你硬件匹配的开发板型号。
    
    - **关键点**：务必根据实际硬件选择。若为ESP32-C3板，需在此选择C3对应型号（且之前已执行`set-target`命令）。
        
4. 保存并退出：
    
    - 按键盘 **`S`** 键保存配置。
        
    - 按 **`Esc`** 键退出menuconfig界面。
        

---

#### 2.2.1.4 第4步：编译与烧录

1. **开始编译**：
    
    ```bash
    idf.py build
    ```

2. **编译并烧录固件，同时开启日志监控**（一条命令完成）：
    
    ```bash
    idf.py build flash monitor
    ```
    
    - 执行此命令后，固件将烧录到开发板，并自动打开串口监视器显示运行日志。
        
    - **退出监视器**：按 **`Ctrl + ]`** 组合键。

## 2.3 智能药箱助手

![[Templates_研究对小智AI做二次开发_步骤|步骤]]


* 2026-08-23 - 1
* 2026-08-24 - 1