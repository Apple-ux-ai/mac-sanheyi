from .base import BaseConverter
from typing import Dict, Any
import base64

class JPGToBase64Converter(BaseConverter):
    """JPG到BASE64转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['base64']
        self.mime_type = 'image/jpeg'
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将JPG转换为BASE64
        
        Args:
            input_path: JPG文件路径
            output_path: BASE64文本文件路径
            **options: 无特殊参数
        """
        try:
            self.validate_input(input_path)
            
            # 读取二进制数据
            with open(input_path, 'rb') as f:
                data = f.read()
            
            # BASE64编码
            encoded = base64.b64encode(data).decode('utf-8')
            
            # Data URI格式
            data_uri = f"data:{self.mime_type};base64,{encoded}"
            
            # 写入文本文件
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(data_uri)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"JPG to BASE64 conversion failed: {str(e)}")
