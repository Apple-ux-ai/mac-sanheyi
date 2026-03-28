from PIL import Image
import pytoshop
from pytoshop.user import nested_layers
from pytoshop.enums import ColorMode, BlendMode, Compression, ChannelId
from pytoshop import image_data
from .base import BaseConverter
from typing import Dict, Any
import numpy as np

class JPGToPSDConverter(BaseConverter):
    """JPG到PSD转换器（单层输出）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['psd']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为PSD（单层图像）
        
        Args:
            input_path: JPG文件路径
            output_path: PSD文件路径
            **options: 无特殊参数
        """
        try:
            self.validate_input(input_path)
            
            with Image.open(input_path) as img:
                # 转换为RGB模式
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                width, height = img.size
                
                # 转换为numpy数组，确保uint8类型
                img_array = np.array(img, dtype=np.uint8)  # (H, W, C)
                
                # 构建通道字典（补足透明通道，避免库内部填充-1）
                alpha_channel = np.full((height, width), 255, dtype=np.uint8)
                channels = {
                    ChannelId.red: img_array[:, :, 0],
                    ChannelId.green: img_array[:, :, 1],
                    ChannelId.blue: img_array[:, :, 2],
                    ChannelId.transparency: alpha_channel
                }
                
                # 创建单个图层
                layer = nested_layers.Image(
                    name="Background",
                    visible=True,
                    opacity=255,
                    blend_mode=BlendMode.normal,
                    top=0,
                    left=0,
                    bottom=height,
                    right=width,
                    channels=channels,
                    color_mode=ColorMode.rgb
                )
                
                # 转换为PSD
                psd = nested_layers.nested_layers_to_psd(
                    layers=[layer],
                    color_mode=ColorMode.rgb,
                    size=(width, height),
                    compression=Compression.raw
                )

                # 设置合成图像数据（RGB通道），避免预览为黑色
                rgb_channels = np.transpose(img_array, (2, 0, 1))
                psd.image_data = image_data.ImageData(
                    channels=rgb_channels,
                    compression=Compression.raw
                )
                
                # 写入文件
                with open(output_path, 'wb') as f:
                    psd.write(f)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"JPG to PSD conversion failed: {str(e)}")
