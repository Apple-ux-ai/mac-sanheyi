from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class JPGToTIFFConverter(BaseConverter):
    """JPG到TIFF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['tiff', 'tif']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为TIFF
        
        Args:
            input_path: JPG文件路径
            output_path: TIFF文件路径
            **options: compression (str): 压缩类型，可选none/lzw/jpeg，默认lzw
        """
        try:
            self.validate_input(input_path)

            compression_option = str(options.get('compression', 'lzw')).lower()
            compression_map = {
                'none': 'raw',
                'lzw': 'tiff_lzw',
                'jpeg': 'tiff_jpeg'
            }
            compression = compression_map.get(compression_option, 'tiff_lzw')

            with Image.open(input_path) as img:
                # JPG通常是RGB，直接保存为TIFF
                img.save(output_path, 'TIFF', compression=compression)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"JPG to TIFF conversion failed: {str(e)}")
