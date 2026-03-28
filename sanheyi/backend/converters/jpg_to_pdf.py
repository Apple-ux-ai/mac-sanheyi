from PIL import Image
from reportlab.pdfgen import canvas
from .base import BaseConverter
from typing import Dict, Any, Union, List

class JPGToPDFConverter(BaseConverter):
    """JPG到PDF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['pdf']
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为PDF（支持单图或多图合并）
        
        Args:
            input_path: JPG文件路径（字符串）或路径列表（多图合并）
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
            
            # 第一步：扫描所有图片获取尺寸，找到最大宽高
            max_width = 0
            max_height = 0
            image_sizes = []
            
            for img_path in input_paths:
                with Image.open(img_path) as img:
                    width, height = img.size
                    image_sizes.append((width, height))
                    max_width = max(max_width, width)
                    max_height = max(max_height, height)
            
            # 第二步：创建PDF并绘制所有图片
            # 横向：根据所有图片的最大宽高生成宽大于高的固定页面尺寸
            if orientation == 'landscape':
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

            for i, (img_path, (img_width, img_height)) in enumerate(zip(input_paths, image_sizes)):
                # 根据方向确定本页的页面尺寸
                if orientation == 'landscape':
                    page_width, page_height = fixed_page_width, fixed_page_height
                else:
                    # 竖向：每页按各自图片尺寸设置，避免短图页被长图页高拖长
                    if img_width > img_height:
                        page_width, page_height = img_height, img_width
                    else:
                        page_width, page_height = img_width, img_height

                # 第一页创建 canvas，后续页动态设置 page size
                if i == 0:
                    c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
                else:
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
                
                c.drawImage(img_path, x, y, width=draw_width, height=draw_height)
                
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
            raise Exception(f"JPG to PDF conversion failed: {str(e)}")

