import base64
import csv
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from PIL import Image


def _serialize_metadata_value(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, bytes):
        return base64.b64encode(value).decode('ascii')
    if isinstance(value, (list, tuple)):
        return [_serialize_metadata_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _serialize_metadata_value(val) for key, val in value.items()}
    return str(value)


def collect_image_info(input_path: str, mime_type: str) -> Dict[str, Any]:
    file_path = Path(input_path)
    stat = os.stat(input_path)

    with Image.open(input_path) as img:
        width, height = img.size
        image_format = img.format
        mode = img.mode
        info = _serialize_metadata_value(dict(img.info))

    with open(input_path, 'rb') as file_handle:
        data = file_handle.read()

    metadata = {
        'file_size': stat.st_size,
        'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
        'modified_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
        'format': image_format,
        'mode': mode,
        'info': info
    }

    return {
        'filename': file_path.name,
        'width': width,
        'height': height,
        'mime_type': mime_type,
        'base64': base64.b64encode(data).decode('ascii'),
        'metadata': metadata
    }


def _metadata_json(info: Dict[str, Any]) -> str:
    return json.dumps(info.get('metadata', {}), ensure_ascii=True, separators=(',', ':'))


def write_txt(info: Dict[str, Any], output_path: str) -> None:
    lines = [
        f"filename={info.get('filename', '')}",
        f"width={info.get('width', '')}",
        f"height={info.get('height', '')}",
        f"mime_type={info.get('mime_type', '')}",
        f"metadata={_metadata_json(info)}",
        f"base64={info.get('base64', '')}"
    ]
    with open(output_path, 'w', encoding='utf-8') as file_handle:
        file_handle.write("\n".join(lines))


def write_csv(info: Dict[str, Any], output_path: str) -> None:
    metadata = info.get('metadata', {})
    header = [
        'filename', 'width', 'height', 'mime_type', 
        'file_size', 'format', 'mode', 
        'created_at', 'modified_at', 
        'metadata_info', 'base64'
    ]
    row = [
        info.get('filename', ''),
        info.get('width', ''),
        info.get('height', ''),
        info.get('mime_type', ''),
        metadata.get('file_size', ''),
        metadata.get('format', ''),
        metadata.get('mode', ''),
        metadata.get('created_at', ''),
        metadata.get('modified_at', ''),
        json.dumps(metadata.get('info', {}), ensure_ascii=True, separators=(',', ':')),
        info.get('base64', '')
    ]
    with open(output_path, 'w', encoding='utf-8', newline='') as file_handle:
        writer = csv.writer(file_handle)
        writer.writerow(header)
        writer.writerow(row)


def write_json(info: Dict[str, Any], output_path: str) -> None:
    with open(output_path, 'w', encoding='utf-8') as file_handle:
        json.dump(info, file_handle, ensure_ascii=True, indent=2)


def write_xml(info: Dict[str, Any], output_path: str) -> None:
    from xml.etree.ElementTree import Element, SubElement, ElementTree

    root = Element('fileInfo')
    for key in ['filename', 'width', 'height', 'mime_type', 'base64']:
        child = SubElement(root, key)
        child.text = str(info.get(key, ''))

    metadata_node = SubElement(root, 'metadata')
    metadata_node.text = _metadata_json(info)

    tree = ElementTree(root)
    tree.write(output_path, encoding='utf-8', xml_declaration=True)
