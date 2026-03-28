from .base import BaseConverter
from typing import Dict, Any, Union, List
import base64

class PNGToHTMLConverter(BaseConverter):
    """PNG到HTML转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['html']
        self.mime_type = 'image/png'
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG嵌入HTML文件
        
        Args:
            input_path: PNG文件路径
            output_path: HTML文件路径
            **options: 无特殊参数
        """
        try:
            input_paths = input_path if isinstance(input_path, list) else [input_path]
            for path in input_paths:
                self.validate_input(path)

            data_uris = []
            for path in input_paths:
                with open(path, 'rb') as f:
                    data = f.read()
                encoded = base64.b64encode(data).decode('utf-8')
                data_uris.append(f"data:{self.mime_type};base64,{encoded}")

            image_tags = "\n    ".join([f"<img src=\"{uri}\" alt=\"Converted Image\" />" for uri in data_uris])

            html_template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Viewer</title>
    <style>
        body {{ margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 20px; min-height: 100vh; background: #f5f5f5; }}
        img {{ max-width: 100%; height: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
    </style>
</head>
<body>
    {image_tags}
</body>
</html>"""
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_template)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to HTML conversion failed: {str(e)}")
