@echo off
REM =============================================================================
REM fetch-game.cmd — Windows 批处理包装器
REM 用于 Obsidian 内嵌 Agent 直接调用 RAWG 游戏搜索/生成。
REM
REM 用法：
REM   fetch-game.cmd --help
REM   fetch-game.cmd search --name "Elden Ring" --json
REM   fetch-game.cmd add --name "Elden Ring" --score 9.5 --status 想玩💭
REM =============================================================================

setlocal
cd /d "%~dp0"

set "NODE_BIN="
if exist "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe" (
    set "NODE_BIN=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe"
) else (
    for /f "tokens=*" %%i in ('where node 2^>nul') do set "NODE_BIN=%%i"
)

if "%NODE_BIN%"=="" (
    echo [ERROR] 找不到 node.exe。>&2
    exit /b 1
)

"%NODE_BIN%" "%~dp0fetch-game-cli.cjs" %*
endlocal
exit /b %ERRORLEVEL%
