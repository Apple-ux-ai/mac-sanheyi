from typing import Dict, Any
import os
import shutil
import tempfile
from .base import BaseConverter
from .ppt_to_pdf import PptToPdfConverter
from ..utils.fitz_loader import fitz, is_fitz_available

class PptToVideoConverter(BaseConverter):
    """PPT 转 视频转换器 (PPT -> PDF -> Images -> Video)"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['mp4', 'avi']
        self.ppt_to_pdf = PptToPdfConverter()

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        self.validate_input(input_path)
        
        # 检查依赖
        try:
            try:
                # 尝试导入 moviepy v1.x (旧版)
                from moviepy.editor import ImageSequenceClip
            except ImportError:
                # 尝试导入 moviepy v2.x (新版)
                from moviepy.video.io.ImageSequenceClip import ImageSequenceClip
        except ImportError:
            raise ImportError("moviepy is required for video conversion. Please install it: pip install moviepy")

        if not is_fitz_available():
            raise ImportError("PyMuPDF (fitz) is required. Please install it.")

        self.update_progress(input_path, 5)
        
        temp_dir = tempfile.mkdtemp()
        pdf_path = os.path.join(temp_dir, "temp.pdf")
        
        try:
            # 1. PPT -> PDF
            def pdf_progress(path, progress):
                self.update_progress(path, int(progress * 0.4)) # 0-40%
            
            self.ppt_to_pdf.progress_callback = pdf_progress
            pdf_result = self.ppt_to_pdf.convert(input_path, pdf_path)
            
            if not pdf_result['success']:
                raise Exception(pdf_result.get('error', 'PPT to PDF conversion failed'))
            
            self.update_progress(input_path, 40)
            
            # 2. PDF -> Images
            doc = fitz.open(pdf_path)
            image_files = []
            
            # 视频设置
            fps = options.get('fps', 0.5) # 默认每张幻灯片 2 秒
            resolution = options.get('resolution', 1080) # 垂直分辨率
            
            for i, page in enumerate(doc):
                # 计算缩放以达到目标分辨率
                zoom = resolution / page.rect.height
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                
                img_path = os.path.join(temp_dir, f"slide_{i:04d}.png")
                pix.save(img_path)
                image_files.append(img_path)
                
                # 进度 40-70%
                progress = 40 + int(((i + 1) / len(doc)) * 30)
                self.update_progress(input_path, progress)
                
            doc.close()
            
            if not image_files:
                raise Exception("No slides found in PPT")
                
            self.update_progress(input_path, 70)
            
            # 3. Images -> Video
            print(f"[PptToVideo] Creating video from {len(image_files)} slides...")
            
            clip = ImageSequenceClip(image_files, fps=fps)
            
            # 写入视频文件
            # logger=None 禁止 moviepy 输出到 stdout，避免干扰
            clip.write_videofile(output_path, codec='libx264', audio=False, logger=None)
            
            self.update_progress(input_path, 100)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path),
                'duration': clip.duration
            }
            
        except Exception as e:
            raise Exception(f"PPT to Video conversion failed: {str(e)}")
        finally:
            # 清理临时文件
            shutil.rmtree(temp_dir, ignore_errors=True)
