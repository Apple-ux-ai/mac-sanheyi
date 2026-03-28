from .svg_to_png import SVGToPNGConverter
from .png_to_webp import PNGToWEBPConverter
from .base import BaseConverter
from typing import Dict, Any
import os
import tempfile

class SVGToWEBPConverter(BaseConverter):
    """SVG到WEBP转换器（链式转换：SVG→PNG→WEBP）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['webp']
        self.svg_to_png = SVGToPNGConverter()
        self.png_to_webp = PNGToWEBPConverter()
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG转换为WEBP（通过PNG中间格式）
        
        Args:
            input_path: SVG文件路径
            output_path: WEBP文件路径
            **options: quality (int): 质量1-100，默认80
                      lossless (bool): 是否无损，默认False
                      scale (float): SVG缩放因子，默认1.0
        """
        temp_png = None
        try:
            self.validate_input(input_path)
            
            # Step 1: SVG→PNG（临时文件）
            temp_png = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_png.close()
            
            svg_options = {
                'scale': options.get('scale', 1.0),
                'dpi': options.get('dpi', 96)
            }
            self.svg_to_png.convert(input_path, temp_png.name, **svg_options)
            
            # Step 2: PNG→WEBP（最终文件）
            webp_options = {
                'quality': options.get('quality', 80),
                'lossless': options.get('lossless', False)
            }
            result = self.png_to_webp.convert(temp_png.name, output_path, **webp_options)
            
            return result
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to WEBP conversion failed: {str(e)}")
        finally:
            if temp_png and os.path.exists(temp_png.name):
                os.remove(temp_png.name)
