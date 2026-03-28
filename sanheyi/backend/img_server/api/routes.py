from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List
from services.converter_service import ConverterService
from utils.file_handler import FileHandler
from utils.validator import Validator

router = APIRouter()
converter_service = ConverterService()
file_handler = FileHandler()
validator = Validator()

@router.post("/convert/png")
async def convert_png(
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    quality: Optional[int] = Form(None),
    optimize: Optional[bool] = Form(None),
    lossless: Optional[bool] = Form(None),
    compression: Optional[str] = Form(None),
    duration: Optional[int] = Form(100),
    loop: Optional[int] = Form(None),
    orientation: Optional[str] = Form('portrait'),
    icon_size: Optional[int] = Form(None),
    background_color: Optional[str] = Form(None),
    merge_document: Optional[bool] = Form(None),
    merge_pdf: Optional[bool] = Form(None)
):
    """
    转换PNG文件到指定格式
    
    Args:
        files: PNG文件列表（支持单个或多个）
        target_format: 目标格式（jpg/webp/bmp/gif/ico/tiff/bitmap/base64/html/pdf/avif/txt/csv/json/xml/ppt/docx/doc/epub/odf/svg/psd）
        quality: 质量参数（1-100）
        optimize: 是否优化
        lossless: 是否无损（仅WEBP）
        compression: 压缩类型（仅TIFF，可选none/lzw/jpeg）
        duration: 动画延迟（毫秒，仅GIF多图）
        loop: 循环次数（0=无限，仅GIF多图）
    """
    input_paths = []
    
    try:
        # 验证参数
        target_format = validator.validate_target_format(
            target_format,
            converter_service.get_supported_formats()
        )
        quality = validator.validate_quality(quality)
        optimize = validator.validate_boolean(optimize, True)
        lossless = validator.validate_boolean(lossless, False)
        icon_size = validator.validate_icon_size(icon_size)
        background_color = validator.validate_color_hex(background_color) if background_color is not None else None
        merge_document = validator.validate_boolean(merge_document, False)
        merge_pdf = validator.validate_boolean(merge_pdf, False)
        
        # 保存所有上传文件
        for file in files:
            input_path = await file_handler.save_upload_file(file)
            input_paths.append(input_path)
        
        # 构建转换选项
        options = {
            'quality': quality,
            'optimize': optimize,
            'lossless': lossless
        }
        
        if compression:
            options['compression'] = compression

        if icon_size is not None:
            options['icon_size'] = icon_size

        if background_color is not None:
            options['background_color'] = background_color
        
        # GIF格式且多文件时添加动画参数
        if target_format == 'gif' and len(input_paths) > 1:
            options['duration'] = duration
            if loop is not None:
                options['loop'] = loop
        
        # PDF格式添加方向参数
        if target_format == 'pdf':
            options['orientation'] = orientation
        
        # 执行转换（多文件或单文件）
        doc_formats = {'ppt', 'docx', 'doc', 'html', 'txt'}
        if (target_format == 'gif' and len(input_paths) > 1) or \
           (target_format == 'pdf' and merge_pdf and len(input_paths) > 1) or \
           (merge_document and target_format in doc_formats and len(input_paths) > 1):
            result = converter_service.convert_png(input_paths, target_format, **options)
        else:
            # 单文件转换（保持向后兼容）
            result = converter_service.convert_png(input_paths[0], target_format, **options)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        # 清理上传的临时文件
        for input_path in input_paths:
            file_handler.cleanup_file(input_path)

