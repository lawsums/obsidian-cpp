# SoftOneTab：软件版 OneTab 原型

这是一个 Windows 用的小工具，用来记录“上一次电脑重启/关机前大概打开了哪些软件和页面”，方便重启后恢复工作现场。

## 怎么用

1. 双击 `安装自动记录.bat`
2. 之后它会在你登录 Windows 后后台运行，每 60 秒保存一次当前桌面快照。
3. 重启后双击 `恢复上次页面.bat`，它会尽量恢复上一份快照里的软件、文档和文件夹。

也可以手动保存：

- 双击 `保存当前页面.bat`
- 双击 `查看状态.bat` 查看最近一次记录情况
- 双击 `卸载自动记录.bat` 停止开机后的后台自动记录

恢复页面的几种方式：

- 双击 `恢复上次页面.bat` — 恢复最近一次保存的快照（自动判断是否用关机前快照）
- 双击 `恢复昨天.bat` — 直接恢复昨天最后一次保存的快照
- 双击 `选择恢复.bat` — 列出所有历史快照，在命令行窗口中输入序号选择恢复

也可以在 PowerShell 中指定日期恢复：

```powershell
.\SoftOneTab.ps1 restore -Date 2026-08-13   # 恢复指定日期的最后一个快照
.\SoftOneTab.ps1 restore -Date 08-13         # 同上（省略年份，默认当年）
.\SoftOneTab.ps1 restore -Days 2             # 恢复前天的最后一个快照（0=今天, 1=昨天, 2=前天）
.\SoftOneTab.ps1 restore -Pick               # 交互式选择
```

## 能记录什么

- 当前可见窗口：标题、进程名、程序路径、命令行
- Word / Excel / PowerPoint 当前打开的文件
- 文件资源管理器当前打开的文件夹
- PDF、电子书、文本、图片等常见文件路径：如果它们出现在软件启动命令行里，会被额外记录
- 软件列表：重启后会尝试重新启动这些程序

快照默认保存到：

```text
%LOCALAPPDATA%\SoftOneTab\last-session.json
%LOCALAPPDATA%\SoftOneTab\sessions\
```

## 重要限制

Windows 没有统一的“所有软件页面/标签页”接口，所以这个工具采用“通用窗口记录 + 常见软件专门增强”的方式。

- Word/Excel/PowerPoint：能比较可靠地记录具体文件。
- 文件资源管理器：能记录资源管理器窗口当前文件夹；Windows 11 的同一窗口多标签页不一定全部可读，通常只能读到系统暴露出来的活动位置。
- PDF 阅读器、Calibre、其他阅读器：如果命令行里带文件路径，可以恢复具体文件；否则至少会恢复软件和窗口标题记录。
- 浏览器：浏览器标签页已经有 OneTab/历史记录/会话恢复，这个工具主要面向非浏览器软件，但也会记录浏览器进程和窗口标题。

## PowerShell 命令

```powershell
.\SoftOneTab.ps1 save
.\SoftOneTab.ps1 restore
.\SoftOneTab.ps1 restore -Pick
.\SoftOneTab.ps1 restore -Date 2026-08-13
.\SoftOneTab.ps1 restore -Days 1
.\SoftOneTab.ps1 status
.\SoftOneTab.ps1 install -IntervalSeconds 60
.\SoftOneTab.ps1 uninstall
```

安装自动记录时会优先创建当前用户的 Windows 计划任务；如果计划任务因权限或系统策略失败，会退回到“启动”文件夹快捷方式。

如果想只恢复文档/文件夹，不自动重开普通软件：

```powershell
.\SoftOneTab.ps1 restore -NoGenericApps
```

## 下一步可以增强

- 给 Calibre、SumatraPDF、Adobe Acrobat、Foxit、VS Code、Notepad++ 做专门适配。
- 做一个托盘图标，提供“保存当前现场 / 恢复上次现场 / 查看历史快照”。
- 增加快照 UI，像 OneTab 一样可以勾选哪些软件和文件要恢复。
