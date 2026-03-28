from typing import Dict, Any
from .base import BaseConverter
from .core_excel import CoreExcelConverter

class PdfToExcelConverter(BaseConverter):
    """PDF 转 Excel 转换器 (使用 CoreExcelConverter)"""
    
    def __init__(self):
        super().__init__()
        self.core_converter = CoreExcelConverter()

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        # 设置核心转换器的回调
        self.core_converter.set_progress_callback(self.progress_callback)
        
        # 执行转换
        return self.core_converter.convert(input_path, output_path, **options)
