from .base import BaseConverter
from typing import Dict, Any

class SVGToHTMLConverter(BaseConverter):
    """SVG到HTML转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['html']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG嵌入HTML文件
        
        Args:
            input_path: SVG文件路径
            output_path: HTML文件路径
            **options: 无特殊参数
        """
        try:
            self.validate_input(input_path)
            
            # 读取SVG内容
            with open(input_path, 'r', encoding='utf-8') as f:
                svg_content = f.read()
            
            # 嵌入HTML模板
            html_template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Viewer</title>
    <style>
        body {{ margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }}
        svg {{ max-width: 100%; height: auto; }}
    </style>
</head>
<body>
    {svg_content}
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
            raise Exception(f"SVG to HTML conversion failed: {str(e)}")
