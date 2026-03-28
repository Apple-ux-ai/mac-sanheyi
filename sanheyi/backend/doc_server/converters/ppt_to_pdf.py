import os
import sys
import platform
import subprocess
from typing import Dict, Any, Optional
from .base import BaseConverter

class PptToPdfConverter(BaseConverter):
    """PPT 转 PDF 转换器 (Microsoft PowerPoint / LibreOffice)"""
    
    def __init__(self):
        super().__init__()
        self.supported_formats = ['pdf']
        self.soffice_path = self._find_libreoffice()

    def _find_libreoffice(self) -> Optional[str]:
        """查找 LibreOffice 可执行文件路径"""
        if platform.system() == 'Windows':
            paths = [
                r"C:\Program Files\LibreOffice\program\soffice.exe",
                r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            ]
            for p in paths:
                if os.path.exists(p):
                    return p
        # Linux/Mac 路径通常在 PATH 中
        return "soffice"

    def _convert_with_powerpoint(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """使用 Microsoft PowerPoint COM 接口转换"""
        if platform.system() != 'Windows':
            raise NotImplementedError("Microsoft PowerPoint conversion is only available on Windows")

        import win32com.client
        import pythoncom

        # 初始化 COM 库
        pythoncom.CoInitialize()
        powerpoint = None
        presentation = None
        
        try:
            # 启动 PowerPoint
            try:
                powerpoint = win32com.client.GetActiveObject("PowerPoint.Application")
            except:
                powerpoint = win32com.client.Dispatch("PowerPoint.Application")
            
            # PowerPoint 必须可见才能工作 (有些版本限制)
            # 但我们可以尝试最小化
            # powerpoint.Visible = True 
            
            # 打开演示文稿
            # WithWindow=False 避免显示窗口
            presentation = powerpoint.Presentations.Open(input_path, WithWindow=False)
            
            # 导出为 PDF
            # 32 = ppSaveAsPDF
            presentation.SaveAs(output_path, 32)
            
            return {'method': 'microsoft_powerpoint'}
            
        except Exception as e:
            raise Exception(f"PowerPoint COM error: {str(e)}")
        finally:
            if presentation:
                try:
                    presentation.Close()
                except:
                    pass
            if powerpoint:
                try:
                    # 如果我们启动了它，也许应该关闭它？
                    # 但为了性能通常保留实例。这里简单起见不强制 Quit，除非是专门为转换启动的进程
                    # 为了稳定性，这里选择 Quit，避免残留进程
                    powerpoint.Quit()
                except:
                    pass
            pythoncom.CoUninitialize()

    def _convert_with_libreoffice(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """使用 LibreOffice 命令行转换"""
        if not self.soffice_path:
            raise Exception("LibreOffice not found")
            
        # LibreOffice convert-to 命令
        # soffice --headless --convert-to pdf --outdir <dir> <file>
        output_dir = os.path.dirname(output_path)
        
        cmd = [
            self.soffice_path,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', output_dir,
            input_path
        ]
        
        # 执行命令
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
        # LibreOffice 默认输出文件名与输入相同，只是扩展名不同
        # 如果 output_path 文件名不同，需要重命名
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        default_output = os.path.join(output_dir, base_name + ".pdf")
        
        if os.path.abspath(default_output) != os.path.abspath(output_path):
            if os.path.exists(default_output):
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(default_output, output_path)
        
        return {'method': 'libreoffice'}

    def convert(self, input_path: str, output_path: str, **options) -> Dict[str, Any]:
        self.validate_input(input_path)
        self.update_progress(input_path, 5)
        
        error_messages = []
        
        # 策略 1: 尝试 Microsoft PowerPoint
        try:
            self.update_progress(input_path, 20)
            result = self._convert_with_powerpoint(input_path, output_path)
            self.update_progress(input_path, 100)
            return {
                'success': True,
                'output_path': output_path,
                'method': result['method'],
                'size': self.get_output_size(output_path)
            }
        except Exception as e:
            error_messages.append(f"Microsoft PowerPoint failed: {str(e)}")
            # 继续尝试下一个策略
            
        # 策略 2: 尝试 LibreOffice
        try:
            self.update_progress(input_path, 50)
            result = self._convert_with_libreoffice(input_path, output_path)
            self.update_progress(input_path, 100)
            return {
                'success': True,
                'output_path': output_path,
                'method': result['method'],
                'size': self.get_output_size(output_path)
            }
        except Exception as e:
            error_messages.append(f"LibreOffice failed: {str(e)}")
            
        # 所有策略都失败
        return {
            'success': False, 
            'error': "All conversion strategies failed.\n" + "\n".join(error_messages)
        }

