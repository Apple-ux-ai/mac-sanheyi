from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, Optional
import os
import hashlib
import json
import re

class BaseConverter(ABC):
    """基础转换器抽象类"""
    
    def __init__(self):
        self.supported_formats = []
        self._invalid_filename_chars_pattern = re.compile(r'[<>:"/\\|?*\x00-\x1f]+')
        self._whitespace_pattern = re.compile(r'\s+')
    
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

    def resolve_output_path(
        self,
        output_dir: str,
        filename: str,
        extension: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        base_name = self._sanitize_filename_component(filename) or "output"
        ext = extension if extension.startswith(".") else f".{extension}"

        suffix = ""
        if isinstance(options, dict) and options:
            options_json = json.dumps(
                options,
                sort_keys=True,
                ensure_ascii=True,
                separators=(",", ":"),
            )
            digest = hashlib.sha1(options_json.encode("utf-8")).hexdigest()[:8]
            suffix = f"__{digest}"

        candidate = os.path.join(output_dir, f"{base_name}{suffix}{ext}")
        if not os.path.exists(candidate):
            return candidate

        index = 1
        while True:
            candidate = os.path.join(output_dir, f"{base_name}{suffix}({index}){ext}")
            if not os.path.exists(candidate):
                return candidate
            index += 1

    def _sanitize_filename_component(self, value: Any) -> str:
        if value is None:
            return ""
        text = str(value)
        text = text.replace(os.sep, "_")
        if os.altsep:
            text = text.replace(os.altsep, "_")
        text = self._invalid_filename_chars_pattern.sub("_", text)
        text = self._whitespace_pattern.sub("_", text)
        text = text.strip(" ._-")
        if len(text) > 120:
            text = text[:120].rstrip(" ._-")
        return text
