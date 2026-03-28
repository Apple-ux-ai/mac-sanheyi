from PIL import Image
from .base import BaseConverter
from typing import Dict, Any, Union, List

class PNGToGIFConverter(BaseConverter):
    """PNG到GIF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['gif']
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为GIF（支持单图或多图合成动画）
        
        Args:
            input_path: PNG文件路径（字符串）或路径列表（多图合成）
            output_path: GIF文件路径
            **options: 
                optimize (bool): 是否优化，默认True
                duration (int): 每帧延迟时间（毫秒），默认100ms
                loop (int): 循环次数，0表示无限循环；不传则播放一次（不写入loop扩展）
                background_color (str): 背景颜色十六进制，默认#FFFFFF（如果需要去除透明）
        """
        try:
            # 支持单文件和多文件输入
            input_paths = [input_path] if isinstance(input_path, str) else input_path
            
            # 验证所有输入文件
            for path in input_paths:
                self.validate_input(path)
            
            optimize = options.get('optimize', True)
            duration = options.get('duration', 100)
            loop = options.get('loop')
            background_color = options.get('background_color', '#FFFFFF')
            bg_rgb = tuple(int(background_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            
            # 打开所有图片并转换为P模式
            images = []
            for path in input_paths:
                img = Image.open(path)
                # 如果有透明通道且显式指定了背景色，按背景色铺底后再处理调色板
                if 'background_color' in options and img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, bg_rgb)
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                # GIF支持透明度，但使用调色板模式
                if img.mode not in ('P', 'PA', 'L', 'LA'):
                    img = img.convert('P', palette=Image.ADAPTIVE)
                images.append(img)
            
            # 保存为GIF（单帧或多帧）
            if len(images) == 1:
                images[0].save(output_path, 'GIF', optimize=optimize)
            else:
                save_kwargs = {
                    'save_all': True,
                    'append_images': images[1:],
                    'duration': duration,
                    'optimize': optimize
                }
                if loop is not None:
                    save_kwargs['loop'] = loop

                images[0].save(
                    output_path, 
                    'GIF',
                    **save_kwargs
                )
            
            # 关闭所有图片
            for img in images:
                img.close()
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to GIF conversion failed: {str(e)}")
