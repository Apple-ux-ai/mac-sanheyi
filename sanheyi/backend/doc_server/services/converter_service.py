import os
import uuid
from typing import Dict, Any, List
from backend.doc_server.converters.json_to_yaml import JsonToYamlConverter
from backend.doc_server.converters.json_to_xml import JsonToXmlConverter
from backend.doc_server.converters.xml_to_json import XmlToJsonConverter
from backend.doc_server.converters.xml_to_yaml import XmlToYamlConverter
from backend.doc_server.converters.docx_to_txt import DocxToTxtConverter
from backend.doc_server.converters.docx_to_pdf import DocxToPdfConverter
from backend.doc_server.converters.docx_to_image import DocxToImageConverter
from backend.doc_server.converters.docx_to_epub import DocxToEpubConverter
from backend.doc_server.converters.html_to_pdf import HtmlToPdfConverter
from backend.doc_server.converters.html_to_txt import HtmlToTxtConverter
from backend.doc_server.converters.html_to_markdown import HtmlToMarkdownConverter
from backend.doc_server.converters.html_to_image import HtmlToImageConverter
from backend.doc_server.converters.html_to_docx import HtmlToDocxConverter
from backend.doc_server.converters.html_to_json import HtmlToJsonConverter
from backend.doc_server.converters.html_to_gif import HtmlToGifConverter
from backend.doc_server.converters.html_to_svg import HtmlToSvgConverter
from backend.doc_server.converters.pdf_to_txt import PdfToTxtConverter
from backend.doc_server.converters.pdf_to_json import PdfToJsonConverter
from backend.doc_server.converters.pdf_to_base64 import PdfToBase64Converter
from backend.doc_server.converters.pdf_to_md import PdfToMdConverter
from backend.doc_server.converters.pdf_to_svg import PdfToSvgConverter
from backend.doc_server.converters.pdf_to_epub import PdfToEpubConverter
from backend.doc_server.converters.pdf_to_gif import PdfToGifConverter
from backend.doc_server.converters.pdf_to_webp import PdfToWebpConverter
from backend.doc_server.converters.txt_to_pdf import TxtToPdfConverter
from backend.doc_server.converters.txt_to_image import TxtToImageConverter
from backend.doc_server.converters.txt_to_speech import TxtToSpeechConverter
from backend.doc_server.converters.txt_to_ascii import TxtToAsciiConverter
from backend.doc_server.converters.txt_to_binary import TxtToBinaryConverter
from backend.doc_server.converters.txt_to_csv import TxtToCsvConverter
from backend.doc_server.converters.txt_to_hex import TxtToHexConverter
from backend.doc_server.converters.pdf_to_docx import PdfToDocxConverter
from backend.doc_server.converters.json_to_csv import JsonToCsvConverter
from backend.doc_server.converters.json_to_pdf import JsonToPdfConverter
from backend.doc_server.converters.json_to_base64 import JsonToBase64Converter
from backend.doc_server.converters.xml_to_csv import XmlToCsvConverter
from backend.doc_server.converters.xml_to_txt import XmlToTxtConverter
from backend.doc_server.converters.xml_to_pdf import XmlToPdfConverter
from backend.doc_server.converters.xml_to_xlsx import XmlToXlsxConverter
from backend.doc_server.converters.txt_to_html import TxtToHtmlConverter
from backend.doc_server.converters.pdf_to_html import PdfToHtmlConverter
from backend.doc_server.converters.pdf_to_image import PdfToImageConverter
from backend.doc_server.converters.pdf_to_ppt import PdfToPptConverter
from backend.doc_server.converters.pdf_to_excel import PdfToExcelConverter
from backend.doc_server.converters.excel_to_ppt import ExcelToPptConverter
from backend.doc_server.converters.ppt_to_excel import PptToExcelConverter
from backend.doc_server.converters.json_to_html import JsonToHtmlConverter
from backend.doc_server.converters.xml_to_html import XmlToHtmlConverter
from backend.doc_server.converters.json_to_image import JsonToImageConverter
from backend.doc_server.converters.json_to_svg import JsonToSvgConverter
from backend.doc_server.converters.xml_to_image import XmlToImageConverter
from backend.doc_server.converters.xml_to_svg import XmlToSvgConverter
from backend.doc_server.converters.pdf_to_rtf import PdfToRtfConverter
from backend.doc_server.converters.excel_to_pdf import ExcelToPdfConverter
from backend.doc_server.converters.ppt_to_pdf import PptToPdfConverter
from backend.doc_server.converters.excel_to_image import ExcelToImageConverter
from backend.doc_server.converters.ppt_to_image import PptToImageConverter
from backend.doc_server.converters.ppt_to_video import PptToVideoConverter
# from backend.doc_server.converters.pdf_to_psd import PdfToPsdConverter  # 已移除：缺少psd_tools依赖

