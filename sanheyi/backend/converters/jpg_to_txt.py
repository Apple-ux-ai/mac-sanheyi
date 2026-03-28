from .base import BaseConverter
from typing import Dict, Any, Union, List
from .image_info import collect_image_info, write_txt
import json


class JPGToTXTConverter(BaseConverter):
    """JPG到TXT转换器"""

    def __init__(self):
        super().__init__()
        self.supported_formats = ['txt']
        self.mime_type = 'image/jpeg'

    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为TXT文件信息

        Args:
            input_path: JPG文件路径
            output_path: TXT文件路径
            **options: 无特殊参数
        """
        try:
            input_paths = input_path if isinstance(input_path, list) else [input_path]
            for path in input_paths:
                self.validate_input(path)

            if len(input_paths) == 1:
                info = collect_image_info(input_paths[0], self.mime_type)
                write_txt(info, output_path)
            else:
                lines = []
                for index, path in enumerate(input_paths):
                    info = collect_image_info(path, self.mime_type)
                    metadata = json.dumps(info.get('metadata', {}), ensure_ascii=True, separators=(',', ':'))
                    block = [
                        f"filename={info.get('filename', '')}",
                        f"width={info.get('width', '')}",
                        f"height={info.get('height', '')}",
                        f"mime_type={info.get('mime_type', '')}",
                        f"metadata={metadata}",
                        f"base64={info.get('base64', '')}"
                    ]
                    if index > 0:
                        lines.append("")
                    lines.extend(block)
                with open(output_path, 'w', encoding='utf-8') as file_handle:
                    file_handle.write("\n".join(lines))
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"JPG to TXT conversion failed: {str(e)}")
