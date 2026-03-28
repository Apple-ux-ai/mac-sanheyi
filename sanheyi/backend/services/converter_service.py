from typing import Dict, Any, Union, List
import os
import uuid
from pathlib import Path
from converters.png_to_jpg import PNGToJPGConverter
from converters.png_to_webp import PNGToWEBPConverter
from converters.png_to_bmp import PNGToBMPConverter
from converters.png_to_gif import PNGToGIFConverter
from converters.png_to_ico import PNGToICOConverter
from converters.png_to_tiff import PNGToTIFFConverter
from converters.png_to_bitmap import PNGToBITMAPConverter
from converters.png_to_base64 import PNGToBase64Converter
from converters.png_to_txt import PNGToTXTConverter
from converters.png_to_csv import PNGToCSVConverter
from converters.png_to_json import PNGToJSONConverter
from converters.png_to_xml import PNGToXMLConverter
from converters.png_to_avif import PNGToAVIFConverter
from converters.png_to_pdf import PNGToPDFConverter
from converters.jpg_to_png import JPGToPNGConverter
from converters.jpg_to_bmp import JPGToBMPConverter
from converters.jpg_to_gif import JPGToGIFConverter
from converters.jpg_to_webp import JPGToWEBPConverter
from converters.jpg_to_tiff import JPGToTIFFConverter
from converters.jpg_to_ico import JPGToICOConverter
from converters.jpg_to_bitmap import JPGToBITMAPConverter
from converters.jpg_to_base64 import JPGToBase64Converter
from converters.jpg_to_txt import JPGToTXTConverter
from converters.jpg_to_csv import JPGToCSVConverter
from converters.jpg_to_json import JPGToJSONConverter
from converters.jpg_to_xml import JPGToXMLConverter
from converters.jpg_to_avif import JPGToAVIFConverter
from converters.jpg_to_pdf import JPGToPDFConverter
from converters.tiff_to_png import TIFFToPNGConverter
from converters.tiff_to_jpg import TIFFToJPGConverter
from converters.tiff_to_gif import TIFFToGIFConverter
from converters.tiff_to_bmp import TIFFToBMPConverter
from converters.tiff_to_webp import TIFFToWEBPConverter
from converters.tiff_to_bitmap import TIFFToBITMAPConverter
from converters.tiff_to_ico import TIFFToICOConverter
from converters.tiff_to_pdf import TIFFToPDFConverter
from converters.svg_to_base64 import SVGToBase64Converter
from converters.svg_to_html import SVGToHTMLConverter
from converters.svg_to_zip import SVGToZIPConverter
from converters.svg_to_png import SVGToPNGConverter
from converters.svg_to_jpg import SVGToJPGConverter
from converters.svg_to_pdf import SVGToPDFConverter
from converters.svg_to_webp import SVGToWEBPConverter
from converters.svg_to_avif import SVGToAVIFConverter
from converters.svg_to_gif import SVGToGIFConverter
from converters.svg_to_bmp import SVGToBMPConverter
from converters.svg_to_bitmap import SVGToBITMAPConverter
from converters.svg_to_ico import SVGToICOConverter
from converters.png_to_html import PNGToHTMLConverter
from converters.jpg_to_html import JPGToHTMLConverter
from converters.jpg_to_zip import JPGToZIPConverter
from converters.jpg_to_ppt import JPGToPPTConverter
from converters.jpg_to_docx import JPGToDOCXConverter
from converters.jpg_to_doc import JPGToDOCConverter
from converters.jpg_to_xls import JPGToXLSConverter
from converters.png_to_ppt import PNGToPPTConverter
from converters.png_to_docx import PNGToDOCXConverter
from converters.png_to_doc import PNGToDOCConverter
from converters.png_to_epub import PNGToEPUBConverter
from converters.png_to_odf import PNGToODFConverter
from converters.jpg_to_svg import JPGToSVGConverter
from converters.png_to_svg import PNGToSVGConverter
from converters.tiff_to_svg import TIFFToSVGConverter
from converters.jpg_to_psd import JPGToPSDConverter
from converters.png_to_psd import PNGToPSDConverter
from config import DOWNLOAD_DIR