@router.post("/convert/jpg")
async def convert_jpg(
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    quality: Optional[int] = Form(None),
    optimize: Optional[bool] = Form(None),
    lossless: Optional[bool] = Form(None),
    compression: Optional[str] = Form(None),
    duration: Optional[int] = Form(100),
    loop: Optional[int] = Form(None),
    orientation: Optional[str] = Form('portrait'),
    icon_size: Optional[int] = Form(None),
    compression_level: Optional[int] = Form(None),
    merge_document: Optional[bool] = Form(None)
):
    """
    转换JPG文件到指定格式
    
    Args:
        files: JPG文件列表（支持单个或多个）
        target_format: 目标格式（png/bmp/gif/webp/tiff/ico/base64/html/pdf/avif/zip/txt/csv/json/xml/ppt/docx/doc/xls/svg/psd）
        quality: 质量参数（1-100，仅WEBP）
        optimize: 是否优化
        lossless: 是否无损（仅WEBP）
        compression: 压缩类型（仅TIFF，可选none/lzw/jpeg）
        duration: 动画延迟（毫秒，仅GIF多图）
        loop: 循环次数（0=无限，仅GIF多图）
    """
    input_paths = []
    
    try:
        # 验证参数
        target_format = validator.validate_target_format(
            target_format,
            converter_service.get_jpg_supported_formats()
        )
        quality = validator.validate_quality(quality)
        optimize = validator.validate_boolean(optimize, True)
        lossless = validator.validate_boolean(lossless, False)
        icon_size = validator.validate_icon_size(icon_size)
        merge_document = validator.validate_boolean(merge_document, False)
        
        # 保存所有上传文件
        for file in files:
            input_path = await file_handler.save_upload_file(file)
            input_paths.append(input_path)
        
        # 构建转换选项
        options = {
            'quality': quality,
            'optimize': optimize,
            'lossless': lossless
        }
        
        if compression:
            options['compression'] = compression

        if icon_size is not None:
            options['icon_size'] = icon_size

        # ZIP格式添加压缩级别参数
        if target_format == 'zip':
            options['compression_level'] = validator.validate_compression_level(compression_level)
        
        # GIF格式且多文件时添加动画参数
        if target_format == 'gif' and len(input_paths) > 1:
            options['duration'] = duration
            if loop is not None:
                options['loop'] = loop
        
        # PDF格式添加方向参数
        if target_format == 'pdf':
            options['orientation'] = orientation
        
        # 执行转换（多文件或单文件）
        doc_formats = {'ppt', 'docx', 'doc', 'html', 'xls', 'txt'}
        if (target_format == 'gif' and len(input_paths) > 1) or \
           (target_format == 'pdf' and len(input_paths) > 1) or \
           (merge_document and target_format in doc_formats and len(input_paths) > 1):
            result = converter_service.convert_jpg(input_paths, target_format, **options)
        else:
            # 单文件转换（保持向后兼容）
            result = converter_service.convert_jpg(input_paths[0], target_format, **options)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        # 清理上传的临时文件
        for input_path in input_paths:
            file_handler.cleanup_file(input_path)

@router.get("/formats")
async def get_supported_formats():
    """获取PNG支持的转换格式列表"""
    return {
        'formats': converter_service.get_supported_formats()
    }

@router.get("/formats/jpg")
async def get_jpg_supported_formats():
    """获取JPG支持的转换格式列表"""
    return {
        'formats': converter_service.get_jpg_supported_formats()
    }

@router.post("/convert/tiff")
async def convert_tiff(
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    quality: Optional[int] = Form(None),
    optimize: Optional[bool] = Form(None),
    lossless: Optional[bool] = Form(None),
    duration: Optional[int] = Form(100),
    loop: Optional[int] = Form(None),
    orientation: Optional[str] = Form('portrait'),
    icon_size: Optional[int] = Form(None),
    background_color: Optional[str] = Form(None)
):
    """
    转换TIFF文件到指定格式
    
    Args:
        files: TIFF文件列表
        target_format: 目标格式（png/jpg/gif/bmp/webp/bitmap/ico/pdf/svg）
        quality: 质量参数（1-100，仅JPG/WEBP）
        optimize: 是否优化
        lossless: 是否无损（仅WEBP）
        duration: 动画延迟（毫秒，仅GIF多图）
        loop: 循环次数（0=无限，仅GIF多图）
        orientation: 页面方向（PDF）
    """
    input_paths = []
    
    try:
        # 验证参数
        target_format = validator.validate_target_format(
            target_format,
            converter_service.get_tiff_supported_formats()
        )
        quality = validator.validate_quality(quality)
        optimize = validator.validate_boolean(optimize, True)
        lossless = validator.validate_boolean(lossless, False)
        icon_size = validator.validate_icon_size(icon_size)
        background_color = validator.validate_color_hex(background_color) if background_color is not None else None
        
        # 保存所有上传文件
        for file in files:
            input_path = await file_handler.save_upload_file(file)
            input_paths.append(input_path)
        
        # 构建转换选项
        options = {
            'quality': quality,
            'optimize': optimize,
            'lossless': lossless
        }

        if icon_size is not None:
            options['icon_size'] = icon_size

        if background_color is not None:
            options['background_color'] = background_color
        
        # GIF格式且多文件时添加动画参数
        if target_format == 'gif' and len(input_paths) > 1:
            options['duration'] = duration
            if loop is not None:
                options['loop'] = loop
        
        # PDF格式添加方向参数
        if target_format == 'pdf':
            options['orientation'] = orientation
        
        # 执行转换（多文件或单文件）
        if target_format == 'gif' and len(input_paths) > 1:
            result = converter_service.convert_tiff(input_paths, target_format, **options)
        elif target_format == 'pdf' and len(input_paths) > 1:
            result = converter_service.convert_tiff(input_paths, target_format, **options)
        else:
            result = converter_service.convert_tiff(input_paths[0], target_format, **options)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        # 清理上传的临时文件
        for input_path in input_paths:
            file_handler.cleanup_file(input_path)

