from typing import Dict, Any, Union, List
import os
import uuid
from pathlib import Path
from backend.img_server.converters.png_to_jpg import PNGToJPGConverter
from backend.img_server.converters.png_to_webp import PNGToWEBPConverter
from backend.img_server.converters.png_to_bmp import PNGToBMPConverter
from backend.img_server.converters.png_to_gif import PNGToGIFConverter
from backend.img_server.converters.png_to_ico import PNGToICOConverter
from backend.img_server.converters.png_to_tiff import PNGToTIFFConverter
from backend.img_server.converters.png_to_bitmap import PNGToBITMAPConverter
from backend.img_server.converters.png_to_base64 import PNGToBase64Converter
from backend.img_server.converters.png_to_txt import PNGToTXTConverter
from backend.img_server.converters.png_to_csv import PNGToCSVConverter
from backend.img_server.converters.png_to_json import PNGToJSONConverter
from backend.img_server.converters.png_to_xml import PNGToXMLConverter
from backend.img_server.converters.png_to_avif import PNGToAVIFConverter
from backend.img_server.converters.png_to_pdf import PNGToPDFConverter
from backend.img_server.converters.jpg_to_png import JPGToPNGConverter
from backend.img_server.converters.jpg_to_bmp import JPGToBMPConverter
from backend.img_server.converters.jpg_to_gif import JPGToGIFConverter
from backend.img_server.converters.jpg_to_webp import JPGToWEBPConverter
from backend.img_server.converters.jpg_to_tiff import JPGToTIFFConverter
from backend.img_server.converters.jpg_to_ico import JPGToICOConverter
from backend.img_server.converters.jpg_to_bitmap import JPGToBITMAPConverter
from backend.img_server.converters.jpg_to_base64 import JPGToBase64Converter
from backend.img_server.converters.jpg_to_txt import JPGToTXTConverter
from backend.img_server.converters.jpg_to_csv import JPGToCSVConverter
from backend.img_server.converters.jpg_to_json import JPGToJSONConverter
from backend.img_server.converters.jpg_to_xml import JPGToXMLConverter
from backend.img_server.converters.jpg_to_avif import JPGToAVIFConverter
from backend.img_server.converters.jpg_to_pdf import JPGToPDFConverter
from backend.img_server.converters.tiff_to_png import TIFFToPNGConverter
from backend.img_server.converters.tiff_to_jpg import TIFFToJPGConverter
from backend.img_server.converters.tiff_to_gif import TIFFToGIFConverter
from backend.img_server.converters.tiff_to_bmp import TIFFToBMPConverter
from backend.img_server.converters.tiff_to_webp import TIFFToWEBPConverter
from backend.img_server.converters.tiff_to_bitmap import TIFFToBITMAPConverter
from backend.img_server.converters.tiff_to_ico import TIFFToICOConverter
from backend.img_server.converters.tiff_to_pdf import TIFFToPDFConverter
from backend.img_server.converters.svg_to_base64 import SVGToBase64Converter
from backend.img_server.converters.svg_to_html import SVGToHTMLConverter
from backend.img_server.converters.svg_to_zip import SVGToZIPConverter
from backend.img_server.converters.svg_to_png import SVGToPNGConverter
from backend.img_server.converters.svg_to_jpg import SVGToJPGConverter
from backend.img_server.converters.svg_to_pdf import SVGToPDFConverter
from backend.img_server.converters.svg_to_webp import SVGToWEBPConverter
from backend.img_server.converters.svg_to_avif import SVGToAVIFConverter
from backend.img_server.converters.svg_to_gif import SVGToGIFConverter
from backend.img_server.converters.svg_to_bmp import SVGToBMPConverter
from backend.img_server.converters.svg_to_bitmap import SVGToBITMAPConverter
from backend.img_server.converters.svg_to_ico import SVGToICOConverter
from backend.img_server.converters.png_to_html import PNGToHTMLConverter
from backend.img_server.converters.jpg_to_html import JPGToHTMLConverter
from backend.img_server.converters.jpg_to_zip import JPGToZIPConverter
from backend.img_server.converters.jpg_to_ppt import JPGToPPTConverter
from backend.img_server.converters.jpg_to_docx import JPGToDOCXConverter
from backend.img_server.converters.jpg_to_doc import JPGToDOCConverter
from backend.img_server.converters.jpg_to_xls import JPGToXLSConverter
from backend.img_server.converters.png_to_ppt import PNGToPPTConverter
from backend.img_server.converters.png_to_docx import PNGToDOCXConverter
from backend.img_server.converters.png_to_doc import PNGToDOCConverter
from backend.img_server.converters.png_to_epub import PNGToEPUBConverter
from backend.img_server.converters.png_to_odf import PNGToODFConverter
from backend.img_server.converters.jpg_to_svg import JPGToSVGConverter
from backend.img_server.converters.png_to_svg import PNGToSVGConverter
from backend.img_server.converters.tiff_to_svg import TIFFToSVGConverter
from backend.img_server.converters.jpg_to_psd import JPGToPSDConverter
from backend.img_server.converters.png_to_psd import PNGToPSDConverter
from backend.img_server.config import DOWNLOAD_DIR

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
    
    def convert_png(self, input_path: Union[str, List[str]], target_format: str, output_dir: str = None, **options) -> Dict[str, Any]:
        """
        转换PNG文件
        
        Args:
            input_path: 输入PNG文件路径或路径列表（多图合成GIF）
            target_format: 目标格式（jpg/webp/bmp/gif/ico/tiff/bitmap/base64/html/pdf/avif/txt/csv/json/xml/ppt/docx/doc/epub/odf/svg/psd）
            output_dir: 输出目录（可选，默认为DOWNLOAD_DIR）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.png_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成输出路径
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        
        if output_dir:
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            output_path = os.path.join(output_dir, output_filename)
        else:
            output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.png_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}" if not output_dir else output_path,
            'filename': output_filename,
            'size': result['size'],
            'output_path': output_path
        }
    
    def convert_jpg(self, input_path: Union[str, List[str]], target_format: str, output_dir: str = None, **options) -> Dict[str, Any]:
        """
        转换JPG文件
        
        Args:
            input_path: 输入JPG文件路径或路径列表（多图合成GIF）
            target_format: 目标格式（png/bmp/gif/webp/tiff/ico/base64/html/pdf/avif/zip/txt/csv/json/xml/ppt/docx/doc/xls/svg/psd）
            output_dir: 输出目录（可选，默认为DOWNLOAD_DIR）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.jpg_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成输出路径
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        
        if output_dir:
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            output_path = os.path.join(output_dir, output_filename)
        else:
            output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.jpg_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}" if not output_dir else output_path,
            'filename': output_filename,
            'size': result['size'],
            'output_path': output_path
        }
    
    def get_supported_formats(self) -> list:
        """获取PNG支持的格式列表"""
        return list(self.png_converters.keys())
    
    def get_jpg_supported_formats(self) -> list:
        """获取JPG支持的格式列表"""
        return list(self.jpg_converters.keys())
    
    def convert_tiff(self, input_path: Union[str, List[str]], target_format: str, output_dir: str = None, **options) -> Dict[str, Any]:
        """
        转换TIFF文件
        
        Args:
            input_path: 输入TIFF文件路径或路径列表（多图合成GIF/PDF）
            target_format: 目标格式（png/jpg/gif/bmp/webp/svg）
            output_dir: 输出目录（可选，默认为DOWNLOAD_DIR）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.tiff_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成输出路径
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        
        if output_dir:
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            output_path = os.path.join(output_dir, output_filename)
        else:
            output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.tiff_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}" if not output_dir else output_path,
            'filename': output_filename,
            'size': result['size'],
            'output_path': output_path
        }
    
    def get_tiff_supported_formats(self) -> list:
        """获取TIFF支持的格式列表"""
        return list(self.tiff_converters.keys())
    
    def convert_svg(self, input_path: Union[str, List[str]], target_format: str, output_dir: str = None, **options) -> Dict[str, Any]:
        """
        转换SVG文件
        
        Args:
            input_path: 输入SVG文件路径
            target_format: 目标格式（base64/html/zip/png/jpg/pdf/webp/avif/gif/bmp/bitmap/ico）
            output_dir: 输出目录（可选，默认为DOWNLOAD_DIR）
            **options: 转换选项
            
        Returns:
            转换结果字典
        """
        target_format = target_format.lower()
        
        if target_format not in self.svg_converters:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        # 生成输出路径
        unique_id = str(uuid.uuid4())
        file_extension = self.format_to_extension.get(target_format, target_format)
        output_filename = f"{unique_id}.{file_extension}"
        
        if output_dir:
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            output_path = os.path.join(output_dir, output_filename)
        else:
            output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # 执行转换
        converter = self.svg_converters[target_format]
        result = converter.convert(input_path, output_path, **options)
        
        # 构造返回结果
        return {
            'success': True,
            'file_url': f"/downloads/{output_filename}" if not output_dir else output_path,
            'filename': output_filename,
            'size': result['size'],
            'output_path': output_path
        }
    
    def get_svg_supported_formats(self) -> list:
        """获取SVG支持的格式列表"""
        return list(self.svg_converters.keys())
