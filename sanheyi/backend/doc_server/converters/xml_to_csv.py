import xmltodict
import csv
import json
from .base import BaseConverter
from typing import Dict, Any

class XmlToCsvConverter(BaseConverter):
    """XML 到 CSV 转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['csv']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        try:
            self.validate_input(input_path)
            xml_content = self.read_text_file(input_path)
            xml_content = self.normalize_xml_text(xml_content)
            data = xmltodict.parse(xml_content)
            
            # 尝试展平结构，找到列表数据
            # 这是一个简单的启发式方法，寻找第一个列表节点
            rows = []
            
            def find_list(d):
                for k, v in d.items():
                    if isinstance(v, list):
                        return v
                    if isinstance(v, dict):
                        res = find_list(v)
                        if res: return res
                return None
            
            found_list = find_list(data)
            
            if found_list:
                rows = found_list
            else:
                root_key = list(data.keys())[0]
                root_val = data[root_key]
                if isinstance(root_val, dict):
                    rows = [root_val]
                elif isinstance(root_val, list):
                    for item in root_val:
                        if isinstance(item, dict):
                            rows.append(item)
                        else:
                            rows.append({'value': str(item)})
                else:
                    parsed = None
                    if isinstance(root_val, str):
                        try:
                            parsed = json.loads(root_val)
                        except Exception:
                            parsed = None
                    if isinstance(parsed, list):
                        all_dict = all(isinstance(x, dict) for x in parsed)
                        if all_dict:
                            rows = parsed
                        else:
                            rows = [{'value': str(x)} for x in parsed]
                    elif isinstance(parsed, dict):
                        values = list(parsed.values())
                        if len(values) == 1 and isinstance(values[0], list):
                            inner_list = values[0]
                            if all(isinstance(x, dict) for x in inner_list):
                                rows = inner_list
                            else:
                                rows = [{'value': str(x)} for x in inner_list]
                        else:
                            rows = [parsed]
                    else:
                        rows = [{'value': str(root_val)}]

            if not rows:
                with open(output_path, 'w', encoding='utf-8', newline='') as f:
                    pass
                return {'success': True, 'output_path': output_path, 'size': 0}

            delimiter = options.get('csv_delimiter') or options.get('delimiter') or ','

            headers = set()
            for item in rows:
                if isinstance(item, dict):
                    headers.update(item.keys())
            
            fieldnames = sorted(list(headers))

            with open(output_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=delimiter)
                writer.writeheader()
                for item in rows:
                    if isinstance(item, dict):
                        # xmltodict 解析的值可能是 OrderedDict 或包含 @ 属性
                        # 这里简单处理，直接写入
                        # 如果值是字典（嵌套结构），可能需要进一步处理，这里直接转字符串
                        row_to_write = {}
                        for k, v in item.items():
                            if isinstance(v, (dict, list)):
                                row_to_write[k] = str(v)
                            else:
                                row_to_write[k] = v
                        writer.writerow(row_to_write)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"XML to CSV conversion failed: {str(e)}")
