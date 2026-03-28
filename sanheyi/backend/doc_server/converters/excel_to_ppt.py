from typing import Dict, Any
from .base import BaseConverter
from .core_ppt import CorePPTConverter

class ExcelToPptConverter(BaseConverter):
    """Excel 转 PPT 转换器 (使用 CorePPTConverter)"""
    
    def __init__(self):
        super().__init__()
        self.core_converter = CorePPTConverter()

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        self.core_converter.set_progress_callback(self.progress_callback)
        return self.core_converter.convert(input_path, output_path, **options)
