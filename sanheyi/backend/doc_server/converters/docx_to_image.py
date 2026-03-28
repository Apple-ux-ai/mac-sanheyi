from .base import BaseConverter
from .docx_to_pdf import DocxToPdfConverter
from .pdf_to_image import PdfToImageConverter
from typing import Dict, Any
from PIL import Image
import os


class DocxToImageConverter(BaseConverter):
    """DOCX 到图片转换器（优化版 - 支持水印和背景色）
    
    优化内容：
    1. 支持多页输出为文件夹（数字命名）
    2. 支持长图拼接
    3. 支持背景颜色
    4. 支持水印
    5. 传递所有选项到下游转换器
    """
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['png', 'jpg', 'jpeg']
        self.pdf_converter = DocxToPdfConverter()
        self.image_converter = PdfToImageConverter()

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """将 DOCX 转换为图片（通过 PDF 中转）"""
        temp_pdf_path = None
        try:
            self.validate_input(input_path)
            self.update_progress(input_path, 5)

            base_dir = os.path.dirname(output_path) or os.getcwd()
            base_name = os.path.splitext(os.path.basename(output_path))[0]
            temp_pdf_path = os.path.join(base_dir, base_name + "_temp.pdf")

            target_ext = output_path.split('.')[-1].lower()
            if target_ext == 'jpeg':
                target_ext = 'jpg'

            if target_ext == 'jpg':
                temp_image_path = os.path.join(base_dir, base_name + "_temp.png")
            else:
                temp_image_path = output_path

            print(f"[DocxToImage] 开始转换: {input_path}")
            print(f"[DocxToImage] 选项: {options}")
            
            # 步骤1: DOCX → PDF (5% ~ 50%)
            self.update_progress(input_path, 10)
            self.pdf_converter.convert(input_path, temp_pdf_path)
            self.update_progress(input_path, 50)
            
            # 步骤2: PDF → Image (50% ~ 100%)
            # JPG 先转为 PNG，再转为 JPG，沿用 PNG 的背景逻辑
            result = self.image_converter.convert(temp_pdf_path, temp_image_path, **options)

            if target_ext == 'jpg':
                source_image_path = result.get('output_path', temp_image_path)
                try:
                    img = Image.open(source_image_path)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    quality = options.get('quality', 85)
                    img.save(output_path, 'JPEG', quality=quality, optimize=True)
                    img.close()
                    if os.path.exists(source_image_path):
                        try:
                            os.remove(source_image_path)
                        except Exception:
                            pass
                    result['output_path'] = output_path
                except Exception as e:
                    print(f"[DocxToImage] PNG 转 JPG 失败: {e}")
                    import traceback
                    traceback.print_exc()
                    raise

            result['method'] = 'docx_via_pdf'
            
            print(f"[DocxToImage] 转换完成: {result.get('output_path')}")
            
            return result
            
        except Exception as e:
            print(f"[DocxToImage] 转换失败: {e}")
            import traceback
            traceback.print_exc()
            self.cleanup_on_error(output_path)
            raise Exception(f"DOCX to Image conversion failed: {str(e)}")
        finally:
            # 清理临时 PDF
            if temp_pdf_path and os.path.exists(temp_pdf_path):
                try:
                    os.remove(temp_pdf_path)
                    print(f"[DocxToImage] 清理临时文件: {temp_pdf_path}")
                except Exception as e:
                    print(f"[DocxToImage] 清理临时文件失败: {e}")
