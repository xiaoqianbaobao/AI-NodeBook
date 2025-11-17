@echo off
chcp 65001 >nul
echo ========================================
echo    AI笔记本安装程序
echo ========================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 警告: 建议以管理员身份运行此脚本
    echo.
)

REM 检查Node.js
echo 检查Node.js安装状态...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js
    echo 请先安装Node.js 16.0或更高版本
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo 检测到Node.js版本: %NODE_VERSION%
)

echo.
echo 开始安装依赖包...
npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    echo 请检查网络连接或尝试使用国内镜像源
    echo 使用命令: npm config set registry https://registry.npmmirror.com
    pause
    exit /b 1
)

echo.
echo 构建应用程序...
npm run build
if %errorlevel% neq 0 (
    echo 错误: 构建失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo    安装完成！
echo ========================================
echo.
echo 使用方法:
echo 1. 双击 start.bat 启动应用程序
echo 2. 或在命令行中运行: npm run electron
echo.
echo 首次使用请先配置API密钥:
echo - 科大讯飞ASR API (语音转文字)
echo - DeepSeek LLM API (AI内容生成)
echo.
pause