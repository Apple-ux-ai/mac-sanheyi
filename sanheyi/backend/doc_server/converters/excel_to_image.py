from typing import Dict, Any
import os
import shutil
from .base import BaseConverter
from .excel_to_pdf import ExcelToPdfConverter
from .pdf_to_image import PdfToImageConverter

class ExcelToImageConverter(BaseConverter):
    """Excel 转 图片转换器 (Excel -> PDF -> Image)"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['png', 'jpg', 'jpeg']
        self.excel_to_pdf = ExcelToPdfConverter()
        self.pdf_to_image = PdfToImageConverter()

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        self.validate_input(input_path)
        self.update_progress(input_path, 5)
        
        # 1. 转换为 PDF
        pdf_path = os.path.splitext(output_path)[0] + ".temp.pdf"
        try:
            # 传递进度回调
            def pdf_progress(path, progress):
                # 0-50%
                self.update_progress(path, int(progress * 0.5))
            
            self.excel_to_pdf.progress_callback = pdf_progress
            
            # 执行 Excel -> PDF
            pdf_result = self.excel_to_pdf.convert(input_path, pdf_path)
            
            if not pdf_result['success']:
                raise Exception(pdf_result.get('error', 'Excel to PDF conversion failed'))
            
            self.update_progress(input_path, 50)
            
            # 2. 转换为图片
            # 传递进度回调
            def image_progress(path, progress):
                # 50-100%
                self.update_progress(path, 50 + int(progress * 0.5))
                
            self.pdf_to_image.progress_callback = image_progress
            
            # 执行 PDF -> Image
            # 注意: PdfToImageConverter 可能会修改 output_path (例如改为 zip 或 png)
            # 我们直接传递 output_path，让它处理
            image_result = self.pdf_to_image.convert(pdf_path, output_path, **options)
            
            if not image_result['success']:
                raise Exception(image_result.get('error', 'PDF to Image conversion failed'))
                
            return image_result
            
        finally:
            # 清理临时 PDF
            if os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                except:
                    pass
