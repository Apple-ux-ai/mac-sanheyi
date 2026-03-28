from .base import BaseConverter
from typing import Dict, Any
from .image_info import collect_image_info, write_xml


class PNGToXMLConverter(BaseConverter):
    """PNG到XML转换器"""

    def __init__(self):
        super().__init__()
        self.supported_formats = ['xml']
        self.mime_type = 'image/png'

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为XML文件信息

        Args:
            input_path: PNG文件路径
            output_path: XML文件路径
            **options: 无特殊参数
        """
        try:
            self.validate_input(input_path)
            info = collect_image_info(input_path, self.mime_type)
            write_xml(info, output_path)
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to XML conversion failed: {str(e)}")
