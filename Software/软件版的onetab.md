- [x] 安装自动记录.bat ✅ 2026-07-14
- [x] 保存当前页面.bat ✅ 2026-07-14
- [x] 查看状态.bat ✅ 2026-07-14
- [x] 恢复上次页面.bat ✅ 2026-07-14
- [x] 卸载自动记录.bat ✅ 2026-07-14
- [ ] 分别列出不同的应用标签页
- [ ] 恢复不同的应用标签页
- [ ] 自动记录有 bug, 我们希望关机时能自动记录，因此设计了自动注册功能。但如果一上线就触发该功能，新记录会覆盖旧记录。而刚上线时基本没有运行任何应用，导致覆盖后显得该软件毫无作用。

完全可以！这个需求其实不复杂，自己写反而最"轻"。下面给你几个思路，从最轻量到稍复杂：

---

### 0.1.1 方案一：PowerShell 脚本（最轻量，零依赖）

Windows 自带 PowerShell，几行代码就能搞定核心逻辑：

**保存当前打开的程序：**

```powershell
# save.ps1
Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | 
  Select-Object ProcessName, @{N='Path';E={$_.Path}} | 
  Export-Clixml "$env:USERPROFILE\desktop_tabs.xml"
Write-Host "已保存当前窗口列表"
```

**恢复程序：**

```powershell
# restore.ps1
Import-Clixml "$env:USERPROFILE\desktop_tabs.xml" | 
  ForEach-Object { Start-Process $_.Path }
Write-Host "正在恢复所有程序..."
```

双击 `.ps1` 文件就能用，完全零依赖。

---

### 0.1.2 方案二：Python 小脚本（灵活扩展）

如果你会 Python，可以做得更精致：

```python
import psutil
import subprocess
import json
import os

SAVE_FILE = os.path.expanduser("~/desktop_tabs.json")

def save():
    """保存当前有窗口的程序"""
    apps = []
    for proc in psutil.process_iter(['pid', 'name', 'exe']):
        try:
            if proc.info['exe'] and proc.name() not in ['explorer.exe', 'dwm.exe']:
                # 只保存有可见窗口的进程
                apps.append(proc.info['exe'])
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    # 去重
    apps = list(set(apps))
    with open(SAVE_FILE, 'w') as f:
        json.dump(apps, f)
    print(f"已保存 {len(apps)} 个程序")

def restore():
    """恢复所有程序"""
    with open(SAVE_FILE, 'r') as f:
        apps = json.load(f)
    for app in apps:
        try:
            subprocess.Popen(app)
            print(f"已启动: {app}")
        except Exception as e:
            print(f"启动失败: {app} - {e}")

if __name__ == '__main__':
    import sys
    if sys.argv[1] == 'save':
        save()
    elif sys.argv[1] == 'restore':
        restore()
```

用法：`python app.py save` 保存，`python app.py restore` 恢复。

---

### 0.1.3 方案三：AutoHotkey（带快捷键，体验最好）

如果你愿意装个 AHK，可以做到一键保存/恢复，还能加托盘图标：

```autohotkey
; 按 Win+S 保存当前程序列表
#s::
    saved := ""
    WinGet, id, list,,, Program Manager
    Loop, %id%
    {
        this_id := id%A_Index%
        WinGet, exe, ProcessName, ahk_id %this_id%
        WinGet, path, ProcessPath, ahk_id %this_id%
        if (exe != "" && exe != "explorer.exe")
            saved .= path "`n"
    }
    FileDelete, %A_Desktop%\tabs.txt
    FileAppend, %saved%, %A_Desktop%\tabs.txt
    MsgBox, 已保存！
return

; 按 Win+R 恢复
#r::
    FileRead, content, %A_Desktop%\tabs.txt
    Loop, Parse, content, `n
    {
        if (A_LoopField != "")
            Run, %A_LoopField%
    }
return
```

---

### 0.1.4 进阶想法（按需加）

|功能|实现思路|
|---|---|
|开机自动恢复|把恢复脚本放到启动文件夹|
|多组"标签页"|保存为多个 JSON/txt 文件，用编号区分|
|排除特定程序|加一个黑名单列表（如计算器、设置等）|
|系统托盘图标|Python 用 `pystray`，AHK 自带|
|定时自动保存|用 Windows 任务计划程序定时执行保存脚本|

---

### 0.1.5 我的建议

如果你追求**极致轻量**，方案一（PowerShell）就够了，两个文件，总共不到 20 行代码。

如果你想要**稍好一点的使用体验**（快捷键、托盘图标），方案三（AutoHotkey）最合适，编译后就是一个几百 KB 的 exe，不需要任何运行环境。

你打算用哪种方案？我可以帮你进一步完善细节。