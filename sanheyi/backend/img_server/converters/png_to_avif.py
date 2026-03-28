from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class PNGToAVIFConverter(BaseConverter):
    """PNG到AVIF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['avif']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为AVIF
        
        Args:
            input_path: PNG文件路径
            output_path: AVIF文件路径
            **options: quality (int): 质量1-100，默认85
        """
        try:
            self.validate_input(input_path)
            
            quality = options.get('quality', 85)
            
            with Image.open(input_path) as img:
                # AVIF支持透明，保持RGBA模式
                if img.mode in ('RGBA', 'LA'):
                    # AVIF支持透明，保持原样
                    pass
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                img.save(output_path, 'AVIF', quality=quality)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to AVIF conversion failed: {str(e)}")
