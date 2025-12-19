@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
:: HTML Reports Admin - 智能启动脚本
:: ========================================

:: 1. 强制切换到脚本所在目录，防止路径错误
cd /d "%~dp0"

title HTML Reports Admin 管理后台

echo.
echo ========================================
echo   HTML Reports Admin 管理后台
echo ========================================
echo.

:: ----------------------------------------
:: [1/5] 检查 Git
:: ----------------------------------------
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

:: ----------------------------------------
:: [2/5] 检查 Node.js
:: ----------------------------------------
echo [2/5] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] 错误: 未检测到 Node.js
    echo.
    echo 请先安装 Node.js (推荐 LTS 版本^):
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [√] Node.js 已安装

:: ----------------------------------------
:: [3/5] 检查端口 3030 (已修复冒号报错问题)
:: ----------------------------------------
echo [3/5] 检查端口 3030...
netstat -ano | findstr :3030 | findstr LISTENING >nul 2>&1

:: 如果没有占用 (errorlevel 1)，直接跳到后面
if errorlevel 1 goto :port_is_free

:: === 端口占用处理逻辑 (标签必须在括号外) ===
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
:: 等待2秒确保释放
timeout /t 2 >nul
goto :port_is_free

:skip_kill
echo.
echo 已取消，退出脚本...
pause
exit /b 1

:port_is_free
echo [√] 端口 3030 可用

:: ----------------------------------------
:: [4/5] 检查 & 准备本地 CDN 资源
:: ----------------------------------------
echo [4/5] 准备本地 CDN 資源...
set "VENDOR_DIR=admin\public\vendor"
if not exist "%VENDOR_DIR%" mkdir "%VENDOR_DIR%"

set "HAS_MISSING=0"
if not exist "%VENDOR_DIR%\react.min.js" set "HAS_MISSING=1"
if not exist "%VENDOR_DIR%\react-dom.min.js" set "HAS_MISSING=1"
if not exist "%VENDOR_DIR%\babel.min.js" set "HAS_MISSING=1"
if not exist "%VENDOR_DIR%\tailwindcss.js" set "HAS_MISSING=1"

if "%HAS_MISSING%"=="0" (
    echo [√] 本地資源已就緒
    goto :check_node_modules
)

echo [!] 正在從雲端下載大型依賴到本地 (僅需下載一次)
powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://unpkg.com/react@18/umd/react.production.min.js' -OutFile '%VENDOR_DIR%\react.min.js'; Invoke-WebRequest -Uri 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js' -OutFile '%VENDOR_DIR%\react-dom.min.js'; Invoke-WebRequest -Uri 'https://unpkg.com/@babel/standalone/babel.min.js' -OutFile '%VENDOR_DIR%\babel.min.js'; Invoke-WebRequest -Uri 'https://cdn.tailwindcss.com' -OutFile '%VENDOR_DIR%\tailwindcss.js'; }"
if errorlevel 1 (
    echo [!] 下載失敗，系統將繼續使用雲端連結
) else (
    echo [√] 本地資源準備完成
)

:check_node_modules
:: ----------------------------------------
:: [5/5] 检查依赖
:: ----------------------------------------
echo [5/5] 检查 Node 模块...

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

:: ----------------------------------------
:: [5/5] 启动服务器
:: ----------------------------------------
echo [5/5] 启动管理后台...
echo.
echo ========================================
echo   服务器正在启动...
echo ========================================
echo   地址: http://localhost:3030
echo   请勿直接关闭此窗口 (按 Ctrl+C 停止)
echo ========================================
echo.

cd admin

:: 预先启动浏览器倒计时 (3秒后打开)
start /b "" cmd /c "timeout /t 3 >nul & start http://localhost:3030"

:: 启动 Node.js 服务器
node server.js

:: 退出处理
cd ..
pause
