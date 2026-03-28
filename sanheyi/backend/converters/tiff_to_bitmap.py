from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class TIFFToBITMAPConverter(BaseConverter):
    """TIFF到BITMAP转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['bmp', 'bitmap']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将TIFF转换为BITMAP
        
        Args:
            input_path: TIFF文件路径
            output_path: BITMAP文件路径
            **options: 无特殊参数
        """
        try:
            self.validate_input(input_path)
            
            with Image.open(input_path) as img:
                # BMP不支持透明通道，需转为RGB
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                img.save(output_path, 'BMP')
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"TIFF to BITMAP conversion failed: {str(e)}")
