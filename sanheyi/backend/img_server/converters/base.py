from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any
import os

class BaseConverter(ABC):
    """基础转换器抽象类"""
    
    def __init__(self):
        self.supported_formats = []
    
    @abstractmethod
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        执行转换
        
        Args:
            input_path: 输入文件路径
            output_path: 输出文件路径
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        pass
    
    def validate_input(self, input_path: str) -> bool:
        """验证输入文件"""
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
        
        if not os.path.isfile(input_path):
            raise ValueError(f"Input path is not a file: {input_path}")
        
        return True
    
    def get_output_size(self, output_path: str) -> int:
        """获取输出文件大小"""
        if os.path.exists(output_path):
            return os.path.getsize(output_path)
        return 0
    
    def cleanup_on_error(self, output_path: str):
        """错误时清理输出文件"""
        if os.path.exists(output_path):
            os.remove(output_path)
