from ebooklib import epub
from PIL import Image
from .base import BaseConverter
from typing import Dict, Any
import os

class PNGToEPUBConverter(BaseConverter):
    """PNG到EPUB转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['epub']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为EPUB电子书
        
        Args:
            input_path: PNG文件路径
            output_path: EPUB文件路径
            **options: 无特殊参数
        """
        try:
            self.validate_input(input_path)
            
            # 创建EPUB书籍
            book = epub.EpubBook()
            
            # 设置元数据
            book.set_identifier('img_converter_001')
            book.set_title('Image Book')
            book.set_language('en')
            
            # 读取图片
            with open(input_path, 'rb') as f:
                img_content = f.read()
            
            # 确定图片格式
            img_ext = os.path.splitext(input_path)[1].lower()
            if img_ext == '.png':
                media_type = 'image/png'
            elif img_ext in ['.jpg', '.jpeg']:
                media_type = 'image/jpeg'
            else:
                media_type = 'image/png'
            
            # 添加图片作为EPUB资源
            img_name = f'image{img_ext}'
            epub_img = epub.EpubItem(
                uid='image_1',
                file_name=img_name,
                media_type=media_type,
                content=img_content
            )
            book.add_item(epub_img)
            
            # 创建包含图片的章节
            chapter = epub.EpubHtml(
                title='Image',
                file_name='chapter_001.xhtml',
                lang='en'
            )
            chapter.content = f'<html><body><img src="{img_name}" alt="Image" style="max-width:100%;height:auto;"/></body></html>'
            book.add_item(chapter)
            
            # 设置目录和spine
            book.toc = (epub.Link('chapter_001.xhtml', 'Image', 'chapter_001'),)
            book.add_item(epub.EpubNcx())
            book.add_item(epub.EpubNav())
            book.spine = ['nav', chapter]
            
            # 保存EPUB
            epub.write_epub(output_path, book)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to EPUB conversion failed: {str(e)}")
