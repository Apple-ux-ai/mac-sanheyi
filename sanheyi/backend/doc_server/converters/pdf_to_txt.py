from pdfminer.high_level import extract_text
from ..utils.fitz_loader import fitz, is_fitz_available
from .base import BaseConverter
from typing import Dict, Any
import re

class PdfToTxtConverter(BaseConverter):
    """PDF 到 TXT 转换器（优化版 - 参考 conversion_core）
    
    优化内容：
    1. 添加数学符号清理
    2. 添加多策略降级（pdfminer → PyMuPDF）
    3. 添加进度回调
    4. 更好的文本清理
    """
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['txt']
    
    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        """将 PDF 转换为 TXT（增强版）"""
        try:
            self.validate_input(input_path)
            self.update_progress(input_path, 10)
            
            # 获取总页数（用于页面范围验证）
            total_pages = 0
            if is_fitz_available():
                try:
                    with fitz.open(input_path) as doc:
                        total_pages = doc.page_count
                except Exception as e:
                    print(f"[Warning] Failed to open PDF with fitz to get page count: {e}")
            
            # 解析页面范围
            raw_page_range = options.get('pdf_page_range') or options.get('page_range')
            pages = self.parse_page_range(raw_page_range, total_pages=total_pages)
            
            # 策略1: 使用 pdfminer（推荐）
            try:
                # pdfminer 的 page_numbers 参数接受 0-based 索引列表
                # 如果 pages 为 None，pdfminer 默认处理所有页面，所以不需要特殊处理
                text = extract_text(input_path, page_numbers=pages)
                self.update_progress(input_path, 60)
                method = 'pdfminer'
            except Exception as e1:
                print(f"[pdfminer failed] {e1}, trying PyMuPDF...")
                self.update_progress(input_path, 30)
                
                # 策略2: 使用 PyMuPDF 降级
                if is_fitz_available():
                    try:
                        text = self._extract_with_pymupdf(input_path, pages)
                        self.update_progress(input_path, 60)
                        method = 'pymupdf_fallback'
                    except Exception as e2:
                        raise Exception(f"All extraction methods failed. pdfminer: {e1}, PyMuPDF: {e2}")
                else:
                    raise Exception(f"pdfminer failed: {e1}. PyMuPDF fallback unavailable (DLL load failed).")
            
            # 清理文本（处理数学符号和特殊字符）
            cleaned_text = self._clean_text(text)
            self.update_progress(input_path, 80)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_text)
            
            self.update_progress(input_path, 100)
            
            return {
                'success': True,
                'output_path': output_path,
                'size': self.get_output_size(output_path),
                'method': method
            }
            
        except Exception as e:
            self.cleanup_on_error(output_path)
            raise Exception(f"PDF to TXT conversion failed: {str(e)}")
    
    def _extract_with_pymupdf(self, input_path: str, pages=None) -> str:
        """使用 PyMuPDF 提取文本"""
        if not is_fitz_available():
            raise ImportError("PyMuPDF is not available")
            
        doc = fitz.open(input_path)
        text_content = []
        
        # 确定要处理的页面
        if pages is None:
            pages_to_process = range(len(doc))
        else:
            pages_to_process = pages
        
        for page_num in pages_to_process:
            if page_num < 0 or page_num >= len(doc):
                continue
                
            page = doc[page_num]
            text = page.get_text("text", sort=True)
            if text.strip():
                text_content.append(f"=== Page {page_num + 1} ===\n")
                text_content.append(text)
                text_content.append("\n\n")
        
        doc.close()
        return ''.join(text_content)
    
    def _clean_text(self, text: str) -> str:
        # 简单实现，保留原文件中的其他方法
        if not text:
            return ""
            
        # 1. 统一换行符
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # 2. 清理多余空行 (超过3个换行符缩减为2个)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # 3. 清理数学符号占位符 (示例)
        text = text.replace('\u0000', '')
        
        return text
