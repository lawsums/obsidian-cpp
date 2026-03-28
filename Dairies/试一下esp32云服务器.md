
- [x] 安装 AnLink 进行手机投屏
- [x] 创建华为云服务
	- [x] 使用13913829509 作为 ABC 账号手机号码
	- [x] 密钥文件: C:\Users\Administrator\Downloads\credentials.csv
	- [x] 保存所有参数
- [x] 启动 APP
	- [x] 填写所有参数
	- [x] 测试成功
- [x] 启动 esp32 和 esp32s3
- [x] 手动上传数据
	- [x] $oc/devices/69 b6a63418855b39c5037df3_TEST/sys/properties/report
	- [x] [设备属性上报_设备数据上报_消息通信_用户指南_设备接入 IoTDA-华为云](https://support.huaweicloud.com/usermanual-iothub/iot_01_0326.html)
- [x] 修改成 WiFiClientSecure 跳过 TTL 验证

获取设备参数
```
{
    "username": "69b6a63418855b39c5037df3_TEST",
    "password": "d28e1653bc8029f17ecdb5685e7d79127b29b99f39150495e0d8b11af72dddf6",
    "clientId": "69b6a63418855b39c5037df3_TEST_0_0_2026032806",
    "hostname": "95715b4c27.st1.iotda-device.cn-east-3.myhuaweicloud.com",
    "port": 8883,
    "protocol": "MQTTS"
}
```

这里**暂时**没有修改
![[Pasted image 20260328143503.png]]

- [ ] device_id 不知道是MQTT_USRNAME 或者 CLIENT_ID
	- [x] MQTT_USRNAME
	- [ ] CLIENT_ID