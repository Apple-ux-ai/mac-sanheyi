#!/bin/bash
# -----------------------------------------------------------------------------
# macOS：前端 + Python 后端 + Electron 便携 ZIP（x64 / arm64）
# 用法：在 sanheyi 目录下 chmod +x scripts/build-macos.sh && ./scripts/build-macos.sh
# -----------------------------------------------------------------------------

set -e

echo "开始构建 macOS 便携版 ZIP..."

if ! command -v python3 &> /dev/null; then
  echo "错误: 未找到 python3"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "错误: 未找到 npm"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "安装根目录与前端依赖..."
npm install
npm install --prefix frontend

echo "构建前端..."
npm run build:frontend

echo "构建 Python 后端 (macOS)..."
python3 -m pip install -r backend/requirements.txt
python3 build_backend.py

if [ ! -f "backend/bin/ffmpeg" ]; then
  echo "提示: backend/bin/ 下未找到 ffmpeg。视频相关功能需在 macOS 版目录中放置 ffmpeg/ffprobe 可执行文件。"
fi

echo "打包 Electron（zip，Intel + Apple Silicon）..."
export CSC_IDENTITY_AUTO_DISCOVERY=false
npx electron-builder --mac zip

echo "完成。产物位于 release_unpacked/portable/ 目录。"
