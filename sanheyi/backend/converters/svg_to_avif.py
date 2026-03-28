from .svg_to_png import SVGToPNGConverter
from .png_to_avif import PNGToAVIFConverter
from .base import BaseConverter
from typing import Dict, Any
import os
import tempfile

class SVGToAVIFConverter(BaseConverter):
    """SVG到AVIF转换器（链式转换：SVG→PNG→AVIF）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['avif']
        self.svg_to_png = SVGToPNGConverter()
        self.png_to_avif = PNGToAVIFConverter()
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG转换为AVIF（通过PNG中间格式）
        
        Args:
            input_path: SVG文件路径
            output_path: AVIF文件路径
            **options: quality (int): 质量1-100，默认80
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
            
            # Step 2: PNG→AVIF（最终文件）
            avif_options = {
                'quality': options.get('quality', 80)
            }
            result = self.png_to_avif.convert(temp_png.name, output_path, **avif_options)
            
            return result
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to AVIF conversion failed: {str(e)}")
        finally:
            if temp_png and os.path.exists(temp_png.name):
                os.remove(temp_png.name)
