@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SoftOneTab.ps1" install -IntervalSeconds 60
pause
