@echo off
echo ========================================
echo    AI Notebook Installation Script
echo ========================================
echo.

REM Check administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: It is recommended to run this script as an administrator
    echo.
)

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not detected
    echo Please install Node.js version 16.0 or higher
    echo Download URL: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo Detected Node.js version: %NODE_VERSION%
)

echo.
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    echo Please check your network connection or try using a domestic mirror source
    echo Command: npm config set registry https://registry.npmmirror.com
    pause
    exit /b 1
)

echo.
echo Building application...
npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Installation completed!
echo ========================================
echo.
echo Usage:
echo 1. Double-click start.bat to launch the application
echo 2. Or run in command line: npm run electron
echo.
echo Please configure API keys for first use:
echo - iFlytek ASR API (Speech-to-Text)
echo - DeepSeek LLM API (AI Content Generation)
echo.
pause