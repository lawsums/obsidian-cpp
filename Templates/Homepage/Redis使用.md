[Redis教程](G:\BaiduNetdiskDownload\教材\大四下\0voice-Linux服务器教程\2.5Redis编程\20200523_200745.mp4)

1.讲redis的使用，主要命令的操作
2.redis的编程
redis集群，源码分析->后续课程再讲这部分

# 1 TODO
> 编程实现：
> （1）使用 string 字符串方式实现文章的写入和读取被存储的内容数据库中的键键的值
> 文章的标题			article:10086:title			message
> 文章的内容			article:10086:content		hello world
> 文章的作者			article:10086:author		darren"
> 文章创建的时间戳	article:10086:create_at		1590216574.123456

使用 set/mset 去设置

> （2）使用 hash 方式实现文章的写入和读取
> 被存储的内容数据库中的键键的值
> 文章的标题			article:10086:title			message
> 文章的内容			article:10086:content		hello world
> 文章的作者			article:10086:author		darren"
> 文章创建的时间戳	article:10086:create_at		1590216574.123456 

使用 hset 进行设置
# 2 笔记
- [00:02:28](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=02:28.56) 正式上课
- [00:04:35](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=04:35.10) 介绍redis
- [00:08:11](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=08:11.74) 安装 redis, 介绍 redis 使用多线程
- [00:12:06](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=12:06.48) 介绍三种启动方式 , redis-server 和 redis-cli
  通过 redis-server -v 查看版本
	  1. 通过前台启动
	  2. 通过后台启动 redis. conf
	  3. 开机自启动
- [00:17:45](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=17:45.58) 介绍后台启动默认端口是 **6379** 端口
- [00:21:14](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=21:14.47) 设置开机自启动
- [00:27:09](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=27:09.96) 介绍 redis-cli 的使用
- [00:34:13](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=34:13.74) 设置变量过期时间
	  EXPIRE 设置过期时间
	  TTL 检测变量剩余时间
- [00:38:59](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=38:59.03) 讲解**增删改查**命令
- [00:50:33](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=50:33.28) 使用: 作为分割符
- [00:54:03](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=54:03.30) 介绍 incr/getrange/strlen 等方法
- [01:00:53](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=1:00:53.97) 介绍消息机制
- [01:03:36](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=1:03:36.53) 介绍 hash 和字符串的区别
- [01:18:26](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/2.5Redis%E7%BC%96%E7%A8%8B/20200523_200745.mp4#t=1:18:26.80) 介绍 redis 里面的队列