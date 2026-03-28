import resvg_py
from .base import BaseConverter
from typing import Dict, Any
import re
import xml.etree.ElementTree as ET
import tempfile
import os

class SVGToPNGConverter(BaseConverter):
    """SVG到PNG转换器（resvg渲染）"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['png']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将SVG转换为PNG
        
        Args:
            input_path: SVG文件路径
            output_path: PNG文件路径
            **options: 
                scale (float): 缩放因子，默认1.0
                dpi (int): 分辨率，支持72/150/300/600，默认96
                background_color (str): 背景颜色十六进制，默认None
        """
        temp_svg_path = None
        try:
            self.validate_input(input_path)

            svg_path = input_path
            svg_text = self._read_svg_text(input_path)
            if svg_text:
                background_color = options.get('background_color')
                normalized = self._normalize_svg_content(svg_text, background_color)
                if normalized and normalized != svg_text:
                    temp_svg = tempfile.NamedTemporaryFile(suffix='.svg', delete=False, mode='w', encoding='utf-8')
                    temp_svg.write(normalized)
                    temp_svg.close()
                    temp_svg_path = temp_svg.name
                    svg_path = temp_svg_path

            dpi = options.get('dpi', 96)
            base_dpi = 96
            dpi_scale = dpi / base_dpi
            custom_scale = options.get('scale', 1.0)
            final_scale = dpi_scale * custom_scale

            try:
                png_bytes = resvg_py.svg_to_bytes(svg_path=svg_path, zoom=final_scale)
            except TypeError:
                png_bytes = resvg_py.svg_to_bytes(svg_path=svg_path)

            if not png_bytes:
                raise ValueError("Failed to render SVG to PNG")

            with open(output_path, 'wb') as f:
                f.write(png_bytes)

            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }

        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"SVG to PNG conversion failed: {str(e)}")
        finally:
            if temp_svg_path and os.path.exists(temp_svg_path):
                os.remove(temp_svg_path)

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

    def _normalize_svg_content(self, content: str, background_color: str = None) -> str:
        try:
            clean_content = re.sub(r'^<\?xml.*?\?>', '', content, flags=re.IGNORECASE | re.DOTALL).strip()
            root = ET.fromstring(clean_content)
        except Exception:
            return self._normalize_svg_content_regex(content, background_color)

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

        if background_color:
            if background_color.startswith('#'):
                background_color = background_color.upper()

            svg_ns = None
            if isinstance(root.tag, str) and root.tag.startswith('{') and '}' in root.tag:
                svg_ns = root.tag.split('}', 1)[0][1:]
                try:
                    ET.register_namespace('', svg_ns)
                except Exception:
                    pass

            bg_rect_found = False
            for elem in root.findall('.//{http://www.w3.org/2000/svg}rect') + root.findall('.//rect'):
                w = elem.get('width', '').strip()
                h = elem.get('height', '').strip()
                w_num = self._parse_length(w)
                h_num = self._parse_length(h)
                is_percent_full = w == '100%' and h == '100%'
                is_size_full = (
                    w_num is not None and h_num is not None and
                    (
                        (abs(w_num - new_width) < 1e-6 and abs(h_num - new_height) < 1e-6) or
                        (viewbox_size is not None and abs(w_num - viewbox_size[0]) < 1e-6 and abs(h_num - viewbox_size[1]) < 1e-6)
                    )
                )
                if is_percent_full or is_size_full:
                    style = elem.get('style', '') or ''
                    if re.search(r'fill\s*:', style, flags=re.IGNORECASE):
                        style = re.sub(r'fill\s*:\s*[^;]+', f'fill:{background_color}', style, flags=re.IGNORECASE)
                    else:
                        style = (style.rstrip() + (';' if style and not style.rstrip().endswith(';') else '') + f'fill:{background_color}')
                    elem.set('style', style)
                    elem.set('fill', background_color)
                    if elem.get('class') is not None:
                        elem.attrib.pop('class', None)
                    bg_rect_found = True
                    break

            if not bg_rect_found:
                rect_tag = f'{{{svg_ns}}}rect' if svg_ns else 'rect'
                bg_rect = ET.Element(rect_tag, {
                    'width': '100%',
                    'height': '100%',
                    'fill': background_color,
                    'x': '0',
                    'y': '0'
                })
                root.insert(0, bg_rect)
            updated = True

        return ET.tostring(root, encoding='unicode') if updated else content

    def _normalize_svg_content_regex(self, content: str, background_color: str = None) -> str:
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
        new_content = content[:match.start()] + new_tag + content[match.end():]

        if background_color:
            bg_rect_pattern = re.compile(r'<rect\s+[^>]*?width\s*=\s*["\'](?:100%|100)["\'][^>]*?height\s*=\s*["\'](?:100%|100)["\'][^>]*?>', re.IGNORECASE | re.DOTALL)

            if bg_rect_pattern.search(new_content):
                def replace_fill(m):
                    rect_tag = m.group(0)
                    rect_tag = re.sub(r'\sclass\s*=\s*(["\']).*?\1', '', rect_tag, flags=re.IGNORECASE | re.DOTALL)
                    if re.search(r'style\s*=\s*(["\'])(.*?)\1', rect_tag, flags=re.IGNORECASE | re.DOTALL):
                        def style_repl(ms):
                            quote = ms.group(1)
                            style = ms.group(2) or ''
                            if re.search(r'fill\s*:', style, flags=re.IGNORECASE):
                                style2 = re.sub(r'fill\s*:\s*[^;]+', f'fill:{background_color}', style, flags=re.IGNORECASE)
                            else:
                                sep = ';' if style and not style.rstrip().endswith(';') else ''
                                style2 = style.rstrip() + sep + f'fill:{background_color}'
                            return f'style={quote}{style2}{quote}'

                        rect_tag = re.sub(
                            r'style\s*=\s*(["\'])(.*?)\1',
                            style_repl,
                            rect_tag,
                            flags=re.IGNORECASE | re.DOTALL,
                            count=1
                        )
                    else:
                        rect_tag = rect_tag[:-1] + f' style="fill:{background_color}">'
                    if 'fill=' in rect_tag.lower():
                        rect_tag = re.sub(r'fill\s*=\s*(["\']).*?\1', f'fill="{background_color}"', rect_tag, flags=re.IGNORECASE | re.DOTALL)
                    else:
                        rect_tag = rect_tag[:-1] + f' fill="{background_color}">'
                    return rect_tag

                new_content = bg_rect_pattern.sub(replace_fill, new_content, count=1)
            else:
                bg_rect_tag = f'<rect width="100%" height="100%" fill="{background_color}" x="0" y="0" />'
                insert_pos = new_content.find(new_tag) + len(new_tag)
                new_content = new_content[:insert_pos] + bg_rect_tag + new_content[insert_pos:]

        return new_content
