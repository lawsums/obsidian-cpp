
[1](G:\BaiduNetdiskDownload\教材\大四下\0voice-Linux服务器教程\8.互联网云盘项目专题\8.5文件接口设计与Json协议\视频\文件接口设计与Json协议（上）.mp4)
[2](G:\BaiduNetdiskDownload\教材\大四下\0voice-Linux服务器教程\8.互联网云盘项目专题\8.5文件接口设计与Json协议\视频\文件接口设计与Json协议（下）_mp3.mp4)

---

# 1 笔记


- [00:02:02](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.5%E6%96%87%E4%BB%B6%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1%E4%B8%8EJson%E5%8D%8F%E8%AE%AE/%E8%A7%86%E9%A2%91/%E6%96%87%E4%BB%B6%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1%E4%B8%8EJson%E5%8D%8F%E8%AE%AE%EF%BC%88%E4%B8%8A%EF%BC%89.mp4#t=02:02.07) 讲解分享文件
- [00:21:45](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.5%E6%96%87%E4%BB%B6%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1%E4%B8%8EJson%E5%8D%8F%E8%AE%AE/%E8%A7%86%E9%A2%91/%E6%96%87%E4%BB%B6%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1%E4%B8%8EJson%E5%8D%8F%E8%AE%AE%EF%BC%88%E4%B8%8A%EF%BC%89.mp4#t=21:45.09) 删除文件
- [00:48:31](file:///G:/BaiduNetdiskDownload/%E6%95%99%E6%9D%90/%E5%A4%A7%E5%9B%9B%E4%B8%8B/0voice-Linux%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%95%99%E7%A8%8B/8.%E4%BA%92%E8%81%94%E7%BD%91%E4%BA%91%E7%9B%98%E9%A1%B9%E7%9B%AE%E4%B8%93%E9%A2%98/8.5%E6%96%87%E4%BB%B6%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1%E4%B8%8EJson%E5%8D%8F%E8%AE%AE/%E8%A7%86%E9%A2%91/%E6%96%87%E4%BB%B6%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1%E4%B8%8EJson%E5%8D%8F%E8%AE%AE%EF%BC%88%E4%B8%8A%EF%BC%89.mp4#t=48:31.83) 上传文件

# 2 TODO
## 2.1 分享文件的流程
1. 先去redis分享文件集合中判断是否有这个文件, 如果有, 说明已经分享过了, 直接结束
2. 如果没有, 再去mysql找（可能是 Redis 缓存过期、数据淘汰、冷启动无数据）, 如果找到了加入redis当中, 然后直接结束
3. 确认文件为全新未分享状态，执行 MySQL 新增 / 写入，完成数据永久存储。
4. 把当前文件标识写入 Redis Set，完成内存层去重标记，后续相同请求可被快速拦截。
5. 同步更新 Redis Hash，用来存放文件的完整元数据（文件名、大小、分享人、时间等），支撑后续高频详情查询，减少 MySQL 压力。

## 2.2 删除文件的流程
1. 删除storage中的文件
2. 删除redis记录
3. 删除mysql记录

## 2.3 上传文件
