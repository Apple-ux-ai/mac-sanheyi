from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage
from PIL import Image
from .base import BaseConverter
from typing import Dict, Any, Union, List

class JPGToXLSConverter(BaseConverter):
    """JPG到XLS转换器（输出为XLSX格式）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['xls', 'xlsx']
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为XLS（实际为XLSX格式）
        
        Args:
            input_path: JPG文件路径
            output_path: XLS文件路径
            **options: 无特殊参数
        """
        try:
            input_paths = input_path if isinstance(input_path, list) else [input_path]
            for path in input_paths:
                self.validate_input(path)

            wb = Workbook()

            for index, path in enumerate(input_paths):
                if index == 0:
                    ws = wb.active
                    ws.title = "Image 1"
                else:
                    ws = wb.create_sheet(title=f"Image {index + 1}")

                img = XLImage(path)

                with Image.open(path) as pil_img:
                    img_width, img_height = pil_img.size

                max_width = 800
                if img_width > max_width:
                    scale = max_width / img_width
                    img.width = int(img_width * scale)
                    img.height = int(img_height * scale)

                ws.add_image(img, 'A1')

            wb.save(output_path)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"JPG to XLS conversion failed: {str(e)}")
