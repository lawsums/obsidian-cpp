# 1 curl 超精简必背基础用法（C++ HTTP服务器调试专用）
## 1.1 一、基础最简语法
```bash
curl [选项] 网址
```

---
## 1.2 二、无参数：发 GET 请求
直接访问，打印响应体
```bash
curl 127.0.0.1:8080
curl https://www.baidu.com
```

---
## 1.3 三、核心调试参数（写服务器必加）
### 1.3.1 `-v` 看全过程（重点⭐）
打印**TCP连接、请求头、响应头、收发细节**，排BUG神器
```bash
curl -v 127.0.0.1:8080
```

### 1.3.2 `-X` 指定请求方法
```bash
# POST
curl -X POST 127.0.0.1:8080
# PUT
curl -X PUT 127.0.0.1:8080
```

### 1.3.3 `-d` 携带POST表单数据
自动加请求头：`Content-Type: application/x-www-form-urlencoded`
```bash
curl -X POST 127.0.0.1:8080 -d "name=peng&age=20"
```

---
## 1.4 四、自定义请求头 `-H`
测试你的HTTP解析器必备
```bash
# 单行
curl -H "Content-Length: 100" 127.0.0.1:8080

# JSON POST 标准写法（后端高频）
curl -v -X POST 127.0.0.1:8080 \
-H "Content-Type: application/json" \
-d '{"msg":"hello"}'
```

---
## 1.5 五、常用辅助参数
1. `-i` 只看响应头+响应体（比-v简洁）
```bash
curl -i 127.0.0.1:8080
```
2. `-L` 跟随重定向
```bash
curl -L baidu.com
```
3. `--limit-rate` 限速（模拟粘包/分片，测你的`push_chunk`）
```bash
curl -v --limit-rate 1k 127.0.0.1:8080 -d "xxxxxxxxx"
```

---
## 1.6 六、你之前踩坑复盘
错误写法（引号+端口冒号写错 → shell挂起）：
```bash
curl -v -X POST 127.0.0.1"8080 -d name=peng
```
✅ 正确标准：
```bash
curl -v -X POST 127.0.0.1:8080 -d "name=peng"
```

---
## 1.7 七、适配你当前 HTTP 分片解析项目的测试指令
1. 基础GET测头部解析
```bash
curl -v 127.0.0.1:8080
```
2. POST带正文测 Content-Length / 体收割
```bash
curl -v -X POST http://127.0.0.1:8080 -d "test_body_123456"
```

需要我帮你整理一份**专门压测你的HttpServer边界用的curl测试用例清单**吗？覆盖粘包、大包、空体、超长header场景。
