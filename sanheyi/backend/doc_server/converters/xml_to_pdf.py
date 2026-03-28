import xml.etree.ElementTree as ET
import os
import html
from .base import BaseConverter
from .html_to_pdf import HtmlToPdfConverter
from typing import Dict, Any


class XmlToPdfConverter(BaseConverter):
    """XML 到 PDF 转换器（优化版 - 参考 conversion_core）
    
    优化内容：
    1. 添加进度回调
    2. 支持多种显示模式（格式化/原始）
    3. 更好的语法高亮
    4. XML 验证和错误处理
    """
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['pdf']
        self.html_converter = HtmlToPdfConverter()
    
    def _xml_to_html(self, element, depth=0) -> str:
        """将 XML 元素转换为 HTML"""
        indent = '&nbsp;' * (depth * 4)
        tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
        
        # 属性
        attrs = ' '.join([f'<span style="color:#a31515;">{k}</span>=<span style="color:#0000ff;">"{v}"</span>' 
                         for k, v in element.attrib.items()])
        if attrs:
            attrs = ' ' + attrs
        
        text = (element.text or '').strip()
        children = list(element)
        
        if not children and not text:
            return f'{indent}<span style="color:#800000;">&lt;{tag}{attrs}/&gt;</span><br>'
        
        result = f'{indent}<span style="color:#800000;">&lt;{tag}{attrs}&gt;</span>'
        
        if text and not children:
            result += html.escape(text)
            result += f'<span style="color:#800000;">&lt;/{tag}&gt;</span><br>'
        else:
            result += '<br>'
            if text:
                result += f'{indent}&nbsp;&nbsp;&nbsp;&nbsp;{html.escape(text)}<br>'
            for child in children:
                result += self._xml_to_html(child, depth + 1)
            result += f'{indent}<span style="color:#800000;">&lt;/{tag}&gt;</span><br>'
        
        return result
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        temp_html_path = None
        try:
            self.validate_input(input_path)
            self.update_progress(input_path, 10)
            
            mode = options.get('mode', 'formatted')  # 'formatted' or 'raw'
            background_color = options.get('backgroundColor', options.get('background_color', '#f5f5f5'))
            try:
                xml_content = self.read_text_file(input_path)
                xml_content = self.normalize_xml_text(xml_content)
                root = ET.fromstring(xml_content)
            except ET.ParseError as e:
                raise Exception(f"Invalid XML format: {str(e)}")
            
            self.update_progress(input_path, 30)
            
            if mode == 'raw':
                xml_html = f'<pre style="background:#f5f5f5;padding:15px;border-radius:5px;overflow-x:auto;">{html.escape(xml_content)}</pre>'
            else:
                xml_html = self._xml_to_html(root)
            
            html_content = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>XML Document</title>
    <style>
        body {{
            font-family: "Consolas", "Microsoft YaHei", monospace;
            background-color: {background_color};
            color: #333;
            padding: 20px;
            line-height: 1.4;
            font-size: 12px;
        }}
        pre {{
            font-family: "Consolas", "Courier New", monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
        }}
    </style>
</head>
<body>
    {xml_html}
</body>
</html>'''
            
            self.update_progress(input_path, 50)
            
            base_dir = os.path.dirname(output_path) or os.getcwd()
            base_name = os.path.splitext(os.path.basename(output_path))[0]
            temp_html_path = os.path.join(base_dir, base_name + "_temp.html")
            
            with open(temp_html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self.update_progress(input_path, 60)
            
            result = self.html_converter.convert(temp_html_path, output_path, **options)
            self.update_progress(input_path, 100)
            
            result['mode'] = mode
            return result
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"XML to PDF conversion failed: {str(e)}")
        finally:
            if temp_html_path and os.path.exists(temp_html_path):
                try:
                    os.remove(temp_html_path)
                except:
                    pass
