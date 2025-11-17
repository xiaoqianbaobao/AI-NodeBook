# AI笔记本启动脚本
Write-Host "启动AI笔记本应用程序..." -ForegroundColor Green
Write-Host ""

# 检查Node.js是否安装
try {
    $nodeVersion = node --version
    Write-Host "检测到Node.js版本: $nodeVersion" -ForegroundColor Yellow
} catch {
    Write-Host "错误: 未检测到Node.js，请先安装Node.js" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

# 检查依赖是否安装
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 依赖安装失败" -ForegroundColor Red
        Read-Host "按任意键退出"
        exit 1
    }
}

# 构建应用程序
Write-Host "正在构建应用程序..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 构建失败" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

# 启动应用程序
Write-Host "启动应用程序..." -ForegroundColor Green
npm run electron

Read-Host "按任意键退出"