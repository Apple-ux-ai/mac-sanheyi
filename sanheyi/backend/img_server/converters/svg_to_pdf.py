import resvg_py
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
from .base import BaseConverter
from typing import Dict, Any, Union, List
import io
import re
import xml.etree.ElementTree as ET
import tempfile
import os

class SVGToPDFConverter(BaseConverter):
    """SVG到PDF转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['pdf']
    
    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG转换为PDF（先渲染为PNG，再嵌入PDF）
        
        Args:
            input_path: SVG文件路径
            output_path: PDF文件路径
            **options: scale (float): 缩放因子，默认1.0
        """
        temp_svg_paths = []
        try:
            input_paths = [input_path] if isinstance(input_path, str) else input_path
            for path in input_paths:
                self.validate_input(path)

            scale = options.get('scale', 1.0)
            orientation = options.get('orientation', 'portrait')

            background_color = options.get('background_color', '#FFFFFF')
            color = background_color.lstrip('#') if isinstance(background_color, str) else ''
            if len(color) == 6:
                try:
                    bg_rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
                except ValueError:
                    bg_rgb = (255, 255, 255)
            else:
                bg_rgb = (255, 255, 255)

            rendered_items = []
            max_width = 0
            max_height = 0

            for path in input_paths:
                svg_path = self._prepare_svg_path(path, temp_svg_paths)
                try:
                    png_bytes = resvg_py.svg_to_bytes(svg_path=svg_path, zoom=scale)
                except TypeError:
                    png_bytes = resvg_py.svg_to_bytes(svg_path=svg_path)

                if not png_bytes:
                    raise ValueError("Failed to render SVG to PNG")

                if isinstance(png_bytes, list):
                    png_bytes = b"".join(png_bytes)

                png_stream = io.BytesIO(png_bytes)
                with Image.open(png_stream) as img:
                    width, height = img.size

                    has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                    if has_alpha:
                        rgba = img.convert('RGBA')
                        background = Image.new('RGB', rgba.size, bg_rgb)
                        background.paste(rgba, mask=rgba.split()[-1])
                        processed = background
                    else:
                        processed = img.convert('RGB')

                    processed_image = processed.copy()

                max_width = max(max_width, width)
                max_height = max(max_height, height)
                rendered_items.append((processed_image, width, height))

            if orientation == 'landscape':
                if max_height > max_width:
                    page_width, page_height = max_height, max_width
                else:
                    page_width, page_height = max_width, max_height
            else:
                if max_width > max_height:
                    page_width, page_height = max_height, max_width
                else:
                    page_width, page_height = max_width, max_height

            pdf = canvas.Canvas(output_path, pagesize=(page_width, page_height))

            for index, (img_obj, img_width, img_height) in enumerate(rendered_items):
                img_ratio = img_width / img_height
                page_ratio = page_width / page_height

                if img_ratio > page_ratio:
                    draw_width = page_width
                    draw_height = page_width / img_ratio
                else:
                    draw_height = page_height
                    draw_width = page_height * img_ratio

                x = (page_width - draw_width) / 2
                y = (page_height - draw_height) / 2

                pdf.drawImage(ImageReader(img_obj), x, y, width=draw_width, height=draw_height)

                if index < len(rendered_items) - 1:
                    pdf.showPage()

            pdf.save()
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to PDF conversion failed: {str(e)}")
        finally:
            for path in temp_svg_paths:
                if path and os.path.exists(path):
                    os.remove(path)

    def _read_svg_text(self, input_path: str) -> str:
        try:
            with open(input_path, 'rb') as f:
                data = f.read()
            try:
                return data.decode('utf-8')
            except UnicodeDecodeError:
                return data.decode('utf-8', errors='ignore')
        except Exception:
            return None

    def _parse_length(self, value):
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value) if value > 0 else None
        text = str(value).strip()
        if text.endswith('%'):
            return None
        match = re.match(r'^([0-9]*\.?[0-9]+)', text)
        if not match:
            return None
        try:
            num = float(match.group(1))
        except ValueError:
            return None
        return num if num > 0 else None

    def _parse_viewbox(self, value):
        if not value:
            return None
        parts = re.split(r'[\s,]+', value.strip())
        if len(parts) != 4:
            return None
        try:
            width = float(parts[2])
            height = float(parts[3])
        except ValueError:
            return None
        if width <= 0 or height <= 0:
            return None
        return width, height

    def _normalize_svg_content(self, content: str) -> str:
        try:
            root = ET.fromstring(content)
        except Exception:
            return self._normalize_svg_content_regex(content)

        width = self._parse_length(root.get('width'))
        height = self._parse_length(root.get('height'))
        viewbox = root.get('viewBox') or root.get('viewbox')
        viewbox_size = self._parse_viewbox(viewbox)

        new_width = width or (viewbox_size[0] if viewbox_size else None) or 1024
        new_height = height or (viewbox_size[1] if viewbox_size else None) or 1024

        updated = False
        if width is None or height is None:
            root.set('width', str(new_width))
            root.set('height', str(new_height))
            updated = True

        if viewbox_size is None:
            root.set('viewBox', f"0 0 {new_width} {new_height}")
            updated = True

        return ET.tostring(root, encoding='unicode') if updated else content

    def _normalize_svg_content_regex(self, content: str) -> str:
        match = re.search(r'<svg\b([^>]*)>', content, flags=re.IGNORECASE | re.DOTALL)
        if not match:
            return content

        attrs = match.group(1)
        width_match = re.search(r'\bwidth\s*=\s*(["\'])(.*?)\1', attrs, flags=re.IGNORECASE | re.DOTALL)
        height_match = re.search(r'\bheight\s*=\s*(["\'])(.*?)\1', attrs, flags=re.IGNORECASE | re.DOTALL)
        viewbox_match = re.search(r'\bviewBox\s*=\s*(["\'])(.*?)\1', attrs, flags=re.IGNORECASE | re.DOTALL)

        width_value = width_match.group(2) if width_match else None
        height_value = height_match.group(2) if height_match else None
        viewbox_value = viewbox_match.group(2) if viewbox_match else None

        width = self._parse_length(width_value)
        height = self._parse_length(height_value)
        viewbox_size = self._parse_viewbox(viewbox_value)

        new_width = width or (viewbox_size[0] if viewbox_size else None) or 1024
        new_height = height or (viewbox_size[1] if viewbox_size else None) or 1024

        def set_attr(source, name, value):
            pattern = re.compile(r'\b' + name + r'\s*=\s*(["\']).*?\1', flags=re.IGNORECASE | re.DOTALL)
            if pattern.search(source):
                return pattern.sub(f'{name}="{value}"', source, count=1)
            return source + f' {name}="{value}"'

        if width is None or height is None:
            attrs = set_attr(attrs, 'width', new_width)
            attrs = set_attr(attrs, 'height', new_height)

        if viewbox_size is None:
            attrs = set_attr(attrs, 'viewBox', f"0 0 {new_width} {new_height}")

        suffix = '/>' if match.group(0).rstrip().endswith('/>') else '>'
        new_tag = '<svg' + attrs + suffix
        return content[:match.start()] + new_tag + content[match.end():]

    def _prepare_svg_path(self, input_path: str, temp_paths: list) -> str:
        svg_text = self._read_svg_text(input_path)
        if not svg_text:
            return input_path
        normalized = self._normalize_svg_content(svg_text)
        if not normalized or normalized == svg_text:
            return input_path
        temp_svg = tempfile.NamedTemporaryFile(suffix='.svg', delete=False)
        temp_svg.write(normalized.encode('utf-8'))
        temp_svg.close()
        temp_paths.append(temp_svg.name)
        return temp_svg.name
