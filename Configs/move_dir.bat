@echo off
setlocal EnableDelayedExpansion

:: 1. 检查参数是否输入完整
if "%~2"=="" (
    echo [错误] 参数不足！
    echo 用法: %~nx0 ^<原目录^> ^<目标目录^>
    echo 示例: %~nx0 "C:\Users\Administrator\.platformio" "G:\MyPath\Dist\.platformio"
    exit /b 1
)

set "SOURCE_DIR=%~1"
set "DEST_DIR=%~2"

echo ==========================================
echo  开始安全迁移并创建软链接
echo ==========================================
echo [源目录] %SOURCE_DIR%
echo [目标目录] %DEST_DIR%
echo.

:: 2. 执行 Robocopy 复制操作
echo [步骤 1/4] 正在复制文件（保留所有属性）...
robocopy "%SOURCE_DIR%" "%DEST_DIR%" /E /COPYALL /XJ /R:3 /W:5
set "ROBO_EXIT_CODE=%errorlevel%"
echo.

:: 3. 校验返回值是否在 0-7 之间
echo [步骤 2/4] 正在校验返回值...
echo Robocopy 返回代码: %ROBO_EXIT_CODE%

if %ROBO_EXIT_CODE% GEQ 8 (
    echo [致命错误] Robocopy 返回值大于等于 8，发生严重错误！
    echo 请检查日志，原目录数据未被删除，请排查后重试。
    exit /b 1
)

echo [校验通过] 返回值在 0-7 之间，复制成功！
echo.

:: 4. 删除原目录
echo [步骤 3/4] 正在安全删除原目录...
rmdir /S /Q "%SOURCE_DIR%"
if exist "%SOURCE_DIR%" (
    echo [致命错误] 原目录删除失败！可能有文件被占用。
    echo 请勿执行后续软链接操作，手动排查问题。
    exit /b 1
)
echo 原目录删除成功。
echo.

:: 5. 创建软链接 (Junction)
echo [步骤 4/4] 正在创建目录联接 (Junction)...
mklink /J "%SOURCE_DIR%" "%DEST_DIR%"

echo.
echo ==========================================
echo  迁移全部完成！
echo ==========================================
pause
