@echo off
REM Windows启动脚本

echo =========================================
echo        拼音文档服务 - 一键启动
echo =========================================
echo.

cd /d "%~dp0"

echo 📦 检查依赖...
if not exist "backend\static" (
    echo 🔨 构建前端...
    cd frontend
    if not exist "node_modules" (
        echo 📦 安装前端依赖...
        call npm install
    )
    call npm run build
    cd ..
)

echo.
echo 🚀 启动服务...
echo.
echo =========================================
echo    访问地址: http://localhost:5000
echo    按 Ctrl+C 停止服务
echo =========================================
echo.

cd backend
python app.py
