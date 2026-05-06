#!/bin/bash

# 快速启动脚本 - 简化版本
# 直接启动后端服务，跳过检查

echo "🚀 快速启动拼音文档服务..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

cd "$BACKEND_DIR"

if command -v python3 &> /dev/null; then
    python3 app.py
else
    python app.py
fi
