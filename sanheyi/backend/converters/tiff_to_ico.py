from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class TIFFToICOConverter(BaseConverter):
    """TIFF到ICO转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['ico']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将TIFF转换为ICO
        
        Args:
            input_path: TIFF文件路径
            output_path: ICO文件路径
            **options: icon_size (int): 图标尺寸（单个值），默认48
                      sizes (list): 图标尺寸列表（元组），默认[(48,48)]
                      background_color (str): 背景颜色十六进制，默认#FFFFFF
        """
        try:
            self.validate_input(input_path)
            
            # 处理icon_size参数（来自前端，单个尺寸）
            icon_size = options.get('icon_size')
            if icon_size:
                # 确保 icon_size 是整数类型
                icon_size = int(icon_size)
                target_size = (icon_size, icon_size)
            else:
                # 使用sizes参数或默认值
                sizes = options.get('sizes', [(48, 48)])
                target_size = sizes[0] if sizes else (48, 48)
            
            background_color = options.get('background_color', '#FFFFFF')
            bg_rgb = tuple(int(background_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            
            with Image.open(input_path) as img:
                # 先将图像缩放到目标尺寸
                img = img.resize(target_size, Image.Resampling.LANCZOS)
                
                # 如果有透明通道且显式指定了背景色，处理透明度
                if 'background_color' in options and img.mode in ('RGBA', 'LA', 'P'):
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background = Image.new('RGB', img.size, bg_rgb)
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    elif img.mode == 'LA':
                        background.paste(img.convert('RGB'), mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background.convert('RGBA')  # ICO需要RGBA模式
                elif img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                # 保存为ICO格式，使用目标尺寸
                img.save(output_path, 'ICO', sizes=[target_size])
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"TIFF to ICO conversion failed: {str(e)}")