class ConverterService:
    """转换服务编排层"""
    
    def __init__(self):
        # 格式到文件扩展名的映射
        self.format_to_extension = {
            'bitmap': 'bmp',
            'tiff': 'tiff',
            'tif': 'tif',
            'jpeg': 'jpg',
            'base64': 'txt',
            'txt': 'txt',
            'csv': 'csv',
            'json': 'json',
            'xml': 'xml',
            'avif': 'avif',
            'html': 'html',
            'zip': 'zip',
            'ppt': 'pptx',
            'docx': 'docx',
            'doc': 'doc',
            'xls': 'xlsx',
            'epub': 'epub',
            'odf': 'odt',
            'svg': 'svg',
            'psd': 'psd'
        }
        
        self.png_converters = {
            'jpg': PNGToJPGConverter(),
            'jpeg': PNGToJPGConverter(),
            'webp': PNGToWEBPConverter(),
            'bmp': PNGToBMPConverter(),
            'gif': PNGToGIFConverter(),
            'ico': PNGToICOConverter(),
            'tiff': PNGToTIFFConverter(),
            'tif': PNGToTIFFConverter(),
            'bitmap': PNGToBITMAPConverter(),
            'base64': PNGToBase64Converter(),
            'txt': PNGToTXTConverter(),
            'csv': PNGToCSVConverter(),
            'json': PNGToJSONConverter(),
            'xml': PNGToXMLConverter(),
            'avif': PNGToAVIFConverter(),
            'pdf': PNGToPDFConverter(),
            'html': PNGToHTMLConverter(),
            'ppt': PNGToPPTConverter(),
            'docx': PNGToDOCXConverter(),
            'doc': PNGToDOCConverter(),
            'epub': PNGToEPUBConverter(),
            'odf': PNGToODFConverter(),
            'svg': PNGToSVGConverter(),
            'psd': PNGToPSDConverter()
        }
        
        self.jpg_converters = {
            'png': JPGToPNGConverter(),
            'bmp': JPGToBMPConverter(),
            'bitmap': JPGToBITMAPConverter(),
            'gif': JPGToGIFConverter(),
            'webp': JPGToWEBPConverter(),
            'tiff': JPGToTIFFConverter(),
            'tif': JPGToTIFFConverter(),
            'ico': JPGToICOConverter(),
            'base64': JPGToBase64Converter(),
            'txt': JPGToTXTConverter(),
            'csv': JPGToCSVConverter(),
            'json': JPGToJSONConverter(),
            'xml': JPGToXMLConverter(),
            'avif': JPGToAVIFConverter(),
            'pdf': JPGToPDFConverter(),
            'html': JPGToHTMLConverter(),
            'zip': JPGToZIPConverter(),
            'ppt': JPGToPPTConverter(),
            'docx': JPGToDOCXConverter(),
            'doc': JPGToDOCConverter(),
            'xls': JPGToXLSConverter(),
            'svg': JPGToSVGConverter(),
            'psd': JPGToPSDConverter()
        }
        
        self.tiff_converters = {
            'png': TIFFToPNGConverter(),
            'jpg': TIFFToJPGConverter(),
            'jpeg': TIFFToJPGConverter(),
            'gif': TIFFToGIFConverter(),
            'bmp': TIFFToBMPConverter(),
            'webp': TIFFToWEBPConverter(),
            'bitmap': TIFFToBITMAPConverter(),
            'ico': TIFFToICOConverter(),
            'pdf': TIFFToPDFConverter(),
            'svg': TIFFToSVGConverter()
        }
        
        self.svg_converters = {
            'base64': SVGToBase64Converter(),
            'html': SVGToHTMLConverter(),
            'zip': SVGToZIPConverter(),
            'png': SVGToPNGConverter(),
            'jpg': SVGToJPGConverter(),
            'jpeg': SVGToJPGConverter(),
            'pdf': SVGToPDFConverter(),
            'webp': SVGToWEBPConverter(),
            'avif': SVGToAVIFConverter(),
            'gif': SVGToGIFConverter(),
            'bmp': SVGToBMPConverter(),
            'bitmap': SVGToBITMAPConverter(),
            'ico': SVGToICOConverter()
        }
        
        # 保持向后兼容
        self.converters = self.png_converters
    
    def convert_png(self, input_path: Union[str, List[str]], target_format: str, **options) -> Dict[str, Any]:
        """
        转换PNG文件
        
        Args:
            input_path: 输入PNG文件路径或路径列表（多图合成GIF）
            target_format: 目标格式（jpg/webp/bmp/gif/ico/tiff/bitmap/base64/html/pdf/avif/txt/csv/json/xml/ppt/docx/doc/epub/odf/svg/psd）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.png_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成唯一的输出文件名
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.png_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}",
            'filename': output_filename,
            'size': result['size']
        }
    
    def convert_jpg(self, input_path: Union[str, List[str]], target_format: str, **options) -> Dict[str, Any]:
        """
        转换JPG文件
        
        Args:
            input_path: 输入JPG文件路径或路径列表（多图合成GIF）
            target_format: 目标格式（png/bmp/gif/webp/tiff/ico/base64/html/pdf/avif/zip/txt/csv/json/xml/ppt/docx/doc/xls/svg/psd）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.jpg_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成唯一的输出文件名
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.jpg_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}",
            'filename': output_filename,
            'size': result['size']
        }
    
    def get_supported_formats(self) -> list:
        """获取PNG支持的格式列表"""
        return list(self.png_converters.keys())
    
    def get_jpg_supported_formats(self) -> list:
        """获取JPG支持的格式列表"""
        return list(self.jpg_converters.keys())
    
    def convert_tiff(self, input_path: Union[str, List[str]], target_format: str, **options) -> Dict[str, Any]:
        """
        转换TIFF文件
        
        Args:
            input_path: 输入TIFF文件路径或路径列表（多图合成GIF/PDF）
            target_format: 目标格式（png/jpg/gif/bmp/webp/svg）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.tiff_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成唯一的输出文件名
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.tiff_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}",
            'filename': output_filename,
            'size': result['size']
        }
    
    def get_tiff_supported_formats(self) -> list:
        """获取TIFF支持的格式列表"""
        return list(self.tiff_converters.keys())
    
    def convert_svg(self, input_path: Union[str, List[str]], target_format: str, **options) -> Dict[str, Any]:
        """
        转换SVG文件
        
        Args:
            input_path: 输入SVG文件路径
            target_format: 目标格式（base64/html/zip/png/jpg/pdf/webp/avif/gif/bmp/bitmap/ico）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.svg_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成唯一的输出文件名
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.svg_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}",
            'filename': output_filename,
            'size': result['size']
        }
    
    def get_svg_supported_formats(self) -> list:
        """获取SVG支持的格式列表"""
        return list(self.svg_converters.keys())
