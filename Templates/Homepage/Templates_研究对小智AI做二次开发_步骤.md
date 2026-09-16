全部就位。下面是给你的一份**按顺序、带网址、带验收标准**的详细操作清单。

---

# 你要做的事（详细版，共 7 步）

## 第 0 步（现在就能做）：下单称重硬件（等快递期间做下面所有步骤）

- 淘宝/京东搜：**「HX711 称重模块」+「500g 应变片压力传感器」**（或成品「人体秤传感器 半桥 500g」），约 ¥15。接线是 4 根线（VCC/GND/DT/SCK），到手后按手册第 9 节接 GPIO12/13。
- 需要的话同时买：**企业微信**要用手机装 App；药盒用家里的就行。

---

## 第 1 步：在你电脑上部署小智后端（把电脑变成服务器）

**① 装 Anaconda**（如果没装）
- 官网：https://www.anaconda.com/download （慢就用清华镜像：https://mirrors.tuna.tsinghua.edu.cn/anaconda/archive/ ）
- 装完在开始菜单打开 **Anaconda Prompt**

**② 下载后端源码**
- https://github.com/xinnan-tech/xiaozhi-esp32-server → 绿色 `Code` → `Download ZIP` → 解压

**③ 在 Anaconda Prompt 里逐条执行**（每条成功再下一条）：

```bash
conda create -n xiaozhi-esp32-server python=3.10 -y
conda activate xiaozhi-esp32-server
conda install libopus ffmpeg -y
cd <解压目录>\main\xiaozhi-server
pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/
pip install -r requirements.txt
```

**④ 下载语音识别模型**（约 1GB，网盘/魔搭二选一）：
- 魔搭直链：https://modelscope.cn/models/iic/SenseVoiceSmall/resolve/master/model.pt
- 或百度网盘（README 里有）：https://github.com/xinnan-tech/xiaozhi-esp32-server （看 `docs/Deployment.md`）
- 下载后放到 `<解压目录>\main\xiaozhi-server\models\SenseVoiceSmall\model.pt`

**⑤ 注册大模型 key（免费）**
- 智谱 AI：https://bigmodel.cn → 注册 → 右上角「API Keys」→ 创建 key（glm-4-flash 免费）

**⑥ 创建配置文件**：在 `<解压目录>\main\xiaozhi-server\data\` 下新建文件 `.config.yaml`（注意开头有个点），内容：

```yaml
server:
  websocket: ws://192.168.x.x:8000/xiaozhi/v1/     # x.x 换成你电脑IP，先随便填
prompt: |
  你是一个关心老人的智能药箱助手，说话温柔简短。当需要通知家人时（比如老人没吃药），调用 send_wechat_message 工具给家人发微信。
selected_module:
  LLM: ChatGLMLLM
LLM:
  ChatGLMLLM:
    api_key: 你刚注册的智谱key
```

**⑦ 启动并确认**：
```bash
conda activate xiaozhi-esp32-server
cd <解压目录>\main\xiaozhi-server
python app.py
```
✅ **验收**：日志出现这两行（IP 换成你电脑实际 IP 再往下做）：
```
OTA接口是     http://192.168.x.x:8003/xiaozhi/ota/
Websocket地址是 ws://192.168.x.x:8000/xiaozhi/v1/
```
（端口以你日志为准，可能是 8002/8003；**记下你的电脑 IP**：另开窗口跑 `ipconfig`，找 192.168.x.x）
⚠️ Windows 防火墙弹窗要选「允许访问」。

---

## 第 2 步：申请微信推送渠道（两个都配，30 分钟）

**企业微信（推荐，演示效果好）**
1. 注册：https://work.weixin.qq.com （免费，用微信扫码注册即可）
2. 手机装「企业微信」App → 登录 → 创建一个群（拉你自己）
3. 群里 → 右上角「...」→「群机器人」→「添加」→ 复制 **webhook 地址**（形如 `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`）
4. 官方说明：https://developer.work.weixin.qq.com/document/path/91770

**Server酱（保底，30 秒）**
- https://sct.ftqq.com → 微信扫码登录 → 复制 **SendKey**（形如 `sctp_xxx`）

---

## 第 3 步：部署 MCP 接入点（小智调用工具的"插座"）

**① 装 Docker Desktop（Windows）**：https://www.docker.com/products/docker-desktop/ （装完重启电脑）
> 不想装 Docker 也可以：用源码跑，教程在仓库 README：https://github.com/xinnan-tech/mcp-endpoint-server

**② 下载并启动**
- 下载 ZIP：https://github.com/xinnan-tech/mcp-endpoint-server → `Code` → `Download ZIP` → 解压
- 打开命令行（Anaconda Prompt 或 cmd）：
```bash
cd <解压目录>
docker compose -f docker-compose.yml up -d
docker logs -f mcp-endpoint-server
```
✅ **验收**：日志出现
```
单模块部署MCP接入点: ws://172.22.0.2:8004/mcp_endpoint/mcp/?token=def
```
⚠️ **容器 IP 不能用**，把 `172.22.0.2` 换成你电脑 IP，得到：`ws://192.168.x.x:8004/mcp_endpoint/mcp/?token=def`（token 保留）

