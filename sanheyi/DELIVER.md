# 鲲穹转换大师 - 麒麟系统 (Kylin OS) 交付清单

## 1. 一键打包命令
在 Linux (麒麟/Ubuntu) 环境下，执行以下脚本即可完成打包：
```bash
chmod +x scripts/build-kylin.sh
./scripts/build-kylin.sh
```

## 2. 产物说明
打包完成后，产物位于 `release_unpacked/` 目录：
- **.deb**: 麒麟系统原生安装包，支持一键安装及卸载。
- **.AppImage**: 跨 Linux 发行版的免安装程序，直接运行即可。

## 3. 核心适配项
- **后端执行文件**: 已适配 Linux ELF 格式，使用 PyInstaller 封装。
- **数据存储**: 适配麒麟系统路径，数据存储于 `~/.config/kunqiong-converter`。
- **二进制依赖**: 替换 FFmpeg 为 Linux 64位静态版本。
- **多架构支持**: `electron-builder.yml` 已配置支持 x64 和 arm64 (国产 CPU)。

## 4. 常见问题排查
| 现象 | 原因 | 解决方法 |
| :--- | :--- | :--- |
| 无法启动 | 缺少依赖库 | 安装 `libnss3`, `libgbm1`, `libasound2` |
| 转换失败 | FFmpeg 权限不足 | 执行 `chmod +x resources/backend/bin/ffmpeg` |
| 图标不显示 | 缓存问题 | 尝试清空 `~/.cache/thumbnails` |

## 5. 版本信息
- 当前版本: 1.0.0
- 适配系统: 麒麟 V10 / V4 (Linux Kernel 4.15+)

---
交付完成！后续同类需求直接 @FullStack-Guardian。祝发布顺利 🎉
