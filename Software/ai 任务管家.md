
# 基于 MCP 搭建 AI 语音任务管家完整方案
## 一、先理清核心概念：MCP 是什么、为什么适合做任务管家
MCP = Model Context Protocol，是标准化 AI 工具调用协议，作用：
1. 本地程序（语音录制、日程数据库、提醒弹窗、日历）统一封装成 MCP Server；
2. 大模型（本地 DeepSeek/Llama / 云端 Claude/GPT）通过标准协议调用工具；
3. 你用语音输入，AI 自动解析：任务名称、起止时间、优先级、重复规则、提醒时机，存入本地库，定时推送提醒。

优势贴合你的需求：
- 脱离网页/APP，本地私有化存储任务数据，不会泄露日程；
- 语音一键录入，不用手动打字填表单，解决任务多手动管理繁琐；
- AI 自动归类、排序、冲突检测、每日汇总规划，替代人工整理任务；
- 可嵌入 Obsidian、VS Code、Linux 桌面，和你现有工作流打通。

## 二、整体架构分层（四层）
### 1）客户端层（语音输入入口）
两种方案任选：
1. 桌面语音麦克风（Windows/Linux/macOS）：`pyaudio` 录音 + Whisper 本地语音转文字，无网络；
2. 手机快捷指令转发语音文本到本地 MCP 服务（外出录任务）。

### 2）AI 核心层（MCP Client LLM）
接收语音转文字后的自然语言，做结构化解析：
示例语音输入：
> “今天晚上7点到9点写C++网络项目，优先级最高，提前15分钟弹窗提醒，每天重复”
AI 输出结构化 JSON：
```json
{
  "title": "C++网络项目开发",
  "start_time": "2026-06-26 19:00",
  "end_time": "2026-06-26 21:00",
  "priority": 1, // 1最高 5最低
  "remind_offset": -15, // 提前15分钟提醒
  "repeat": "daily",
  "note": "个人项目主线任务"
}
```

### 3）MCP Server 工具层（核心能力封装）
提供 6 个标准 MCP 工具函数，给 AI 调用：
1. `add_task`：新增任务，写入 SQLite 本地数据库
2. `query_tasks`：按日期/优先级/状态查询任务
3. `modify_task`：修改已有任务时间、优先级
4. `delete_task`：删除任务
5. `check_reminder`：轮询检测是否到达提醒时间
6. `show_daily_plan`：AI 自动汇总今日所有任务，按优先级排序输出规划

### 4）持久化 & 提醒层
- 存储：SQLite 本地文件数据库，不用部署服务，轻量；
- 提醒：桌面弹窗通知 + 可选语音播报提醒（播放音频）；
- 联动扩展：写入 Obsidian Tasks 插件数据库，和你现有笔记任务打通。

## 三、最简可落地技术栈（轻量化，不吃性能）
### 后端 MCP 服务（Python）
1. MCP 库：`mcp` 官方 Python SDK
2. 语音转文字：`openai-whisper` 本地 tiny 模型，CPU 可跑
3. 音频录制：`pyaudio`
4. 数据库：内置 sqlite3
5. 桌面通知：`win10toast`(Windows) / `notify-send`(Linux) / `Foundation`(macOS)
6. LLM：本地 Llama3 / Qwen 轻量模型（Ollama）做本地解析，不需要联网

### 交互流程完整链路
1. 你执行语音录制脚本，口述任务；
2. Whisper 转成纯文本；
3. 文本丢给 Ollama LLM，LLM 通过 MCP 协议调用 `add_task`；
4. 任务存入本地 task.db；
5. 后台常驻 MCP 服务每分钟执行 `check_reminder`；
6. 到达提醒时间弹出桌面通知；
7. 随时语音提问：“输出我今天所有任务，按优先级排序”，AI 调用 `query_tasks` 生成当日规划。

## 四、MCP Server 核心伪代码（任务工具定义）
```python
from mcp.server.fastmcp import FastMCP
import sqlite3
import datetime

mcp = FastMCP("VoiceTaskManager")
db = sqlite3.connect("task.db", check_same_thread=False)

# 新增任务工具，AI可调用
@mcp.tool()
def add_task(title: str, start_time: str, end_time: str, priority: int, remind_offset: int, repeat: str, note: str = "") -> str:
    """
    新增日程任务
    Args:
        title: 任务名称
        start_time: 开始时间 YYYY-MM-DD HH:MM
        end_time: 结束时间 YYYY-MM-DD HH:MM
        priority: 优先级1~5，1最高
        remind_offset: 提前多少分钟提醒，负数代表提前，如-15
        repeat: none/daily/weekly/monthly
        note: 备注
    """
    cur = db.cursor()
    cur.execute("""
    INSERT INTO tasks(title,start_time,end_time,priority,remind_offset,repeat,note,done)
    VALUES (?,?,?,?,?,?,?,0)
    """, (title, start_time, end_time, priority, remind_offset, repeat, note))
    db.commit()
    return "任务创建成功"

# 查询当日任务工具
@mcp.tool()
def get_today_tasks() -> str:
    today = datetime.date.today().strftime("%Y-%m-%d")
    cur = db.cursor()
    res = cur.execute("SELECT * FROM tasks WHERE start_time LIKE ? ORDER BY priority ASC", (f"{today}%",)).fetchall()
    return str(res)

# 提醒检测工具
@mcp.tool()
def scan_reminder() -> str:
    now = datetime.datetime.now()
    cur = db.cursor()
    all_tasks = cur.execute("SELECT * FROM tasks").fetchall()
    notify_list = []
    for t in all_tasks:
        task_id, title, s_time, e_time, prio, offset, repeat, note, done = t
        task_start = datetime.datetime.strptime(s_time, "%Y-%m-%d %H:%M")
        remind_time = task_start + datetime.timedelta(minutes=offset)
        if remind_time <= now < task_start and done == 0:
            notify_list.append(title)
    # 调用系统弹窗通知
    if notify_list:
        send_desktop_notify("任务提醒", f"即将开始：{','.join(notify_list)}")
    return f"检测到{len(notify_list)}条待提醒任务"

if __name__ == "__main__":
    mcp.run()
```

