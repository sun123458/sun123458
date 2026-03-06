#!/bin/bash

# AR增强现实展厅应用启动脚本

echo "=================================="
echo "  AR增强现实展厅应用启动器"
echo "=================================="
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"
echo ""

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未检测到npm"
    exit 1
fi

echo "✅ npm版本: $(npm --version)"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo ""
fi

# 检查端口8080是否被占用
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口8080已被占用，尝试使用端口8081..."
    PORT=8081
else
    PORT=8080
fi

echo "🚀 启动服务器..."
echo ""
echo "=================================="
echo "服务器地址:"
echo "  http://localhost:$PORT/html/index.html"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "=================================="
echo ""

# 启动服务器
npx http-server -p $PORT -c-1
