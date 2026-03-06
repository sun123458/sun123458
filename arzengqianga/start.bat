@echo off
chcp 65001 > nul
cls

echo ==================================
echo   AR增强现实展厅应用启动器
echo ==================================
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js版本: %NODE_VERSION%
echo.

REM 检查npm是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm版本: %NPM_VERSION%
echo.

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call npm install
    echo.
)

echo 🚀 启动服务器...
echo.
echo ==================================
echo 服务器地址:
echo   http://localhost:8080/html/index.html
echo.
echo 按 Ctrl+C 停止服务器
echo ==================================
echo.

REM 启动服务器
npx http-server -p 8080 -c-1

pause
