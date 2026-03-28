import zipfile
import os
from .base import BaseConverter
from typing import Dict, Any

class SVGToZIPConverter(BaseConverter):
    """SVG到ZIP转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['zip']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG文件打包为ZIP
        
        Args:
            input_path: SVG文件路径
            output_path: ZIP文件路径
            **options: compression_level (int): 压缩级别0-9，默认6
        """
        try:
            self.validate_input(input_path)
            
            compression_level = options.get('compression_level', 6)
            
            # 创建ZIP文件
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=compression_level) as zipf:
                # 添加SVG文件，使用原文件名
                filename = os.path.basename(input_path)
                zipf.write(input_path, filename)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to ZIP conversion failed: {str(e)}")
