import os
import sys
import tempfile

def get_base_path():
    """获取应用程序的数据存储路径"""
    # 无论是否打包，我们都应该使用一个稳定且可写的路径来存储临时文件
    # 避免直接在程序目录（可能是只读的 Program Files）下写入
    
    if sys.platform == 'win32':
        # 优先使用 LOCALAPPDATA (C:\Users\User\AppData\Local\ConvertTool)
        app_data = os.environ.get('LOCALAPPDATA') or os.environ.get('APPDATA')
        if app_data:
            return os.path.join(app_data, 'ConvertTool')
    else:
        # Linux / Kylin 系统使用用户家目录下的 .config
        home = os.path.expanduser('~')
        return os.path.join(home, '.config', 'kunqiong-converter')
        
    # 回退到临时目录
    return os.path.join(tempfile.gettempdir(), 'ConvertTool')

BASE_DIR = get_base_path()
UPLOAD_DIR = os.path.join(BASE_DIR, "temp", "uploads")
DOWNLOAD_DIR = os.path.join(BASE_DIR, "temp", "downloads")

# 打印调试信息
print(f"Backend Config - Frozen: {getattr(sys, 'frozen', False)}")
print(f"Backend Config - Sys Executable: {sys.executable}")
print(f"Backend Config - PID: {os.getpid()}")
print(f"Backend Config - CWD: {os.getcwd()}")
print(f"Backend Config - BASE_DIR: {BASE_DIR}")
print(f"Backend Config - UPLOAD_DIR: {UPLOAD_DIR}")

# 确保目录存在
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    print(f"Backend Config - Created directories successfully")
except Exception as e:
    print(f"Backend Config - Failed to create directories: {e}")



# 服务器配置
HOST = "127.0.0.1"
PORT = 8070

# 文件配置
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    # 图片格式
    '.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp', 
    '.tiff', '.tif', '.ico', '.svg', '.ai', '.eps',
    # 文档格式
    '.pdf', '.doc', '.docx', '.txt', '.html', '.xml', 
    '.json', '.csv', '.xlsx', '.xls', '.ppt', '.pptx',
    # 视频格式
    '.mp4', '.avi', '.mov', '.webm', '.gif', '.mkv',
    # 音频格式
    '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'
}

# 清理配置
FILE_RETENTION_HOURS = 1
