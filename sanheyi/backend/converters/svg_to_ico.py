from .svg_to_png import SVGToPNGConverter
from .png_to_ico import PNGToICOConverter
from .base import BaseConverter
from typing import Dict, Any
import os
import tempfile

class SVGToICOConverter(BaseConverter):
    """SVG到ICO转换器（链式转换：SVG→PNG→ICO）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['ico']
        self.svg_to_png = SVGToPNGConverter()
        self.png_to_ico = PNGToICOConverter()
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG转换为ICO（通过PNG中间格式）
        
        Args:
            input_path: SVG文件路径
            output_path: ICO文件路径
            **options: icon_size (int): 图标尺寸（单个值），默认48
                      scale (float): SVG缩放因子，默认1.0
                      background_color (str): 背景颜色十六进制，默认#FFFFFF
        """
        temp_png = None
        try:
            self.validate_input(input_path)
            
            # Step 1: SVG→PNG（临时文件）
            temp_png = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_png.close()
            
            svg_options = {
                'scale': options.get('scale', 1.0),
                'dpi': options.get('dpi', 96),
                'background_color': options.get('background_color')
            }
            self.svg_to_png.convert(input_path, temp_png.name, **svg_options)
            
            # Step 2: PNG→ICO（最终文件），传递icon_size参数
            ico_options = {}
            if 'icon_size' in options:
                ico_options['icon_size'] = options['icon_size']
            if 'background_color' in options:
                ico_options['background_color'] = options['background_color']
            result = self.png_to_ico.convert(temp_png.name, output_path, **ico_options)
            
            return result
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to ICO conversion failed: {str(e)}")
        finally:
            if temp_png and os.path.exists(temp_png.name):
                os.remove(temp_png.name)
