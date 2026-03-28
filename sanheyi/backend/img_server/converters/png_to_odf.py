from odf.opendocument import OpenDocumentText
from odf.text import P
from odf.draw import Frame, Image as ODFImage
from odf.style import Style, GraphicProperties
from PIL import Image
from .base import BaseConverter
from typing import Dict, Any
import os
import shutil

class PNGToODFConverter(BaseConverter):
    """PNG到ODF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['odf', 'odt']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为ODF文档
        
        Args:
            input_path: PNG文件路径
            output_path: ODF文件路径
            **options: background_color (str): 背景颜色十六进制，默认#FFFFFF
        """
        try:
            self.validate_input(input_path)
            
            background_color = options.get('background_color', '#FFFFFF')
            bg_rgb = tuple(int(background_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            
            # 如果PNG有透明通道且指定了非白色背景，先处理
            temp_path = None
            final_input = input_path
            with Image.open(input_path) as img:
                if img.mode == 'RGBA' and background_color != '#FFFFFF':
                    import tempfile
                    temp_fd, temp_path = tempfile.mkstemp(suffix='.png')
                    os.close(temp_fd)
                    background = Image.new('RGB', img.size, bg_rgb)
                    background.paste(img, mask=img.split()[-1])
                    background.save(temp_path, 'PNG')
                    final_input = temp_path
            
            # 创建ODF文档
            doc = OpenDocumentText()
            
            # 获取图片尺寸
            with Image.open(final_input) as img:
                img_width, img_height = img.size
            
            # 计算缩放（限制最大宽度为6英寸=15.24cm）
            max_width_cm = 15.24
            width_cm = min(max_width_cm, img_width * 2.54 / 96)  # 像素转厘米
            height_cm = img_height * width_cm * 96 / (img_width * 2.54)
            
            # 添加图片到文档
            # 需要将图片复制到ODF包中
            img_filename = os.path.basename(input_path)
            
            # 创建Frame和Image
            frame = Frame(
                width=f"{width_cm}cm",
                height=f"{height_cm}cm",
                anchortype="paragraph"
            )
            
            # 读取图片内容并添加到文档
            with open(final_input, 'rb') as f:
                img_content = f.read()
            
            href = f"Pictures/{img_filename}"
            doc.addPicture(final_input, href)
            
            img_element = ODFImage(href=href)
            frame.addElement(img_element)
            
            # 添加到段落
            p = P()
            p.addElement(frame)
            doc.text.addElement(p)
            
            # 保存
            doc.save(output_path)
            
            # 清理临时文件
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            raise Exception(f"PNG to ODF conversion failed: {str(e)}")
