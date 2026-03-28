from PIL import Image
from .base import BaseConverter
from typing import Dict, Any

class JPGToICOConverter(BaseConverter):
    """JPG到ICO转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['ico']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为ICO
        
        Args:
            input_path: JPG文件路径
            output_path: ICO文件路径
            **options: icon_size (int): 图标尺寸（单个值），默认48
                      sizes (list): 图标尺寸列表（元组），默认[(48,48)]
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
            
            with Image.open(input_path) as img:
                # 先将图像缩放到目标尺寸
                img = img.resize(target_size, Image.Resampling.LANCZOS)
                
                # ICO需要RGBA模式
                if img.mode != 'RGBA':
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
            raise Exception(f"JPG to ICO conversion failed: {str(e)}")

