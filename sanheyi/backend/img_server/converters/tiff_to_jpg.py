from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class TIFFToJPGConverter(BaseConverter):
    """TIFF到JPG转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['jpg', 'jpeg']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将TIFF转换为JPG
        
        Args:
            input_path: TIFF文件路径
            output_path: JPG文件路径
            **options: quality (int): 质量1-100，默认85
                      optimize (bool): 是否优化，默认True
        """
        try:
            self.validate_input(input_path)
            
            quality = options.get('quality', 85)
            optimize = options.get('optimize', True)
            
            with Image.open(input_path) as img:
                # TIFF可能有透明通道，转JPG需转为RGB
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                img.save(output_path, 'JPEG', quality=quality, optimize=optimize)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"TIFF to JPG conversion failed: {str(e)}")
