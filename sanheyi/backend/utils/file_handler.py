import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from config import UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_EXTENSIONS

class FileHandler:
    """文件处理工具类"""
    
    @staticmethod
    async def save_upload_file(file: UploadFile) -> str:
        """
        保存上传的文件
        
        Args:
            file: FastAPI UploadFile对象
            
        Returns:
            保存后的文件路径
        """
        # 验证文件扩展名
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS}")
        
        # 生成唯一文件名
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # 保存文件并检查大小
        total_size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    buffer.close()
                    os.remove(file_path)
                    raise ValueError(f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB")
                buffer.write(chunk)
        
        return file_path
    
    @staticmethod
    def cleanup_file(file_path: str):
        """删除文件"""
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
