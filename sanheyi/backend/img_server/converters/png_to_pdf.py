from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from .base import BaseConverter
from typing import Dict, Any, Union, List

class PNGToPDFConverter(BaseConverter):
    """PNG到PDF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['pdf']
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为PDF（支持单图或多图合并）
        
        Args:
            input_path: PNG文件路径（字符串）或路径列表（多图合并）
            output_path: PDF文件路径
            **options: 
                orientation (str): 页面方向，'portrait'（竖向）或'landscape'（横向），默认portrait
        """
        try:
            # 支持单文件和多文件输入
            input_paths = [input_path] if isinstance(input_path, str) else input_path
            
            # 验证所有输入文件
            for path in input_paths:
                self.validate_input(path)
            
            orientation = options.get('orientation', 'portrait')
            background_color = options.get('background_color', '#FFFFFF')

            color = background_color.lstrip('#') if isinstance(background_color, str) else ''
            if len(color) == 6:
                bg_rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
            else:
                bg_rgb = (255, 255, 255)
            
            # 第一步：处理所有图片（透明背景处理）
            processed_images = []
            image_sizes = []
            
            for img_path in input_paths:
                with Image.open(img_path) as img:
                    width, height = img.size
                    image_sizes.append((width, height))

                    has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                    if has_alpha:
                        rgba = img.convert('RGBA')
                        background = Image.new('RGB', rgba.size, bg_rgb)
                        background.paste(rgba, mask=rgba.split()[-1])
                        processed_images.append(background)
                    else:
                        processed_images.append(img.convert('RGB'))
            
            # 第二步：创建PDF（每页按各自图片尺寸设置）
            # 横向：根据所有图片的最大宽高生成宽大于高的固定页面尺寸
            if orientation == 'landscape':
                max_width = max((w for (w, _) in image_sizes), default=0)
                max_height = max((h for (_, h) in image_sizes), default=0)
                if max_width >= max_height:
                    fixed_page_width = max_width
                    fixed_page_height = max_height if max_height > 0 else max_width
                else:
                    fixed_page_width = max_height
                    fixed_page_height = max_width if max_width > 0 else max_height
            else:
                fixed_page_width = None
                fixed_page_height = None

            c = None
            
            for i, (img_obj, (img_width, img_height)) in enumerate(zip(processed_images, image_sizes)):
                # 根据方向确定本页的页面尺寸
                if orientation == 'landscape':
                    page_width, page_height = fixed_page_width, fixed_page_height
                else:
                    # 竖向：高度应该大于宽度
                    if img_width > img_height:
                        page_width, page_height = img_height, img_width
                    else:
                        page_width, page_height = img_width, img_height
                
                # 第一页创建 canvas
                if i == 0:
                    c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
                else:
                    # 后续页更新页面尺寸
                    c.setPageSize((page_width, page_height))
                
                # 计算图片在页面中的位置和尺寸（保持宽高比，居中显示）
                img_ratio = img_width / img_height
                page_ratio = page_width / page_height
                
                if img_ratio > page_ratio:
                    # 图片更宽，以页面宽度为准
                    draw_width = page_width
                    draw_height = page_width / img_ratio
                else:
                    # 图片更高，以页面高度为准
                    draw_height = page_height
                    draw_width = page_height * img_ratio
                
                # 居中绘制
                x = (page_width - draw_width) / 2
                y = (page_height - draw_height) / 2
                
                c.drawImage(ImageReader(img_obj), x, y, width=draw_width, height=draw_height)
                
                # 如果不是最后一页，添加新页
                if i < len(input_paths) - 1:
                    c.showPage()
            
            c.save()
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to PDF conversion failed: {str(e)}")