---

## 第 4 步：让后端连上这个"插座"

- 编辑第 1 步的 `data/.config.yaml`，**追加一行**（和第 1 步的 server 同级）：
```yaml
mcp_endpoint: ws://192.168.x.x:8004/mcp_endpoint/mcp/?token=def
```
- 重启后端（Ctrl+C 后重新 `python app.py`）
- ✅ **验收**：日志出现 `mcp接入点是 ws://192.168.x.x:8004/...`

---

## 第 5 步：启动「发微信」工具

```bash
cd G:\Code\Embedded\Esp32\xiaozhi-esp32-main-3\medicine-box\server-mcp-tools
pip install -r requirements.txt
copy .env.example .env
```
用记事本编辑 `.env`，填三项：
```
MCP_ENDPOINT=ws://192.168.x.x:8004/mcp_endpoint/mcp/?token=def
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
SERVERCHAN_SENDKEY=sctp_xxx
```
启动（保持窗口开着）：
```bash
python mcp_pipe.py wechat_notify_tool.py
```
✅ **验收**：**后端窗口**日志出现 `当前支持的函数列表: [ ..., 'send_wechat_message' ]` —— 小智已经"学会"发微信了！

---

## 第 6 步：编译烧录固件（你的板子：bread-compact-wifi-lcd）

```bash
# 先激活 ESP-IDF 6.0.2 环境
python3 scripts/build.py bread-compact-wifi-lcd --name bread-compact-wifi-lcd
```

让设备连你的服务器，**二选一**：
- **A（不用重编译）**：烧录后进入配网模式 → 网页里「高级选项」→ 填 OTA 地址 `http://192.168.x.x:8003/xiaozhi/ota/` → 保存重启（端口以你后端日志为准）
- **B（改源码）**：`idf.py menuconfig` → `Xiaozhi Assistant` → `OTA URL` 改成上面的地址 → 重新编译烧录

---

## 第 7 步：语音实测（成败在此一举）

唤醒小智，说：

> **"帮我发条微信给我女儿：妈妈早上没吃药，麻烦打电话确认一下"**

✅ **成功**：企业微信/Server酱 收到这条消息，小智说"已发送"。
❌ 没反应：按手册第 8 节查（函数列表有没有工具 / mcp_pipe 窗口日志 / .env 的 IP 和 token）。

---

## 我已经做完、你不用管的

| 位置 | 内容 |
|---|---|
| `medicine-box\server-mcp-tools\wechat_notify_tool.py` | 发微信 MCP 工具（双渠道） |
| `medicine-box\server-mcp-tools\mcp_pipe.py` | 官方接入管道 |
| `medicine-box\README.md` | 完整手册（含疑难排查） |
| `main\boards\common\medicine_box_controller.h` | HX711 驱动 + 4 个称重 MCP 工具（已按仓库 `lamp_controller.h` 模式写好） |
| `main\Kconfig.projbuild` | 新增 `CONFIG_MEDICINE_BOX_HX711` 开关（默认关，不影响你现有编译） |
| `main\boards\bread-compact-wifi-lcd\compact_wifi_board_lcd.cc` | 已挂载，HX711 接 GPIO12/13 |

**提醒**：第 1、3 步是并行可做的（等模型下载/装 Docker 时，可以同时去注册智谱 key 和企业微信）。哪一步卡住了，把报错或日志贴给我，我帮你解。等你跑通第 7 步，我再写定时提醒 + notify 调度模块。