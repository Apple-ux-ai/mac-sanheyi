from PIL import Image
from .base import BaseConverter
from typing import Dict, Any
from collections import deque, Counter

class PNGToICOConverter(BaseConverter):
    """PNG到ICO转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['ico']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """
        将PNG转换为ICO
        
        Args:
            input_path: PNG文件路径
            output_path: ICO文件路径
            **options: icon_size (int): 图标尺寸（单个值），默认48
                      sizes (list): 图标尺寸列表（元组），默认[(48,48)]
                      background_color (str): 背景颜色十六进制，默认#FFFFFF
        """
        try:
            self.validate_input(input_path)
            
            # DEBUG: 打印接收到的参数
            print(f"[DEBUG] PNG to ICO - Received options: {options}")
            print(f"[DEBUG] icon_size: {options.get('icon_size')}, background_color: {options.get('background_color')}")
            
            # 处理icon_size参数（来自前端，单个尺寸）
            icon_size = options.get('icon_size')
            if icon_size:
                # 确保 icon_size 是整数类型
                icon_size = int(icon_size)
                target_size = (icon_size, icon_size)
            else:
                # 使用sizes参数或默认值
                sizes = options.get('sizes', [(48, 48)])
                target_size = sizes[0] if sizes else (48, 48)
            
            print(f"[DEBUG] Final target_size: {target_size}")
            
            background_color = options.get('background_color', '#FFFFFF')
            background_color = background_color.upper()
            bg_rgb = tuple(int(background_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            
            with Image.open(input_path) as img:
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')

                print(f"[DEBUG] Checking background: 'background_color' in options={('background_color' in options)}, img.mode={img.mode}")
                if 'background_color' in options:
                    alpha = img.split()[-1]
                    extrema = alpha.getextrema()
                    has_transparency = extrema[0] < 255

                    if has_transparency:
                        print(f"[DEBUG] Applying background color (transparent): {background_color}")
                        img = img.resize(target_size, Image.Resampling.LANCZOS)
                        alpha = img.split()[-1]
                        background = Image.new('RGB', img.size, bg_rgb)
                        background.paste(img, mask=alpha)
                        img = background.convert('RGBA')
                    else:
                        print(f"[DEBUG] Replacing edge background to: {background_color}")
                        img = self._replace_edge_background(img, bg_rgb)
                        img = img.resize(target_size, Image.Resampling.LANCZOS)
                else:
                    print(f"[DEBUG] No background applied, resizing only")
                    img = img.resize(target_size, Image.Resampling.LANCZOS)
                
                img.save(output_path, 'ICO', sizes=[target_size])
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PNG to ICO conversion failed: {str(e)}")

    def _is_color_close(self, color1: tuple, color2: tuple, tolerance: int = 10) -> bool:
        return all(abs(c1 - c2) <= tolerance for c1, c2 in zip(color1[:3], color2[:3]))

    def _get_border_points(self, width: int, height: int, step: int):
        points = []
        for x in range(0, width, step):
            points.append((x, 0))
            points.append((x, height - 1))
        for y in range(step, height - step, step):
            points.append((0, y))
            points.append((width - 1, y))
        return points

    def _replace_edge_background(self, img: Image.Image, target_color_rgb: tuple) -> Image.Image:
        try:
            img_rgba = img.convert("RGBA")
            width, height = img_rgba.size
            if width <= 4 or height <= 4:
                return img
            
            pixels = img_rgba.load()

            step = max(1, min(width, height) // 64)
            border_points = self._get_border_points(width, height, step)
            border_colors = [pixels[x, y] for x, y in border_points]

            buckets = Counter()
            bucket_samples = {}
            for color in border_colors:
                if self._is_color_close(color, target_color_rgb + (255,), tolerance=2):
                    continue
                r, g, b, a = color
                key = (r // 8, g // 8, b // 8, a // 32)
                buckets[key] += 1
                bucket_samples.setdefault(key, []).append(color)

            if not buckets:
                return img

            bg_bucket, _ = buckets.most_common(1)[0]
            samples = bucket_samples.get(bg_bucket, [])
            if not samples:
                return img

            bg_r = sum(c[0] for c in samples) // len(samples)
            bg_g = sum(c[1] for c in samples) // len(samples)
            bg_b = sum(c[2] for c in samples) // len(samples)
            bg_a = sum(c[3] for c in samples) // len(samples)
            bg_color = (bg_r, bg_g, bg_b, bg_a)

            diffs = []
            for c in samples:
                diffs.append(max(abs(int(c[i]) - int(bg_color[i])) for i in range(3)))
            tolerance = min(80, max(20, max(diffs, default=0) + 10))

            queue = deque()
            visited = set()
            for x, y in border_points:
                if self._is_color_close(pixels[x, y], bg_color, tolerance):
                    queue.append((x, y))
                    visited.add((x, y))
            
            target_rgba = target_color_rgb + (255,)
            changed = False
            
            while queue:
                x, y = queue.popleft()
                current_color = pixels[x, y]
                
                if self._is_color_close(current_color, bg_color, tolerance):
                    pixels[x, y] = target_rgba
                    changed = True
                    
                    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                            visited.add((nx, ny))
                            queue.append((nx, ny))
            
            if changed:
                return img_rgba
            return img
            
        except Exception:
            return img