## 五、语音输入客户端流程（独立脚本）
```python
import pyaudio, wave
import whisper
import requests

# 1. 录音函数
def record_audio(output_path="tmp.wav", duration=8):
    # 录制8秒语音
    pa = pyaudio.PyAudio()
    stream = pa.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=1024)
    frames = []
    for _ in range(int(16000/1024 * duration)):
        frames.append(stream.read(1024))
    stream.stop_stream()
    wf = wave.open(output_path, 'wb')
    wf.setnchannels(1)
    wf.setsampwidth(pa.get_sample_size(pyaudio.paInt16))
    wf.setframerate(16000)
    wf.writeframes(b''.join(frames))
    return output_path

# 2. Whisper 本地转文字
def speech_to_text(wav_path):
    model = whisper.load_model("tiny")
    res = model.transcribe(wav_path)
    return res["text"]

# 3. 将文本发给MCP+LLM解析任务并存储
if __name__ == "__main__":
    wav = record_audio()
    text = speech_to_text(wav)
    print(f"识别语音：{text}")
    # 把自然语言交给Ollama LLM，LLM自动调用上面MCP的add_task工具完成录入
    prompt = f"""
    解析下面这段语音任务描述，提取任务标题、起止时间、优先级(1最高5最低)、提前提醒分钟数、重复规则。
    只调用add_task工具，不要额外解释。文本：{text}
    """
    # 请求本地Ollama对接MCP服务执行工具调用
    requests.post("http://localhost:8000/mcp", json={"prompt": prompt})
```

## 六、贴合你工作流的扩展能力（重点适配你的需求）
### 1. 和 Obsidian Tasks 双向同步
MCP 新增 `sync_to_obsidian` 工具，自动把任务写入 Tasks 插件的 md 文件，你可以在笔记里统一查看算法刷题、项目开发、学习规划任务，解决你任务分散难管理的痛点。

### 2. 每日自动生成时间规划
每天早上运行一次，AI 读取全部任务，按优先级+时间段排序，输出最优时间分配方案：
- 高优先级项目开发大块时间优先排布；
- 每日一题、周赛算法任务固定时段插入；
- 自动检测时间冲突并给出调整建议。

### 3. 任务统计复盘（解决规划复盘麻烦）
MCP 增加统计工具：统计本周项目投入时长、刷题耗时，输出时间分配报表，方便你复盘是否时间倾斜失衡。

### 4. 常驻后台自动提醒
用 systemd(Linux) / 计划任务(Windows) 把 MCP Server 设置开机自启，每分钟自动执行 `scan_reminder`，不用手动启动程序。

## 七、部署成本与优缺点
### 优点
1. **语音零手动填表**：不用手动填时间、优先级，口述自动解析，大幅减少任务录入成本；
2. 本地全私有化，数据存在本地 SQLite，无云端泄露；
3. MCP 标准化，后续可新增更多工具：番茄钟、Git 项目进度同步、刷题记录统计；
4. 完美适配你「大量任务、手动管理繁琐」的核心痛点；
5. 和你现有的笔记、编程工作流打通，统一任务管理入口。

### 缺点
1. 初次搭建需要写 MCP 服务、语音脚本、数据库表，有少量开发成本；
2. 本地 Whisper 语音识别短时间还好，超长口述会轻微占用CPU；
3. 需要常驻后台进程维持提醒轮询。

## 八、落地分步实施顺序（循序渐进，不用一次性写完）
1. 搭建基础 MCP Server，实现 `add_task` / 查询任务 / SQLite 存储；
2. 实现本地语音录音 + Whisper 转文字客户端；
3. 对接 Ollama 本地大模型，实现自然语言解析结构化任务；
4. 开发桌面提醒轮询功能；
5. 扩展 Obsidian Tasks 同步、每日自动规划报表；
6. 配置开机自启后台服务，日常完全无感使用。

## 九、替代轻量化折中方案（如果不想完整自研MCP）
如果不想从零搭建完整MCP服务，可以先用现成MCP客户端（如 Claude Desktop + MCP Server），仅封装任务数据库工具，省去LLM对接底层代码，快速实现语音任务录入功能。

需要我把完整可直接运行的：建表SQL、MCP服务完整代码、语音录制脚本打包给你吗？