# 配置常量（后续可移至 config.py）
import sys
import tempfile

# 无论开发还是打包环境，统一使用系统临时目录，避免在项目目录或桌面产生残留文件
base_dir = os.path.join(tempfile.gettempdir(), 'doc-converter')
UPLOAD_DIR = os.path.join(base_dir, 'uploads')
DOWNLOAD_DIR = os.path.join(base_dir, 'downloads')

# 确保目录存在
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

class ConverterService:
    """转换服务编排层"""
    
    def __init__(self):
        # 注册所有转换器
        # key: (source_format, target_format)
        self.converters = {
            # JSON 转换
            ('json', 'yaml'): JsonToYamlConverter(),
            ('json', 'yml'): JsonToYamlConverter(),
            ('json', 'xml'): JsonToXmlConverter(),
            ('json', 'csv'): JsonToCsvConverter(),
            ('json', 'html'): JsonToHtmlConverter(),
            ('json', 'pdf'): JsonToPdfConverter(),
            ('json', 'base64'): JsonToBase64Converter(),
            ('json', 'png'): JsonToImageConverter(),
            ('json', 'jpg'): JsonToImageConverter(),
            ('json', 'jpeg'): JsonToImageConverter(),
            ('json', 'svg'): JsonToSvgConverter(),
            # XML 转换
            ('xml', 'json'): XmlToJsonConverter(),
            ('xml', 'yaml'): XmlToYamlConverter(),
            ('xml', 'yml'): XmlToYamlConverter(),
            ('xml', 'csv'): XmlToCsvConverter(),
            ('xml', 'html'): XmlToHtmlConverter(),
            ('xml', 'txt'): XmlToTxtConverter(),
            ('xml', 'pdf'): XmlToPdfConverter(),
            ('xml', 'xlsx'): XmlToXlsxConverter(),
            ('xml', 'png'): XmlToImageConverter(),
            ('xml', 'jpg'): XmlToImageConverter(),
            ('xml', 'jpeg'): XmlToImageConverter(),
            ('xml', 'svg'): XmlToSvgConverter(),
            # DOCX 转换
            ('docx', 'txt'): DocxToTxtConverter(),
            ('docx', 'pdf'): DocxToPdfConverter(),
            ('docx', 'png'): DocxToImageConverter(),
            ('docx', 'jpg'): DocxToImageConverter(),
            ('docx', 'jpeg'): DocxToImageConverter(),
            ('docx', 'epub'): DocxToEpubConverter(),
            # HTML 转换
            ('html', 'pdf'): HtmlToPdfConverter(),
            ('html', 'txt'): HtmlToTxtConverter(),
            ('html', 'text'): HtmlToTxtConverter(),
            ('html', 'md'): HtmlToMarkdownConverter(),
            ('html', 'markdown'): HtmlToMarkdownConverter(),
            ('html', 'png'): HtmlToImageConverter(),
            ('html', 'jpg'): HtmlToImageConverter(),
            ('html', 'jpeg'): HtmlToImageConverter(),
            ('html', 'docx'): HtmlToDocxConverter(),
            ('html', 'doc'): HtmlToDocxConverter(),
            ('html', 'json'): HtmlToJsonConverter(),
            ('html', 'gif'): HtmlToGifConverter(),
            ('html', 'svg'): HtmlToSvgConverter(),
            # PDF 转换
            ('pdf', 'txt'): PdfToTxtConverter(),
            ('pdf', 'docx'): PdfToDocxConverter(),
            ('pdf', 'doc'): PdfToDocxConverter(),
            ('pdf', 'html'): PdfToHtmlConverter(),
            ('pdf', 'png'): PdfToImageConverter(),
            ('pdf', 'jpg'): PdfToImageConverter(),
            ('pdf', 'jpeg'): PdfToImageConverter(),
            ('pdf', 'bmp'): PdfToImageConverter(),
            ('pdf', 'tiff'): PdfToImageConverter(),
            ('pdf', 'json'): PdfToJsonConverter(),
            ('pdf', 'base64'): PdfToBase64Converter(),
            ('pdf', 'md'): PdfToMdConverter(),
            ('pdf', 'svg'): PdfToSvgConverter(),
            ('pdf', 'epub'): PdfToEpubConverter(),
            ('pdf', 'gif'): PdfToGifConverter(),
            ('pdf', 'webp'): PdfToWebpConverter(),
            ('pdf', 'pptx'): PdfToPptConverter(),
            ('pdf', 'ppt'): PdfToPptConverter(),
            ('pdf', 'xlsx'): PdfToExcelConverter(),
            ('pdf', 'xls'): PdfToExcelConverter(),
            ('pdf', 'excel'): PdfToExcelConverter(),
            ('pdf', 'rtf'): PdfToRtfConverter(),
            # PPT/Excel 互转
            ('xlsx', 'pptx'): ExcelToPptConverter(),
            ('xls', 'pptx'): ExcelToPptConverter(),
            ('xlsx', 'ppt'): ExcelToPptConverter(),
            ('xls', 'ppt'): ExcelToPptConverter(),
            # ('pptx', 'xlsx'): PptToExcelConverter(),  # 已移除：用户不需要
            # ('ppt', 'xlsx'): PptToExcelConverter(),   # 已移除：用户不需要
            # ('pptx', 'xls'): PptToExcelConverter(),   # 已移除：用户不需要
            # ('ppt', 'xls'): PptToExcelConverter(),    # 已移除：用户不需要
            # ('pptx', 'excel'): PptToExcelConverter(), # 已移除：用户不需要
            # ('ppt', 'excel'): PptToExcelConverter(),  # 已移除：用户不需要
            # Excel/PPT 更多转换
            ('xlsx', 'pdf'): ExcelToPdfConverter(),
            ('xls', 'pdf'): ExcelToPdfConverter(),
            ('excel', 'pdf'): ExcelToPdfConverter(),
            ('pptx', 'pdf'): PptToPdfConverter(),
            ('ppt', 'pdf'): PptToPdfConverter(),
            ('xlsx', 'png'): ExcelToImageConverter(),
            ('xlsx', 'jpg'): ExcelToImageConverter(),
            ('xlsx', 'jpeg'): ExcelToImageConverter(),
            ('xls', 'png'): ExcelToImageConverter(),
            ('xls', 'jpg'): ExcelToImageConverter(),
            ('xls', 'jpeg'): ExcelToImageConverter(),
            ('excel', 'png'): ExcelToImageConverter(),
            ('excel', 'jpg'): ExcelToImageConverter(),
            ('pptx', 'png'): PptToImageConverter(),
            ('pptx', 'jpg'): PptToImageConverter(),
            ('pptx', 'jpeg'): PptToImageConverter(),
            ('ppt', 'png'): PptToImageConverter(),
            ('ppt', 'jpg'): PptToImageConverter(),
            ('ppt', 'jpeg'): PptToImageConverter(),
            ('pptx', 'mp4'): PptToVideoConverter(),
            ('pptx', 'avi'): PptToVideoConverter(),
            ('ppt', 'mp4'): PptToVideoConverter(),
            ('ppt', 'avi'): PptToVideoConverter(),
            # ('pdf', 'psd'): PdfToPsdConverter(),  # 已移除：缺少psd_tools依赖
            # TXT 转换
            ('txt', 'pdf'): TxtToPdfConverter(),
            ('txt', 'html'): TxtToHtmlConverter(),
            ('txt', 'png'): TxtToImageConverter(),
            ('txt', 'jpg'): TxtToImageConverter(),
            ('txt', 'jpeg'): TxtToImageConverter(),
            ('txt', 'mp3'): TxtToSpeechConverter(),
            ('txt', 'wav'): TxtToSpeechConverter(),
            ('txt', 'ascii'): TxtToAsciiConverter(),
            ('txt', 'binary'): TxtToBinaryConverter(),
            ('txt', 'bin'): TxtToBinaryConverter(),
            ('txt', 'csv'): TxtToCsvConverter(),
            ('txt', 'hex'): TxtToHexConverter(),
        }
    
    def convert_file(self, input_path: str, target_format: str, original_filename: str = None, output_dir: str = None, **options) -> Dict[str, Any]:
        """
        统一转换入口
        """
        source_format = input_path.split('.')[-1].lower()
        target_format = target_format.lower()
        
        converter_key = (source_format, target_format)
        if converter_key not in self.converters:
            raise ValueError(f"Unsupported conversion: {source_format} to {target_format}")
        
        # 确定目标目录
        target_dir = output_dir if output_dir else DOWNLOAD_DIR
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        # 生成输出路径，使用优化的文件名策略
        if original_filename:
            # 移除原始扩展名，保留文件名
            base_name = os.path.splitext(original_filename)[0]
            display_name = f"{base_name}.{target_format}"
            
            # 生成短哈希（6位）确保唯一性
            short_hash = str(uuid.uuid4())[:8]
            storage_filename = f"{base_name}_{short_hash}.{target_format}"
            output_path = os.path.join(target_dir, storage_filename)
            
            # 如果文件已存在（极小概率），添加数字后缀
            counter = 1
            while os.path.exists(output_path):
                storage_filename = f"{base_name}_{short_hash}_{counter}.{target_format}"
                output_path = os.path.join(target_dir, storage_filename)
                counter += 1
        else:
            unique_id = str(uuid.uuid4())
            display_name = f"converted.{target_format}"
            storage_filename = f"{unique_id}.{target_format}"
            output_path = os.path.join(target_dir, storage_filename)
        
        # 调用具体转换器
        converter = self.converters[converter_key]
        result = converter.convert(input_path, output_path, **options)
        
        # 检查实际输出文件（可能是 ZIP）
        actual_output_path = result.get('output_path', output_path)
        actual_storage_filename = os.path.basename(actual_output_path)
        
        # 如果是 ZIP 文件，也需要处理显示名称
        if actual_storage_filename.endswith('.zip'):
            # 提取原始基础名，移除哈希部分
            if original_filename:
                actual_display_name = f"{base_name}.zip"
            else:
                actual_display_name = "converted.zip"
        else:
            actual_display_name = display_name
        
        # 补充返回信息
        print(f"[ConverterService] Expected output: {output_path}")
        print(f"[ConverterService] Actual output: {actual_output_path}")
        print(f"[ConverterService] Storage filename: {actual_storage_filename}")
        print(f"[ConverterService] Display filename: {actual_display_name}")
        print(f"[ConverterService] File exists: {os.path.exists(actual_output_path)}")
        
        result.update({
            'filename': actual_storage_filename,  # 后端存储的实际文件名
            'display_name': actual_display_name,  # 用户看到的文件名
            'output_path': actual_output_path,    # 绝对路径，用于 Electron IPC 复制
            'download_url': f"/downloads/{actual_storage_filename}" if not output_dir else actual_output_path
        })
        
        return result

    def get_supported_conversions(self) -> List[Dict[str, str]]:
        """获取支持的转换列表"""
        return [
            {'source': src, 'target': tgt} 
            for src, tgt in self.converters.keys()
        ]
