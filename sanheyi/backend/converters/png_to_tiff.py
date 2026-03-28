from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class PNGToTIFFConverter(BaseConverter):
    """PNG到TIFF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['tiff', 'tif']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为TIFF
        
        Args:
            input_path: PNG文件路径
            output_path: TIFF文件路径
            **options: compression (str): 压缩类型，可选none/lzw/jpeg，默认lzw
                      background_color (str): 背景颜色十六进制，默认#FFFFFF
        """
        try:
            self.validate_input(input_path)

            # DEBUG: 打印接收到的参数
            print(f"[DEBUG] PNG to TIFF - Received options: {options}")
            
            compression_option = str(options.get('compression', 'lzw')).lower()
            compression_map = {
                'none': 'raw',
                'lzw': 'tiff_lzw',
                'jpeg': 'tiff_jpeg'
            }
            compression = compression_map.get(compression_option, 'tiff_lzw')
            background_color = options.get('background_color', '#FFFFFF')
            bg_rgb = tuple(int(background_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            
            with Image.open(input_path) as img:
                # PNG可能有透明通道，按背景色铺底后再输出TIFF（仅当显式指定背景色时）
                print(f"[DEBUG] Checking background: 'background_color' in options={('background_color' in options)}, img.mode={img.mode}")
                if 'background_color' in options and img.mode in ('RGBA', 'LA', 'P'):
                    print(f"[DEBUG] Applying background color: {background_color}")
                    # 先将P模式转换为RGBA以获取透明通道
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background = Image.new('RGB', img.size, bg_rgb)
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    elif img.mode == 'LA':
                        background.paste(img.convert('RGB'), mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    print(f"[DEBUG] No background applied, converting to RGB")
                    img = img.convert('RGB')

                img.save(output_path, 'TIFF', compression=compression)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to TIFF conversion failed: {str(e)}")
