
[华为云物联网平台微信小程序开发教程2.0【完整详细教程】_华为物联网平台 esp32 小程序-CSDN博客](https://blog.csdn.net/weixin_43351158/article/details/131284763)
[查询设备影子数据 - ShowDeviceShadow_设备影子_API_应用侧API参考_API参考_设备接入 IoTDA-华为云](https://support.huaweicloud.com/api-iothub/iot_06_v5_0079.html)


- [x] 获取影子数据
- [ ] 制作 app
	- [x] 使用 workbuddy 做一个界面
	- [ ] 获取影子数据
	- [ ] 添加报警逻辑

# 1 指令

## 1.1 获取 token
Headers:
![[Pasted image 20260413230811.png]]
``` json
POST

https://iam.cn-east-3.myhuaweicloud.com/v3/auth/tokens
{ 
    "auth": { 
        "identity": { 
            "methods": [ 
                "password" 
            ], 
            "password": { 
                "user": { 
                    "name": "ABC", 
                    "password": "zxcvbn1325796", 
                    "domain": { 
                        "name": "hid_2pn3upg1c2kq2ux" 
                    } 
                } 
            } 
        }, 
        "scope": { 
            "project": { 
                "name": "cn-east-3" 
            } 
        } 
    } 
}
```

## 1.2 获取影子数据
Headers 里面添加
![[Pasted image 20260413230800.png]]
X-Auth-Token 就是上一步获取的

注意 endPoint 为 `95715b4c27.st1.iotda-app.cn-east-3.myhuaweicloud.com`
``` json
GET

https://95715b4c27.st1.iotda-app.cn-east-3.myhuaweicloud.com/v5/iot/dc4853d458ef43b390cb7887faeeea34/devices/69b6a63418855b39c5037df3_TEST/shadow
```

