from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class TIFFToPNGConverter(BaseConverter):
    """TIFF到PNG转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['png']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将TIFF转换为PNG
        
        Args:
            input_path: TIFF文件路径
            output_path: PNG文件路径
            **options: optimize (bool): 是否优化，默认True
        """
        try:
            self.validate_input(input_path)
            
            optimize = options.get('optimize', True)
            
            with Image.open(input_path) as img:
                # PNG支持多种颜色模式，包括透明通道
                img.save(output_path, 'PNG', optimize=optimize)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"TIFF to PNG conversion failed: {str(e)}")
