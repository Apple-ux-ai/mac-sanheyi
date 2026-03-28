from .svg_to_png import SVGToPNGConverter
from .png_to_gif import PNGToGIFConverter
from .base import BaseConverter
from typing import Dict, Any, Union, List
import os
import tempfile

class SVGToGIFConverter(BaseConverter):
    """SVG到GIF转换器（链式转换：SVG→PNG→GIF）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['gif']
        self.svg_to_png = SVGToPNGConverter()
        self.png_to_gif = PNGToGIFConverter()
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG转换为GIF（通过PNG中间格式）
        
        Args:
            input_path: SVG文件路径
            output_path: GIF文件路径
            **options: scale (float): SVG缩放因子，默认1.0
        """
        temp_pngs = []
        try:
            input_paths = [input_path] if isinstance(input_path, str) else input_path
            
            for path in input_paths:
                self.validate_input(path)

            svg_options = {
                'scale': options.get('scale', 1.0),
                'dpi': options.get('dpi', 96)
            }

            for path in input_paths:
                temp_png = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
                temp_png.close()
                temp_pngs.append(temp_png.name)
                self.svg_to_png.convert(path, temp_png.name, **svg_options)

            gif_options = {}
            if options.get('optimize') is not None:
                gif_options['optimize'] = options.get('optimize')
            if options.get('duration') is not None:
                gif_options['duration'] = options.get('duration')
            if options.get('loop') is not None:
                gif_options['loop'] = options.get('loop')
            if options.get('background_color') is not None:
                gif_options['background_color'] = options.get('background_color')

            gif_input = temp_pngs[0] if len(temp_pngs) == 1 else temp_pngs
            result = self.png_to_gif.convert(gif_input, output_path, **gif_options)
            
            return result
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to GIF conversion failed: {str(e)}")
        finally:
            for path in temp_pngs:
                if path and os.path.exists(path):
                    os.remove(path)
