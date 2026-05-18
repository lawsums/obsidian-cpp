- [x] 把 callback 抄过来
- [ ] 修改 callback 变成自己的形状

# 1 把 callback 抄过来
[【教程】ESP32连接华为云IoT平台-CSDN博客](https://blog.csdn.net/Beihai_Van/article/details/126634891)

```cpp
//监听华为云IoT平台下发指令并处理 
void callback(char *topic, byte *payload, unsigned int length)
{
  char *pstr = topic; //指向topic字符串，提取request_id用
 
  /*串口打印出收到的平台消息或者命令*/
  Serial.println();
  Serial.println();
  Serial.print("Message arrived [");
  Serial.print(topic);  //将收到消息的topic展示出来
  Serial.print("] ");
  Serial.println();
 
  payload[length] = '\0'; //在收到的内容后面加上字符串结束符
  char strPayload[255] = {0}; 
  strcpy(strPayload, (const char*)payload);
  Serial.println((char *)payload);  //打印出收到的内容
  Serial.println(strPayload);
 
 
  /*request_id解析部分*///后文有详细解释为什么要提取下发命令的request_id
  char arr[100];  //存放request_id
  int flag = 0;
  char *p = arr;
  while(*pstr)  //以'='为标志，提取出request_id
  {
    if(flag) *p ++ = *pstr;
    if(*pstr == '=') flag = 1;
    pstr++;
  }
  *p = '\0';  
  Serial.println(arr);
  // strcat(topic_Commands_Response, arr);
  // topic_Commands_Response.concat(arr);
 
 
  /*将命令响应topic与resquest_id结合起来*/
  char topicRes[200] = {0};
  strcat(topicRes, topic_Commands_Response);
  strcat(topicRes, arr);
  Serial.println(topicRes);
 
 
  /*payload解析*///这是对接收到的平台下发的消息或者命令进行解析
//解析程序同样可以由ArduinoJson库官方网站的ArduinoJson助手生成
  const size_t capacity_Payload_Receive = JSON_OBJECT_SIZE(3) + JSON_OBJECT_SIZE(5) + 150;
  DynamicJsonBuffer jsonBuffer_Payload(capacity_Payload_Receive);
 
  JsonObject& root_Payload = jsonBuffer_Payload.parseObject(strPayload);
 
 
//以下就是根据不同的命令或者消息进行不同的响应，此部分代码请自行修改
 if (root_Payload.success()){ //判断json解析是否成功
    if(!strcmp(root_Payload["command_name"], "user_order"))  //如果收到的内容是“用户下单”
    {
      JsonObject& paras_Payload = root_Payload["paras"];
      const char* paras_address = paras_Payload["address"]; // "88—902"
      const char* paras_user = paras_Payload["user"]; // "wksgogogo"
      const char* paras_number = paras_Payload["number"]; // "3333"
      const char* paras_day = paras_Payload["day"]; // "2022-07-21"
      const char* paras_time = paras_Payload["time"]; // "12:01"
 
      Serial.println("__________JSON Received Parse__________");
      Serial.println(paras_address);
      Serial.println(paras_user);
      Serial.println(paras_number);
      Serial.println(paras_day);
      Serial.println(paras_time);
 
      Info_UserOrder_Structure OrderInfo;
      strcpy(OrderInfo.userName, paras_user);
      strcpy(OrderInfo.address, paras_address);
      strcpy(OrderInfo.orderNum, paras_number);
      strcpy(OrderInfo.day, paras_day);
      strcpy(OrderInfo.time, paras_time);
 
      //响应函数会在下文贴出
      Command_Response(topicRes, "user_order", SUCCESS);
 
      OrderInfo_Save(OrderInfo);  //订单信息存储
 
 
      
    }
 
 
    if(!strcmp(root_Payload["command_name"], "open"))   //如果收到的内容是“开锁”
    {
      const char* paras_user = root_Payload["paras"]["user"]; 
      Serial.println("__________JSON Received Parse__________");
      Serial.println(paras_user);
 
      EOF_ELock_Unlock(paras_user);
 
      Command_Response(topicRes, "open", SUCCESS);
    }
  }
 
```

