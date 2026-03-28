import xml.etree.ElementTree as ET
from .base import BaseConverter
from typing import Dict, Any


class XmlToTxtConverter(BaseConverter):
    """XML 到 TXT 转换器 - 提取所有文本内容"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['txt']
    
    def _extract_text(self, element, depth=0) -> str:
        """递归提取 XML 元素中的文本"""
        lines = []
        indent = '  ' * depth
        
        # 元素标签
        tag_name = element.tag.split('}')[-1] if '}' in element.tag else element.tag
        
        # 元素文本
        text = (element.text or '').strip()
        tail = (element.tail or '').strip()
        
        if text:
            lines.append(f"{indent}[{tag_name}] {text}")
        elif len(element) == 0:
            # 叶子节点，显示属性
            attrs = ' '.join([f'{k}={v}' for k, v in element.attrib.items()])
            if attrs:
                lines.append(f"{indent}[{tag_name}] ({attrs})")
        
        # 递归处理子元素
        for child in element:
            lines.append(self._extract_text(child, depth + 1))
        
        if tail:
            lines.append(f"{indent}{tail}")
        
        return '\n'.join(filter(None, lines))
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        try:
            self.validate_input(input_path)
            xml_content = self.read_text_file(input_path)
            xml_content = self.normalize_xml_text(xml_content)
            root = ET.fromstring(xml_content)
            text_content = self._extract_text(root)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(text_content)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"XML to TXT conversion failed: {str(e)}")
