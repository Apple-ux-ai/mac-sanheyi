from docx import Document
import traceback
from docx.shared import Inches
from PIL import Image
from .base import BaseConverter
from typing import Dict, Any, Union, List

class JPGToDOCXConverter(BaseConverter):
    """JPG到DOCX转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['docx']
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为DOCX
        
        Args:
            input_path: JPG文件路径
            output_path: DOCX文件路径
            **options: 无特殊参数
        """
        try:
            input_paths = input_path if isinstance(input_path, list) else [input_path]
            for path in input_paths:
                self.validate_input(path)

            doc = Document()
            section = doc.sections[0]
            available_width = section.page_width - section.left_margin - section.right_margin
            available_height = section.page_height - section.top_margin - section.bottom_margin
            available_width_in = available_width / Inches(1)
            available_height_in = available_height / Inches(1)

            for index, path in enumerate(input_paths):
                with Image.open(path) as img:
                    img_width, img_height = img.size

                img_width_in = img_width / 96
                img_height_in = img_height / 96
                width_ratio = available_width_in / img_width_in if img_width_in > 0 else 1
                height_ratio = available_height_in / img_height_in if img_height_in > 0 else 1
                scale_ratio = min(width_ratio, height_ratio, 1)
                final_width = img_width_in * scale_ratio
                final_height = img_height_in * scale_ratio

                doc.add_picture(path, width=Inches(final_width), height=Inches(final_height))
                if index < len(input_paths) - 1:
                    doc.add_page_break()

            doc.save(output_path)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            traceback.print_exc()
            error_message = str(e).strip()
            if not error_message:
                error_message = repr(e)
            raise Exception(f"JPG to DOCX conversion failed: {type(e).__name__}: {error_message}")
