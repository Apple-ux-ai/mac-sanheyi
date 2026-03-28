from typing import Optional

class Validator:
    """参数验证器"""
    
    @staticmethod
    def validate_quality(quality: Optional[int]) -> int:
        """
        验证图片质量参数
        
        Args:
            quality: 质量值
            
        Returns:
            验证后的质量值
        """
        if quality is None:
            return 85

        if isinstance(quality, str):
            try:
                quality = int(quality)
            except ValueError:
                raise ValueError("Quality must be an integer")

        if not isinstance(quality, int):
            raise ValueError("Quality must be an integer")
        
        if quality < 1 or quality > 100:
            raise ValueError("Quality must be between 1 and 100")
        
        return quality
    
    @staticmethod
    def validate_boolean(value: Optional[bool], default: bool = True) -> bool:
        """
        验证布尔参数
        
        Args:
            value: 布尔值
            default: 默认值
            
        Returns:
            验证后的布尔值
        """
        if value is None:
            return default
        
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes')
        
        return bool(value)
    
    @staticmethod
    def validate_target_format(target_format: str, allowed_formats: list) -> str:
        """
        验证目标格式
        
        Args:
            target_format: 目标格式
            allowed_formats: 允许的格式列表
            
        Returns:
            验证后的格式
        """
        if not target_format:
            raise ValueError("Target format is required")
        
        target_format = target_format.lower().strip()
        
        if target_format not in allowed_formats:
            raise ValueError(f"Unsupported format. Allowed: {allowed_formats}")
        
        return target_format

    @staticmethod
    def validate_icon_size(icon_size) -> Optional[int]:
        if icon_size is None:
            return None
        # 处理字符串类型（从表单传递）
        if isinstance(icon_size, str):
            try:
                icon_size = int(icon_size)
            except ValueError:
                raise ValueError("Icon size must be an integer")
        if not isinstance(icon_size, int):
            raise ValueError("Icon size must be an integer")
        if icon_size <= 0 or icon_size > 1024:
            raise ValueError("Icon size must be between 1 and 1024")
        return icon_size

    @staticmethod
    def validate_color_hex(color: Optional[str], default: str = "#FFFFFF") -> str:
        if color is None:
            return default
        if not isinstance(color, str):
            raise ValueError("Color must be a string")
        value = color.strip()
        if len(value) != 7 or not value.startswith("#"):
            raise ValueError("Color must be in #RRGGBB format")
        hex_part = value[1:]
        try:
            int(hex_part, 16)
        except ValueError:
            raise ValueError("Color must be in #RRGGBB format")
        return "#" + hex_part.upper()

    @staticmethod
    def validate_compression_level(compression_level: Optional[int]) -> int:
        if compression_level is None:
            return 6

        if isinstance(compression_level, str):
            try:
                compression_level = int(compression_level)
            except ValueError:
                raise ValueError("Compression level must be an integer")

        if not isinstance(compression_level, int):
            raise ValueError("Compression level must be an integer")

        if compression_level < 0 or compression_level > 9:
            raise ValueError("Compression level must be between 0 and 9")

        return compression_level
