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

if [ -f "requirements.txt" ]; then
    echo "📦 安装依赖..."
    $PYTHON_CMD -m pip install -q -r requirements.txt
fi

# 检查NodeJS并尝试构建前端（如果已安装）
echo ""
echo "🔍 检查前端..."
cd "$SCRIPT_DIR"

# 检查是否有已经构建好的静态文件
if [ -d "backend/static" ] && [ -n "$(ls -A backend/static 2>/dev/null)" ]; then
    echo "✅ 前端已就绪，跳过构建"
else
    # 检查NodeJS
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        echo "🔨 检测到NodeJS，正在构建前端..."
        cd "$FRONTEND_DIR"
        
        if [ ! -d "node_modules" ]; then
            echo "📦 安装前端依赖..."
            npm install
        fi
        
        npm run build
        echo "✅ 前端构建完成"
    else
        echo "⚠️  未检测到NodeJS，但已有预构建的静态文件，跳过前端构建"
    fi
fi

# 确保数据目录存在
mkdir -p "$SCRIPT_DIR/data"

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
$PYTHON_CMD app.py
