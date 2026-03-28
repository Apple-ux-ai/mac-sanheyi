#!/bin/bash
# -----------------------------------------------------------------------------
# 功能：麒麟系统 (Linux) 一键打包脚本
# 作者：FullStack-Guardian
# 更新时间：2026-03-09
# -----------------------------------------------------------------------------

set -e

echo "开始构建麒麟系统安装包..."

# 1. 环境检查
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3，请先安装。"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "错误: 未找到 npm，请先安装。"
    exit 1
fi

# 2. 构建前端
echo "正在构建前端资源..."
cd frontend
npm install
npm run build
cd ..

# 3. 构建后端 (Linux 版)
echo "正在构建 Python 后端 (Linux)..."
# 确保安装了打包依赖
pip3 install -r backend/requirements.txt
pip3 install pyinstaller

# 使用 PyInstaller 打包
# 注意：在 Linux 下生成的是 ELF 格式的 'api' 文件，而不是 'api.exe'
pyinstaller --noconfirm --onedir --console \
    --distpath backend/dist \
    --workpath backend/build_temp \
    --name api \
    --paths backend \
    backend/main.py

# 4. 准备 FFmpeg (Linux 版)
# TODO-Guardian: 此处应确保 backend/bin 目录下存在 linux 版的 ffmpeg 和 ffprobe
if [ ! -f "backend/bin/ffmpeg" ]; then
    echo "警告: 未在 backend/bin/ 找到 Linux 版 ffmpeg。请确保该目录下包含适用于 Linux 的二进制文件。"
    # 可选：自动下载静态版 ffmpeg
    # wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
fi

# 5. 执行 Electron 打包
echo "正在生成 .deb 和 .AppImage 安装包..."
npm run build:linux

echo "打包完成！产物位于 release_unpacked 目录中。"
