[1](G:\BaiduNetdiskDownload\教材\大四下\0voice-Linux服务器教程\8.互联网云盘项目专题\8.2高负载Nginx搭建与使用FastCGI接口编程\视频\20200711_1.mp4)
[2](G:\BaiduNetdiskDownload\教材\大四下\0voice-Linux服务器教程\8.互联网云盘项目专题\8.2高负载Nginx搭建与使用FastCGI接口编程\视频\20200711_2.mp4)
[3](G:\BaiduNetdiskDownload\教材\大四下\0voice-Linux服务器教程\8.互联网云盘项目专题\8.2高负载Nginx搭建与使用FastCGI接口编程\视频\20200711_3.mp4)

---
# 1 笔记
## 1.1 第一部分
- [00:05:23](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_1.mp4#t=05:23.24) 配置
- [00:15:46](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_1.mp4#t=15:46.85) 介绍 fastDFS
  fastDFS 是一个集群分布式存储系统, 可以有效存储网盘文件并且与 nginx 配合实现 http网址下载文件, 而且是 C 源码写的, 所以本项目使用 fastDFS
- [00:24:50](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_1.mp4#t=24:50.96) 介绍 fastDFS 同步机制
  组内多副本冗余同步
- [00:30:28](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_1.mp4#t=30:28.52) 介绍 group 之间的区别

## 1.2 第二部分

- [00:11:48](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_2.mp4#t=11:48.29) 介绍架构并使用 fdfs_upload_file 上传文件
- [00:14:14](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_2.mp4#t=14:14.36) 尝试编译 fdfs_upload_file 2, 编码有问题
- [00:20:19](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_2.mp4#t=20:19.41) 介绍两种调用 fdfs 方式
- [00:26:29](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_2.mp4#t=26:29.60) 介绍云存储服务
  1. 云服务收费
  2. 创建/bucket/文件夹
FastDFS
	1. 搭建环境, 工程师维护, 拓展
	2. 大厂, 内部分布式存储

## 1.3 第三部分 fastcgi

- [00:01:22](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=01:22.00) 介绍 cgi 调用流程
  每次任务一来, 创建一个新的 cgi, 执行完毕之后销毁这个 cgi
![[Pasted image 20260414194835.png]]

- [00:05:42](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=05:42.02) 介绍 fastcgi 工作流程, 说明 fastcgi 优势
  每一种任务只对应一个 fastcgi 进程, 这个 cgi 执行完任务之后陷入阻塞态, 类似于单例模式.
- [00:14:01](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=14:01.06) http_fastcgi_module/nginx_fastcgi_module
- [00:21:02](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=21:02.96) 流程图
  ![[Pasted image 20260414200205.png]]
- [00:31:49](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=31:49.25) 询问客户端问题
- [00:35:42](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=35:42.93) 使用tomcat借此解释 nginx 和 spwan-cgi, fastcgi 的关系
  ![[Pasted image 20260414202818.png]]
  
- [00:43:48](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=43:48.82) 对比 openresty\tomcat
- [00:48:21](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=48:21.36) 写了一个日志小程序
- [00:49:30](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.2%E9%AB%98%E8%B4%9F%E8%BD%BDNginx%E6%90%AD%E5%BB%BA%E4%B8%8E%E4%BD%BF%E7%94%A8FastCGI%E6%8E%A5%E5%8F%A3%E7%BC%96%E7%A8%8B/%E8%A7%86%E9%A2%91/20200711_3.mp4#t=49:30.93) 开始讲上传
---
# 2 TODO
## 2.1 为什么要分group? group内为什么要分组?
这个问题切中了 FastDFS 架构设计最核心的**二元逻辑**：用 Group 实现**容量扩容**，用组内多机（副本）实现**可靠性与高可用**。

简单来说：**Group 是为了“无限存”，组内的多机是为了“不怕坏”。**

### 2.1.1 为什么要分 Group？（核心：容量横向扩容）
FastDFS 的设计目标是**突破单台服务器的磁盘瓶颈**。

*   **容量上限**：单台服务器的硬盘再大，也有上限。如果不分 Group，当数据量超过 100TB 时，单台机器根本存不下，或者读写性能会因为磁盘 I/O 繁忙而急剧下降。
*   **独立容量**：每一个 Group 都是一个**独立的存储单元**。
    *   Group 1 存满了，可以无缝添加 Group 2、Group 3...
    *   整个集群的总容量 = 所有单个 Group 容量的总和。
    *   这就是**横向扩展（Scale-out）**的核心逻辑。

### 2.1.2 Group 内为什么要分组（多副本）？（核心：数据可靠性与高可用）
Group 内部的多机机制，官方术语叫**“多副本复制”（Replication）**。

*   **防硬件故障**：磁盘会坏，机器会宕机。如果 Group 里只有 1 台机器，一旦挂了，数据就彻底丢失或不可读。
*   **自动容错**：Group 内的机器存储完全相同的数据（副本）。
    *   当其中一台机器挂了，Tracker 服务器会自动感知，后续的读取请求会自动转发到 Group 内其他正常的机器上。
    *   **读取性能提升**：对于读多写少的场景，Group 内的多台机器可以并行处理读取请求，分摊压力（相当于多台服务器一起干活）。

### 2.1.3 两者结合的架构优势（1+1 > 2）
FastDFS 通过这种“套娃式”设计，解决了分布式存储最难的两个矛盾：

| 维度 | 机制 | 解决的问题 |
| :--- | :--- | :--- |
| **容量** | **分 Group** | 解决数据无限增长的问题，想存多少就加多少组。 |
| **安全** | **组内多副本** | 解决单盘/单机故障导致的数据丢失问题，确保数据不丢。 |
| **性能** | **组内多读** | 利用组内多机并行读取，提升并发访问速度。 |
| **成本** | **同组同容量** | 相比于做 RAID（需要昂贵的企业级硬盘），用普通服务器组建 Group 成本更低。 |

### 2.1.4 总结
*   **Group（组）** = **容量桶**。你可以把它想象成一个个独立的“硬盘柜”，柜子满了就换新柜子，整个仓库就能装下无限数据。
*   **组内多机（副本）** = **备胎/保镖**。每个柜子里放两份一样的数据，万一其中一个硬盘坏了，还有备胎顶着，不影响使用。

这就是 FastDFS 这种轻量级分布式文件系统最精妙的底层设计。

既然对 FastDFS 的底层机制这么感兴趣，需要我为你整理一份**Group 扩容与数据迁移的实战操作清单**吗？包含如何指定新机器加入已有 Group 及同步策略配置。

---
我懂你要的**架构视角**了——不是讲 CGI/FastCGI 本身，而是：
**在 前端服务器 → 后端 → 数据库/缓存/存储 这条链里，FastCGI 到底算什么角色？**

直接给你结论：
✅ **FastCGI 不是请求调度器**
✅ **FastCGI 是「网关 + 协议 + 进程托管层」**
✅ 它的核心作用：**把 Web 服务器 和 后端应用 解耦**

---

## 2.2 Fastcgi 起到什么作用
```
浏览器
  ↓
Nginx/Apache（Web 服务器）
  ↓ ←←← 这里就是 FastCGI
后端应用（PHP/Java/Python 等业务逻辑）
  ↓
Redis / MySQL / 分布式存储
```

### 2.2.1 FastCGI 在这里的真实作用
它只干一件**关键事**：
**让 Web 服务器（Nginx）不直接嵌业务代码，而是通过一个稳定通道，把请求转给后面的应用进程。**

- Nginx 只管：HTTP、反向代理、负载均衡、静态资源
- FastCGI 只管：**建立一条长连接通道**，把请求转给后面的应用进程
- 后端应用只管：业务逻辑、读 DB、读缓存、写存储

#### 2.2.1.1 所以它的角色是：
**网关层 / 协议层 / 进程托管层**
不是调度器，不是负载均衡，不是业务逻辑，也不是数据访问。

---

### 2.2.2 那「请求调度器」是谁？
- **Nginx 本身才是入口调度器**（负载均衡、路由、限流）
- **FastCGI 进程管理器（如 php-fpm）是内部小调度**
  它只是把进来的请求分给自己池里空闲的 worker

**FastCGI ≠ 全局调度器**
它是**让后端能长期存活、让 Web 服务器和后端分离**的那一层。

---

### 2.2.3 用最直白的一句话总结（你要的架构视角）
在
**Web 服务器 → FastCGI → 后端应用 → DB/Redis/存储**
这个链路里：

> **FastCGI 是 Web 服务器与后端应用之间的「持久化网关通道」，
>  负责把请求转发给常驻的后端进程，而不是每次都新建销毁。**

---

### 2.2.4 对你理解架构的意义
- 有了 FastCGI：
  - Nginx 不用管后端怎么写
  - 后端可以独立部署、重启、扩缩容
  - 后端可以连接 MySQL/Redis/存储，**FastCGI 完全不碰这些**

→ **FastCGI 只负责「Web 服务器 ↔ 后端」这一段。**

---

如果你愿意，我可以给你画一张**极简架构图**，标出：
Nginx、FastCGI、应用、Redis、MySQL 各自的边界与职责，一眼看懂。