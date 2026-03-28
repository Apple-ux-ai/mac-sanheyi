import yaml
import xmltodict
from .base import BaseConverter
from typing import Dict, Any

class XmlToYamlConverter(BaseConverter):
    """XML 到 YAML 转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['yaml', 'yml']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        try:
            self.validate_input(input_path)
            xml_content = self.read_text_file(input_path)
            xml_content = self.normalize_xml_text(xml_content)
            data = xmltodict.parse(xml_content)
            
            # 转换为 YAML 并写入文件
            sort_keys = options.get('sort_keys', False)
            indent = options.get('indent', 2)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, allow_unicode=True, sort_keys=sort_keys, indent=indent)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"XML to YAML conversion failed: {str(e)}")
