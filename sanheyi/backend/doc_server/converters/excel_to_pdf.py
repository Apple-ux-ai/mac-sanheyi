import os
import shutil
from typing import Dict, Any
from .base import BaseConverter

class ExcelToPdfConverter(BaseConverter):
    """Excel 转 PDF 转换器"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['pdf']
        self.soffice_path = self._find_libreoffice()

    def _find_libreoffice(self) -> str:
        """查找 LibreOffice 路径"""
        paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
        for path in paths:
            if os.path.exists(path):
                return path
        return shutil.which("soffice")

    def _convert_with_excel(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """使用 Microsoft Excel 转换"""
        import win32com.client
        import pythoncom
        
        # 初始化 COM
        pythoncom.CoInitialize()
        
        excel = None
        wb = None
        
        try:
            # 转换为绝对路径
            input_path = os.path.abspath(input_path)
            output_path = os.path.abspath(output_path)
            
            # 启动 Excel
            excel = win32com.client.Dispatch("Excel.Application")
            excel.Visible = False
            excel.DisplayAlerts = False
            
            # 打开工作簿
            wb = excel.Workbooks.Open(input_path, ReadOnly=True)
            
            # 导出为 PDF
            # xlTypePDF = 0
            wb.ExportAsFixedFormat(0, output_path)
            
            return {'method': 'microsoft_excel'}
            
        except Exception as e:
            raise e
        finally:
            # 清理资源
            try:
                if wb:
                    wb.Close(SaveChanges=False)
            except:
                pass
            
            try:
                if excel:
                    excel.Quit()
            except:
                pass
            
            # 清理 COM
            try:
                pythoncom.CoUninitialize()
            except:
                pass

    def _convert_with_libreoffice(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """使用 LibreOffice 转换"""
        if not self.soffice_path:
            raise Exception("LibreOffice not found")
            
        import subprocess
        
        output_dir = os.path.dirname(output_path)
        
        # 构建命令
        cmd = [
            self.soffice_path,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', output_dir,
            input_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
        # LibreOffice 会生成同名 PDF，需要检查并重命名（如果需要）
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        generated_pdf = os.path.join(output_dir, f"{base_name}.pdf")
        
        if generated_pdf != output_path and os.path.exists(generated_pdf):
            if os.path.exists(output_path):
                os.remove(output_path)
            os.rename(generated_pdf, output_path)
            
        return {'method': 'libreoffice'}

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        self.validate_input(input_path)
        self.update_progress(input_path, 5)
        
        error_messages = []
        
        # 策略1: Microsoft Excel
        try:
            self.update_progress(input_path, 20)
            result = self._convert_with_excel(input_path, output_path)
            self.update_progress(input_path, 100)
            return {
                'success': True,
                'output_path': output_path,
                'method': result['method']
            }
        except Exception as e:
            error_messages.append(f"Microsoft Excel failed: {str(e)}")
            print(f"[ExcelToPdf] Excel conversion failed: {e}")
        
        # 策略2: LibreOffice
        try:
            self.update_progress(input_path, 50)
            result = self._convert_with_libreoffice(input_path, output_path)
            self.update_progress(input_path, 100)
            return {
                'success': True,
                'output_path': output_path,
                'method': result['method']
            }
        except Exception as e:
            error_messages.append(f"LibreOffice failed: {str(e)}")
            print(f"[ExcelToPdf] LibreOffice conversion failed: {e}")
            
        # 所有策略都失败
        return {
            'success': False,
            'error': "All conversion strategies failed.\n" + "\n".join(error_messages)
        }
