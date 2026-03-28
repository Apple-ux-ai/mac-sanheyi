from .svg_to_png import SVGToPNGConverter
from .png_to_jpg import PNGToJPGConverter
from .base import BaseConverter
from typing import Dict, Any
import os
import tempfile

class SVGToJPGConverter(BaseConverter):
    """SVG到JPG转换器（链式转换：SVG→PNG→JPG）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['jpg', 'jpeg']
        self.svg_to_png = SVGToPNGConverter()
        self.png_to_jpg = PNGToJPGConverter()
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG转换为JPG（通过PNG中间格式）
        
        Args:
            input_path: SVG文件路径
            output_path: JPG文件路径
            **options: quality (int): 质量1-100，默认85
                      optimize (bool): 是否优化，默认True
                      scale (float): SVG缩放因子，默认1.0
        """
        temp_png = None
        try:
            self.validate_input(input_path)
            
            # Step 1: SVG→PNG（临时文件）
            temp_png = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_png.close()
            
            # 提取SVG相关参数
            svg_options = {
                'scale': options.get('scale', 1.0),
                'dpi': options.get('dpi', 96)
            }
            self.svg_to_png.convert(input_path, temp_png.name, **svg_options)
            
            # Step 2: PNG→JPG（最终文件）
            jpg_options = {
                'quality': options.get('quality', 85),
                'optimize': options.get('optimize', True)
            }
            result = self.png_to_jpg.convert(temp_png.name, output_path, **jpg_options)
            
            return result
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to JPG conversion failed: {str(e)}")
        finally:
            # Step 3: 清理临时文件
            if temp_png and os.path.exists(temp_png.name):
                os.remove(temp_png.name)
