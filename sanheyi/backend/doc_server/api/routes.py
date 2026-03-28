# backend/api/routes.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from backend.services.converter_service import ConverterService, UPLOAD_DIR
from backend.utils.file_handler import FileHandler
from backend.utils.validator import Validator

router = APIRouter()
converter_service = ConverterService()
file_handler = FileHandler(UPLOAD_DIR)
validator = Validator()

@router.post("/convert/json")
async def convert_json(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    indent: Optional[int] = Form(2),
    sort_keys: Optional[bool] = Form(False)
):
    """
    JSON 转换接口
    """
    input_path = None
    try:
        # 1. 验证目标格式
        allowed_targets = [tgt for src, tgt in converter_service.converters.keys() if src == 'json']
        target_format = validator.validate_target_format(target_format, allowed_targets)
        
        # 2. 保存上传文件
        input_path = await file_handler.save_upload_file(file)
        
        # 3. 准备转换选项
        options = {
            'indent': indent,
            'sort_keys': sort_keys
        }
        options = validator.validate_json_options(options)
        
        # 4. 执行转换
        result = converter_service.convert_file(
            input_path, 
            target_format, 
            original_filename=file.filename,
            **options
        )
        
        return result
        
    except ValueError as e:
        print(f"ValueError during conversion: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error during conversion: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        # 5. 清理临时上传文件
        if input_path:
            file_handler.cleanup_file(input_path)

@router.post("/convert/xml")
async def convert_xml(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    indent: Optional[int] = Form(2),
    sort_keys: Optional[bool] = Form(False)
):
    """
    XML 转换接口
    """
    input_path = None
    try:
        # 1. 验证目标格式
        allowed_targets = [tgt for src, tgt in converter_service.converters.keys() if src == 'xml']
        target_format = validator.validate_target_format(target_format, allowed_targets)
        
        # 2. 保存上传文件
        input_path = await file_handler.save_upload_file(file)
        
        # 3. 准备转换选项
        options = {
            'indent': indent,
            'sort_keys': sort_keys
        }
        # 复用 JSON 的选项验证逻辑，因为参数相似
        options = validator.validate_json_options(options)
        
        # 4. 执行转换
        result = converter_service.convert_file(
            input_path, 
            target_format, 
            original_filename=file.filename,
            **options
        )
        
        return result
        
    except ValueError as e:
        print(f"ValueError during conversion: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error during conversion: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        # 5. 清理临时上传文件
        if input_path:
            file_handler.cleanup_file(input_path)

@router.post("/convert/general")
async def convert_general(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    # 通用选项
    encoding: Optional[str] = Form('utf-8'),
    # HTML 选项
    enable_preview: Optional[bool] = Form(False),
    code_mode: Optional[bool] = Form(False),  # 新增：代码模式
    css_handling: Optional[str] = Form(None),
    compress_css: Optional[bool] = Form(False),
    custom_css: Optional[str] = Form(None),
    remove_scripts: Optional[bool] = Form(False),
    remove_comments: Optional[bool] = Form(False),
    compress_html: Optional[bool] = Form(False),
    remove_empty_tags: Optional[bool] = Form(False),
    page_size: Optional[str] = Form(None),
    orientation: Optional[str] = Form(None),
    # 图片选项
    quality: Optional[int] = Form(85),
    background_color: Optional[str] = Form('#ffffff'),
    # 水印选项
    watermark_text: Optional[str] = Form(''),
    watermark_opacity: Optional[int] = Form(30),
    watermark_size: Optional[int] = Form(40),
    watermark_color: Optional[str] = Form('#cccccc'),
    watermark_angle: Optional[int] = Form(45),
    watermark_position: Optional[str] = Form('center'),
    # CSV 选项
    csv_delimiter: Optional[str] = Form(None),
    # PDF 页面选择
    pdf_page_selection: Optional[str] = Form(None),
    pdf_page_range: Optional[str] = Form(None),
    # GIF 动画选项
    animation_delay: Optional[int] = Form(100),
    loop_animation: Optional[bool] = Form(True)
):
    """
    通用转换接口 (DOCX, HTML, PDF, TXT)
    """
    input_path = None
    try:
        # 1. 获取源格式
        filename = file.filename
        if not filename:
            raise ValueError("Filename is missing")
        source_format = filename.split('.')[-1].lower()
        
        # 2. 验证目标格式
        allowed_targets = [tgt for src, tgt in converter_service.converters.keys() if src == source_format]
        if not allowed_targets:
            raise ValueError(f"Unsupported source format: {source_format}")
            
        target_format = validator.validate_target_format(target_format, allowed_targets)
        
        # 3. 保存上传文件
        input_path = await file_handler.save_upload_file(file)
        
        # 4. 准备转换选项
        options = {
            'encoding': encoding,
            'enable_preview': enable_preview,
            'code_mode': code_mode,  # 新增
            'css_handling': css_handling,
            'compress_css': compress_css,
            'custom_css': custom_css,
            'remove_scripts': remove_scripts,
            'remove_comments': remove_comments,
            'compress_html': compress_html,
            'remove_empty_tags': remove_empty_tags,
            'page_size': page_size,
            'orientation': orientation,
            'quality': quality,
            'background_color': background_color,
            'watermark_text': watermark_text,
            'watermark_opacity': watermark_opacity,
            'watermark_size': watermark_size,
            'watermark_color': watermark_color,
            'watermark_angle': watermark_angle,
            'watermark_position': watermark_position,
            'csv_delimiter': csv_delimiter,
            'pdf_page_selection': pdf_page_selection,
            'pdf_page_range': pdf_page_range,
            'animation_delay': animation_delay,
            'loop_animation': loop_animation
        }
        
        # 5. 执行转换
        result = converter_service.convert_file(
            input_path, 
            target_format, 
            original_filename=file.filename,
            **options
        )
        
        return result
        
    except ValueError as e:
        print(f"ValueError during conversion: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error during conversion: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        # 6. 清理临时上传文件
        if input_path:
            file_handler.cleanup_file(input_path)


@router.get("/health")
async def health_check():
    return {"status": "healthy", "supported_conversions": converter_service.get_supported_conversions()}
