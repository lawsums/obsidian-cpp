```easy-tracker-daily-overview
```
```easy-tracker-year-calendar-heatmap
```
```easy-tracker-buttons
  打卡 | 1
```


# 1 规划
[[学习Linux_公司|公司]]
[[学习Linux_岗位|岗位]]

[自学计划](G:\Code\Game\talk1\嵌入式Linux自学计划_个人定制版.md)
[[路线梳理]]

---
# 2 目录 



![[Pasted image 20260905103636.png]]
基础阶段
- [ ] Linux 操作系统基础；
- [x] Linux 应用开发基础知识 ✅ 2026-09-05
- [x] 嵌入式 Linux 开发环境搭建：虚拟机、开发板配套资源 ✅ 2026-09-05
- [ ] Qt 运行

Linux 应用开发基础
- [x] 开发环境搭建、常见指令、GCC 编译器 ✅ 2026-09-05
- [ ] 文件 IO, Frame Buffer, 文字显示
	- [x] 理论基础 ✅ 2026-09-05
	- [x] ai 实践 ✅ 2026-09-05
	- [ ] 熟悉 api
- [ ] 网络协议、进程、网络编程、通信协议
- [ ] 多线程等、进程与通信、Socket 编程
	- [x] 多线程 ✅ 2026-10-02
	- [x] socket ✅ 2026-09-05
	- [ ] log4cpp

Linux 之驱动开发基础
- [ ] Linux 驱动策略及框架
- [ ] 虚拟地址、面向对象的驱动流程
- [ ] 系统掌握字符设备、块设备
- [ ] 网络设备驱动
---
# 3 笔记
## 3.1 网络编程
### 3.1.1 log4cpp
常见的日志库:
1. muduo
2. glog
3. log4z
4. log4cpp


- [00:01:27](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/5.2%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0/%E8%A7%86%E9%A2%91/%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0-20200621.mp4#t=01:27.35) 一个日志库怎么做到高效
1. 高吞吐量，**缓存最关键**，涉及到批量写入
2. 宕机了，有些日志没写进去是因为什么？
3. 同步日志，异步日志
![[Pasted image 20261002174334.png]]

好的日志log：
（1）缓存的数据长度，比如10k，写一次盘；如果缓存太长会容易断电丢失更多数据
（2）有个时间计数，已经1秒没有刷新，则需要刷新了
（3）[00:17:45](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/5.2%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0/%E8%A7%86%E9%A2%91/%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0-20200621.mp4#t=17:45.60) 同步/异步日志
	同步日志：单线程，支持批量写入才能高效
	异步日志：多线程，1 个负责格式化，1个负责批量写入

- [00:24:49](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/5.2%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0/%E8%A7%86%E9%A2%91/%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0-20200621.mp4#t=24:49.44) 介绍每个模块的作用
![[Pasted image 20261002175128.png]]

- [00:31:16](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/5.2%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0/%E8%A7%86%E9%A2%91/%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0-20200621.mp4#t=31:16.01) 看代码
- [00:35:22](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/5.2%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0/%E8%A7%86%E9%A2%91/%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0-20200621.mp4#t=35:22.53) 一个 appender 对应一种 layout 输出格式
- [00:39:04](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/5.2%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0/%E8%A7%86%E9%A2%91/%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0-20200621.mp4#t=39:04.76) 解释 Category 的原理，以及 Category 是一个树状的数据结构
- [00:42:35](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/5.2%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0/%E8%A7%86%E9%A2%91/%E5%BC%80%E6%BA%90%E6%A1%86%E6%9E%B6log4cpp%E5%92%8C%E6%97%A5%E5%BF%97%E6%A8%A1%E5%9D%97%E5%AE%9E%E7%8E%B0-20200621.mp4#t=42:35.09) 展示示例



* 2026-09-23 - 1
* 2026-10-02 - 1