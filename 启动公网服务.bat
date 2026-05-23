@echo off
chcp 65001 >nul
title 茂盛易理 — 公网访问中...

echo.
echo ========================================
echo     茂盛易理 公网服务
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 启动本地服务...
start /B "" python -m http.server 8080 >nul 2>&1
if errorlevel 1 (
    echo [错误] Python 未找到，请确认已安装 Python
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul

echo [2/2] 创建公网隧道...
echo.
echo 等待连接（约5-10秒）...
echo.
echo ════════════════════════════════════════

"%~dp0cloudflared.exe" tunnel --url http://localhost:8080 2>&1

echo ════════════════════════════════════════
echo.
echo 复制上方 trycloudflare.com 链接发给朋友即可！
echo.
echo 按任意键关闭（关闭后网站无法访问）
pause >nul
