from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from .base import BaseConverter
from typing import Dict, Any, Union, List


class TIFFToPDFConverter(BaseConverter):
    def __init__(self):
        super().__init__()
        self.supported_formats = ['pdf']

    def convert(self, input_path: Union[str, List[str]], output_path: str, **options) -> Dict[str, Any]:
        try:
            input_paths = [input_path] if isinstance(input_path, str) else input_path

            for path in input_paths:
                self.validate_input(path)

            orientation = options.get('orientation', 'portrait')

            pages: List[Any] = []
            max_width = 0
            max_height = 0

            print(f"DEBUG: Converter received {len(input_paths)} files")
            for img_path in input_paths:
                print(f"DEBUG: Opening image {img_path}")
                with Image.open(img_path) as img:
                    frame_count = getattr(img, "n_frames", 1)
                    print(f"DEBUG: Image has {frame_count} frames")
                    for frame_index in range(frame_count):
                        if frame_index > 0:
                            img.seek(frame_index)
                        frame = img.convert("RGB")
                        width, height = frame.size
                        pages.append((frame, width, height))
                        max_width = max(max_width, width)
                        max_height = max(max_height, height)
            
            print(f"DEBUG: Total pages to write: {len(pages)}")

            if not pages:
                raise Exception("No valid TIFF pages found")

            if orientation == 'landscape':
                fixed_page_width = max_width
                fixed_page_height = min(max_height, fixed_page_width)
            else:
                fixed_page_width = None
                fixed_page_height = None

            c = None

            for i, (image, img_width, img_height) in enumerate(pages):
                if orientation == 'landscape':
                    page_width, page_height = fixed_page_width, fixed_page_height
                else:
                    if img_width > img_height:
                        page_width, page_height = img_height, img_width
                    else:
                        page_width, page_height = img_width, img_height

                if i == 0:
                    c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
                else:
                    c.setPageSize((page_width, page_height))

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

                reader = ImageReader(image)
                c.drawImage(reader, x, y, width=draw_width, height=draw_height)

                if i < len(pages) - 1:
                    c.showPage()

            c.save()

            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path)
            }

        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"TIFF to PDF conversion failed: {str(e)}")
