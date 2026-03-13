#!/bin/bash
# AR 虚拟展厅 - 启动脚本
# 使用 Python 内置 HTTP 服务器

PORT=${1:-8080}

echo "=== AR 虚拟展厅 ==="
echo ""
echo "本地访问: http://localhost:$PORT"
echo "手机访问: http://$(ipconfig getifaddr en0 2>/dev/null || echo 'YOUR_IP'):$PORT"
echo ""
echo "提示: 手机扫码时，请确保手机和电脑在同一WiFi网络下"
echo "按 Ctrl+C 停止服务器"
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Try Python 3, fallback to Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "错误: 未找到 Python，请安装 Python 3"
    exit 1
fi
