from typing import Dict, Any
from .base import BaseConverter
from .core_excel import CoreExcelConverter

class PptToExcelConverter(BaseConverter):
    """PPT 转 Excel 转换器 (使用 CoreExcelConverter)"""
    
    def __init__(self):
        super().__init__()
        self.core_converter = CoreExcelConverter()

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        self.core_converter.set_progress_callback(self.progress_callback)
        return self.core_converter.convert(input_path, output_path, **options)
