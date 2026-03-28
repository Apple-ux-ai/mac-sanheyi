from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class JPGToWEBPConverter(BaseConverter):
    """JPG到WEBP转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['webp']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为WEBP
        
        Args:
            input_path: JPG文件路径
            output_path: WEBP文件路径
            **options: quality (int): 质量1-100，默认85
                      lossless (bool): 是否无损，默认False
        """
        try:
            self.validate_input(input_path)
            
            quality = options.get('quality', 85)
            lossless = options.get('lossless', False)
            
            with Image.open(input_path) as img:
                # JPG通常是RGB，直接保存为WEBP
                img.save(output_path, 'WEBP', quality=quality, lossless=lossless)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"JPG to WEBP conversion failed: {str(e)}")