@router.get("/formats/tiff")
async def get_tiff_supported_formats():
    """获取TIFF支持的转换格式列表"""
    return {
        'formats': converter_service.get_tiff_supported_formats()
    }

@router.post("/convert/svg")
async def convert_svg(
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    quality: Optional[int] = Form(None),
    optimize: Optional[bool] = Form(None),
    lossless: Optional[bool] = Form(None),
    scale: Optional[float] = Form(1.0),
    dpi: Optional[int] = Form(300),
    duration: Optional[int] = Form(100),
    loop: Optional[int] = Form(None),
    orientation: Optional[str] = Form('portrait'),
    icon_size: Optional[int] = Form(None),
    background_color: Optional[str] = Form(None),
    compression_level: Optional[int] = Form(None)
):
    """
    转换SVG文件到指定格式
    
    Args:
        files: SVG文件列表
        target_format: 目标格式（base64/html/zip/png/jpg/pdf/webp/avif/gif/bmp/bitmap/ico）
        quality: 质量参数（1-100，用于JPG/WEBP/AVIF）
        optimize: 是否优化（用于JPG）
        lossless: 是否无损（用于WEBP）
        scale: SVG缩放因子（默认1.0）
        dpi: 分辨率（默认300）
        duration: 动画延迟（毫秒，仅GIF多图）
        loop: 循环次数（0=无限，仅GIF多图）
        orientation: 页面方向（PDF多图合并）
    """
    input_paths = []
    
    try:
        # 验证参数
        target_format = validator.validate_target_format(
            target_format,
            converter_service.get_svg_supported_formats()
        )
        quality = validator.validate_quality(quality)
        optimize = validator.validate_boolean(optimize, True)
        lossless = validator.validate_boolean(lossless, False)
        icon_size = validator.validate_icon_size(icon_size)
        background_color = validator.validate_color_hex(background_color) if background_color is not None else None
        
        # 保存所有上传文件
        for file in files:
            input_path = await file_handler.save_upload_file(file)
            input_paths.append(input_path)
        
        # 构建转换选项
        options = {
            'quality': quality,
            'optimize': optimize,
            'lossless': lossless,
            'scale': scale,
            'dpi': dpi
        }

        if icon_size is not None:
            options['icon_size'] = icon_size

        if background_color is not None:
            options['background_color'] = background_color

        if target_format == 'gif' and len(input_paths) > 1:
            options['duration'] = duration
            if loop is not None:
                options['loop'] = loop

        if target_format == 'pdf':
            options['orientation'] = orientation

        # ZIP格式添加压缩级别参数
        if target_format == 'zip':
            options['compression_level'] = validator.validate_compression_level(compression_level)
        
        if target_format in {'gif', 'pdf'} and len(input_paths) > 1:
            result = converter_service.convert_svg(input_paths, target_format, **options)
        else:
            result = converter_service.convert_svg(input_paths[0], target_format, **options)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        # 清理上传的临时文件
        for input_path in input_paths:
            file_handler.cleanup_file(input_path)

@router.get("/formats/svg")
async def get_svg_supported_formats():
    """获取SVG支持的转换格式列表"""
    return {
        'formats': converter_service.get_svg_supported_formats()
    }
