@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
:: HTML Reports Admin - 智能启动脚本
:: ========================================

title HTML Reports Admin 管理后台

echo.
echo ========================================
echo   HTML Reports Admin 管理后台
echo ========================================
echo.

:: 检测 Git 是否安装
echo [1/5] 检查 Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [X] 错误: 未检测到 Git
    echo.
    echo 请先安装 Git:
    echo https://git-scm.com/downloads
    echo.
    pause
    exit /b 1
)
echo [√] Git 已安装

:: 检测 Node.js 是否安装
echo [2/5] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] 错误: 未检测到 Node.js
    echo.
    echo 请先安装 Node.js (推荐 LTS 版本):
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [√] Node.js 已安装

:: 检测端口 3030 是否被占用
echo [3/5] 检查端口 3030...
netstat -ano | findstr :3030 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo.
    echo [!] 端口 3030 已被占用
    echo.
    echo 可能的原因:
    echo  - 管理后台已在运行
    echo  - 其他程序占用了该端口
    echo.
    choice /C YN /M "是否尝试关闭占用端口的进程？(Y/N)"
    if errorlevel 2 goto :skip_kill
    if errorlevel 1 goto :kill_port
    
    :kill_port
    echo.
    echo 正在关闭占用端口的进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3030 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
        echo [√] 已关闭进程 PID: %%a
    )
    timeout /t 2 >nul
    goto :continue
    
    :skip_kill
    echo.
    echo 已取消，退出...
    pause
    exit /b 1
)
echo [√] 端口 3030 可用

:continue

:: 检查并安装依赖
echo [4/5] 检查依赖...
if not exist "admin\node_modules\" (
    echo.
    echo [!] 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请稍候...
    echo.
    cd admin
    call npm install
    if errorlevel 1 (
        echo.
        echo [X] 依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [√] 依赖安装完成
) else (
    echo [√] 依赖已安装
)

:: 启动服务器
echo [5/5] 启动管理后台...
echo.
echo ========================================
echo   服务器信息
echo ========================================
echo   地址: http://localhost:3030
echo   按 Ctrl+C 停止服务器
echo ========================================
echo.

:: 等待1秒后打开浏览器
timeout /t 1 >nul
start http://localhost:3030

:: 启动 Node.js 服务器（作为子进程）
cd admin
node server.js

:: 服务器停止后的清理
:cleanup
cd ..
echo.
echo [√] 服务器已停止
echo.

:: 清理可能残留的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3030 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

pause
exit /b 0
