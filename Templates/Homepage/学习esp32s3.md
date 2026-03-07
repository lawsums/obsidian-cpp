
[ESP32入门教程之ESP-MESH_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1a4VEz9Ep3/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994)

- [x] ESP32开发环境搭建(Platformlo+arduino)
- [x] ESP32入门教程之点亮LED
- [x] ESP32入门教程之ADC（含串行通信） 
- [x] ESP32入门教程之通过API获取天气数据
- [ ] ESP32-CAM视频流传输教程（网页端+APP）
- [x] ESP32入门教程之BLE
- [x] ESP32入门教程之DHT(温湿度)+LCD1602
- [ ] ESP32连接阿里云教程（温湿度上传到云端+手.
- [ ] ESP32连接阿里云教程（手机远程控制LED亮灭.
- [ ] ESP32-CAM内网穿透教程
- [x] ESP32入门教程之ESP-MESH
- [ ] ESP32入门教程之ESP-MESH+MQTT

# 1 笔记

## 1.1 ESP 32 入门教程之 ESP-MESH
### 1.1.1 下载 platformio 工具包
这里需要注意的是首先要下载成功 platformio 的 esp32 和 esp32s3 的工具包
这里最好**加入镜像源**同时**在早上下载**
[100%解决Platform IO IDE无法创建工程_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV12oSGBiEJT/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994)

### 1.1.2 烧录代码
需要注意的点在于
1. 按照自己的传感器调整代码中` DHTType 是 DHT 11 还是 DHT 22`
2. 同时需要对应好端口, 这里默认传感器端口是 pin4

### 1.1.3 接收的时候
需要注意对应好频率是 115200 Hz 而不是其他频率

### 1.1.4 如果程序需要重新烧录
**断开其他串口连接**, 只留下这个芯片, 然后**按住 rst 键**烧录