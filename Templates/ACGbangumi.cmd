@echo off
REM =============================================================================
REM ACGbangumi.cmd — Windows 批处理包装器
REM 用于 Obsidian 内嵌 Agent 直接调用，绕过 PowerShell stdout 捕获问题。
REM
REM 用法跟 node ACGbangumi-cli.cjs 完全一样，例如：
REM   ACGbangumi.cmd --help
REM   ACGbangumi.cmd search --name "间谍过家家" --type anime --json
REM   ACGbangumi.cmd add --url https://bgm.tv/subject/329906 --type anime --score 8.0
REM =============================================================================

REM 当前脚本所在目录 = Templates/
setlocal
cd /d "%~dp0"

REM 优先用 workbuddy 托管 node；若不存在则回退到系统 PATH 中的 node
set "NODE_BIN="
if exist "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe" (
    set "NODE_BIN=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe"
) else (
    for /f "tokens=*" %%i in ('where node 2^>nul') do set "NODE_BIN=%%i"
)

if "%NODE_BIN%"=="" (
    echo [ERROR] 找不到 node.exe。请安装 Node.js 或确认 workbuddy 托管 node 存在。>&2
    exit /b 1
)

"%NODE_BIN%" "%~dp0ACGbangumi-cli.cjs" %*
endlocal
exit /b %ERRORLEVEL%
