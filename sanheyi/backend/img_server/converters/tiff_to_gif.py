from PIL import Image
from .base import BaseConverter
from typing import Dict, Any, Union, List

class TIFFToGIFConverter(BaseConverter):
    """TIFF到GIF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['gif']
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将TIFF转换为GIF（支持单图或多图合成动画）
        
        Args:
            input_path: TIFF文件路径（字符串）或路径列表（多图合成）
            output_path: GIF文件路径
            **options: 
                optimize (bool): 是否优化，默认True
                duration (int): 每帧延迟时间（毫秒），默认100ms（仅多图）
                loop (int): 循环次数，0表示无限循环；不传则播放一次（不写入loop扩展）（仅多图）
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
            
            # 打开所有图片并转换为P模式
            images = []
            for path in input_paths:
                img = Image.open(path)
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

                images[0].save(output_path, 'GIF', **save_kwargs)
            
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
            raise Exception(f"TIFF to GIF conversion failed: {str(e)}")
