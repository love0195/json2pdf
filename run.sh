#!/bin/bash

# 拼音文档服务启动脚本
# 一键部署和运行Python后端服务

echo "========================================="
echo "       拼音文档服务 - 一键启动"
echo "========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "📂 工作目录: $SCRIPT_DIR"
echo ""

# 检查Python是否安装
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ 错误: 未找到Python，请先安装Python 3.7+"
    exit 1
fi

# 确定Python命令
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

echo "✅ 使用Python: $PYTHON_CMD"

# 检查并安装依赖
echo ""
echo "📦 检查Python依赖..."
cd "$BACKEND_DIR"

if [ ! -f "requirements.txt" ]; then
    echo "⚠️  警告: 未找到requirements.txt"
else
    echo "📦 安装依赖..."
    $PYTHON_CMD -m pip install -q -r requirements.txt
fi

# 检查是否需要构建前端
echo ""
echo "🔍 检查前端..."
cd "$SCRIPT_DIR"

# 检查是否需要重新构建前端
if [ ! -d "backend/static" ] || [ -z "$(ls -A backend/static 2>/dev/null)" ]; then
    echo "🔨 前端未构建，正在构建..."
    
    if [ ! -d "frontend/node_modules" ]; then
        echo "📦 安装前端依赖..."
        cd "$FRONTEND_DIR"
        npm install
    fi
    
    cd "$FRONTEND_DIR"
    npm run build
    echo "✅ 前端构建完成"
else
    echo "✅ 前端已就绪"
fi

# 确保数据目录存在
mkdir -p "$BACKEND_DIR/data"

echo ""
echo "🚀 启动服务..."
echo ""
echo "========================================="
echo "   服务即将启动！"
echo "   访问地址: http://localhost:5000"
echo "   按 Ctrl+C 停止服务"
echo "========================================="
echo ""

cd "$BACKEND_DIR"

# 启动服务
if [ "$1" = "--no-build" ]; then
    echo "跳过构建检查，直接启动"
    $PYTHON_CMD app.py
else
    $PYTHON_CMD app.py
fi
