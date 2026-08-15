[1-2-1_LVGL入门教程之获取课程资料_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Jf421m79x?spm_id_from=333.788.videopod.sections&vd_source=cf6228c0b4a5c283905e22fd11934994)
[05_LVGL模拟配置的工具链介绍_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1W5PGzKEkt?spm_id_from=333.788.videopod.episodes&vd_source=cf6228c0b4a5c283905e22fd11934994&p=5)

```easy-tracker-daily-overview
```
```easy-tracker-year-calendar-heatmap
```
```easy-tracker-buttons
  打卡 | 1
```

---
# 1 目录 
直接在线可视化设计LVGL界面，然后导出代码，https://anyui.tech/anyui-LIVE/workspace

---
# 2 笔记
## 2.1 韦东山

## 2.2 猛哥
### 2.2.1 LVGL模拟配置的工具链介绍
- [x] 下载 SDL ✅ 2026-08-15
- [x] 下载 lvgl-pc ✅ 2026-08-15
- [x] 安装 SDL ✅ 2026-08-15
- [x] 尝试运行 ✅ 2026-08-15
	- [ ] 头文件问题
	- [ ] SDL2问题

## 2.3 LVGL的核心流程
1. 初始化始终外设
2. 初始化 LVGL
	使用宏来初始化各部分功能，例子如下：
	![[Pasted image 20260815170204.png]]
	这里有两个 monitor，一个是帧检测帧数，一个是检测内存的。打开这两个 monitor 可以实时监测 LVGL 用到的内存。我们需要保证在单片机设备上用到的内存在可控范围内，所以这两个宏很重要。

3. 初始化 SDL，创建显示和输入设备
	 `sdl_hal_init ()` 这是 Windows 上的函数，在 STM 32 上还需要用别的函数。

4. 创建 UI
	我们这里调用的是 demo 里面的示例
5. 通过定时器不断循环
	通过 LV_Timer_Handler 返回一个我们需要睡眠的时间，然后每次睡眠这么久，这个和我们设置的帧数有关。比如说，我们设置每秒 10 帧的话，留给我们一次循环执行一次 timer handler 加睡眠的时间是 100 毫秒。所以，如果我们执行 timer handler 用了 5 毫秒，那么我们就可以睡 95 毫秒。接着继续调用 Timer Handler。Timer Handler 里面应该是执行这个超时回调函数。
	![[Pasted image 20260815170721.png]]



* 2026-08-15 - 1