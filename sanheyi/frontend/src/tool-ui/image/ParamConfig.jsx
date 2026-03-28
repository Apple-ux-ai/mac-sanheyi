import '../../App.css';import { t } from '@/i18n';


function ParamConfig({ targetFormat, sourceFormat, config, onChange }) {
  const handleQualityChange = (e) => {
    onChange({ ...config, quality: parseInt(e.target.value) });
  };

  const handleOptimizeChange = (e) => {
    onChange({ ...config, optimize: e.target.checked });
  };

  const handleLosslessChange = (e) => {
    onChange({ ...config, lossless: e.target.checked });
  };

  const handleCompressionLevelChange = (e) => {
    onChange({ ...config, compression_level: parseInt(e.target.value) });
  };

  const handleBackgroundColorChange = (e) => {
    onChange({ ...config, background_color: e.target.value });
  };

  const handleIconSizeChange = (e) => {
    onChange({ ...config, icon_size: parseInt(e.target.value) });
  };

  const handleDpiChange = (e) => {
    onChange({ ...config, dpi: parseInt(e.target.value) });
  };

  const handleCompressionChange = (e) => {
    onChange({ ...config, compression: e.target.value });
  };

  const handleScaleChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onChange({ ...config, scale: value });
    }
  };

  // 渲染DPI选择器（仅当源格式为SVG且目标格式为栅格图像时显示）
  const renderDpiSelector = () => {
    const bitmapTargets = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'bitmap', 'ico'];
    const shouldShowDpi = sourceFormat === 'SVG' &&
    bitmapTargets.includes(targetFormat.toLowerCase());

    if (!shouldShowDpi) return null;

    const dpiOptions = [72, 150, 300, 600];
    const selectedDpi = config.dpi || 300;

    return (
      <div className="param-item">
        <label className="param-label">{t("输出分辨率（DPI）")}</label>
        <select
          value={selectedDpi}
          onChange={handleDpiChange}
          className="param-select">
          
          {dpiOptions.map((dpi) =>
          <option key={dpi} value={dpi}>
              {dpi} dpi
            </option>
          )}
        </select>
        <div className="param-hint">{t("选择输出图像的分辨率，DPI越高图像越清晰")}</div>
      </div>);

  };

  // 根据目标格式显示不同的参数配置
  const renderFormatSpecificOptions = () => {
    switch (targetFormat.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return (
          <>
            <div className="param-item">
              <label className="param-label">{t("质量 (")}
                {config.quality || 85})
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={config.quality || 85}
                onChange={handleQualityChange}
                className="param-slider" />
              
              <div className="param-hint">{t("调整图片质量 (1-100)")}</div>
            </div>
            <div className="param-item">
              <label className="param-checkbox">
                <input
                  type="checkbox"
                  checked={config.optimize !== false}
                  onChange={handleOptimizeChange} />
                
                <span>{t("优化文件大小")}</span>
              </label>
            </div>
            {sourceFormat === 'PNG' &&
            <div className="param-item">
                <label className="param-label">{t("背景颜色")}</label>
                <div className="color-picker-container">
                  <input
                  type="color"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-slider"
                  style={{ height: '40px', cursor: 'pointer' }} />
                
                  <input
                  type="text"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-input"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  style={{ marginTop: '8px', textTransform: 'uppercase' }} />
                
                </div>
                <div className="param-hint">{t("PNG透明区域的背景色")}</div>
              </div>
            }
          </>);


      case 'webp':
        return (
          <>
            <div className="param-item">
              <label className="param-label">{t("质量 (")}
                {config.quality || 80})
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={config.quality || 80}
                onChange={handleQualityChange}
                className="param-slider" />
              
              <div className="param-hint">{t("调整图片质量 (1-100)")}</div>
            </div>
            <div className="param-item">
              <label className="param-checkbox">
                <input
                  type="checkbox"
                  checked={config.lossless || false}
                  onChange={handleLosslessChange} />
                
                <span>{t("无损压缩")}</span>
              </label>
              <div className="param-hint">{t("启用无损压缩（文件较大但质量最佳）")}</div>
            </div>
          </>);


      case 'gif':
        return (
          <>
            <div className="param-item">
              <label className="param-label">{t("动画延迟 (ms)")}

              </label>
              <input
                type="number"
                min="10"
                max="5000"
                step="10"
                value={config.duration || 100}
                onChange={(e) => onChange({ ...config, duration: parseInt(e.target.value) })}
                className="param-input" />
              
              <div className="param-hint">{t("每帧停留时间（10-5000ms）")}</div>
            </div>
            <div className="param-item">
              <label className="param-checkbox">
                <input
                  type="checkbox"
                  checked={config.loop === 0}
                  onChange={(e) => onChange({ ...config, loop: e.target.checked ? 0 : undefined })} />
                
                <span>{t("无限循环")}</span>
              </label>
              <div className="param-hint">{t("启用无限循环播放")}</div>
            </div>
            <div className="param-item">
              <label className="param-checkbox">
                <input
                  type="checkbox"
                  checked={config.optimize !== false}
                  onChange={handleOptimizeChange} />
                
                <span>{t("优化文件大小")}</span>
              </label>
            </div>
            {sourceFormat === 'PNG' &&
            <div className="param-item">
                <label className="param-label">{t("背景颜色")}</label>
                <div className="color-picker-container">
                  <input
                  type="color"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-slider"
                  style={{ height: '40px', cursor: 'pointer' }} />
                
                  <input
                  type="text"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-input"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  style={{ marginTop: '8px', textTransform: 'uppercase' }} />
                
                </div>
                <div className="param-hint">{t("PNG透明区域的背景色")}</div>
              </div>
            }
          </>);


      case 'bmp':
      case 'odf':
        if (sourceFormat === 'PNG') {
          return (
            <div className="param-item">
              <label className="param-label">{t("背景颜色")}</label>
              <div className="color-picker-container">
                <input
                  type="color"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-slider"
                  style={{ height: '40px', cursor: 'pointer' }} />
                
                <input
                  type="text"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-input"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  style={{ marginTop: '8px', textTransform: 'uppercase' }} />
                
              </div>
              <div className="param-hint">{t("PNG透明区域的背景色")}</div>
            </div>);

        }
        return (
          <div className="param-item">
            <p className="param-hint">{targetFormat.toUpperCase()}{t("格式不需要额外参数配置")}</p>
          </div>);


      case 'tiff':
        return (
          <>
            <div className="param-item">
              <label className="param-label">{t("TIFF压缩方式")}</label>
              <select
                value={config.compression || 'lzw'}
                onChange={handleCompressionChange}
                className="param-select">
                
                <option value="lzw">{t("LZW（默认）")}</option>
                <option value="none">{t("无压缩")}</option>
                <option value="jpeg">{t("JPEG压缩")}</option>
              </select>
            </div>
            {sourceFormat === 'PNG' &&
            <div className="param-item">
                <label className="param-label">{t("背景颜色")}</label>
                <div className="color-picker-container">
                  <input
                  type="color"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-slider"
                  style={{ height: '40px', cursor: 'pointer' }} />
                
                  <input
                  type="text"
                  value={config.background_color || '#FFFFFF'}
                  onChange={handleBackgroundColorChange}
                  className="param-input"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  style={{ marginTop: '8px', textTransform: 'uppercase' }} />
                
                </div>
                <div className="param-hint">{t("PNG透明区域的背景色")}</div>
              </div>
            }
          </>);


      case 'zip':
        return (
          <div className="param-item">
            <label className="param-label">{t("压缩级别 (")}
              {config.compression_level !== undefined ? config.compression_level : 6})
            </label>
            <input
              type="range"
              min="0"
              max="9"
              value={config.compression_level !== undefined ? config.compression_level : 6}
              onChange={handleCompressionLevelChange}
              className="param-slider" />
            
            <div className="param-hint">{t("0=无压缩, 9=最大压缩")}</div>
            <div className="param-hint">{t("多数图片本身已压缩，级别变化对体积影响有限，主要影响压缩耗时")}</div>
          </div>);


      case 'pdf':
        return (
          <>
            <div className="param-item">
              <label className="param-checkbox">
                <input
                  type="checkbox"
                  checked={config.merge_pdf || false}
                  onChange={(e) => onChange({ ...config, merge_pdf: e.target.checked })} />
                
                <span>{t("合并为单个PDF")}</span>
              </label>
              <div className="param-hint">{t("将所有图片合并到一个PDF文件中（可拖动调整顺序）")}</div>
            </div>
            <div className="param-item">
              <label className="param-label">{t("页面方向")}</label>
              <select
                value={config.pdf_orientation || 'portrait'}
                onChange={(e) => onChange({ ...config, pdf_orientation: e.target.value })}
                className="param-select">
                
                <option value="portrait">{t("竖向")}</option>
                <option value="landscape">{t("横向")}</option>
              </select>
              <div className="param-hint">{t("设置PDF页面的方向")}</div>
            </div>
          </>);


      case 'ppt':
      case 'docx':
      case 'doc':
      case 'html':
      case 'xls':
      case 'txt':
        return (
          <div className="param-item">
            <label className="param-checkbox">
              <input
                type="checkbox"
                checked={config.merge_document || false}
                onChange={(e) => onChange({ ...config, merge_document: e.target.checked })} />
              
              <span>{t("合并为单个文档")}</span>
            </label>
            <div className="param-hint">{t("将所有图片合并到一个文档文件中（可拖动调整顺序）")}</div>
          </div>);


      case 'avif':
        return (
          <div className="param-item">
            <label className="param-label">{t("质量 (")}
              {config.quality || 85}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.quality || 85}
              onChange={handleQualityChange}
              className="param-slider" />
            
            <div className="param-hint">{t("调整图片质量 (0-100)")}</div>
          </div>);


      case 'ico':{
          const availableSizes = [16, 32, 48, 128, 256];
          const selectedSize = config.icon_size || 48;

          return (
            <>
            <div className="param-item">
              <label className="param-label">{t("图标尺寸")}</label>
              <select
                  value={selectedSize}
                  onChange={handleIconSizeChange}
                  className="param-select">
                  
                {availableSizes.map((size) =>
                  <option key={size} value={size}>
                    {size}×{size}
                  </option>
                  )}
              </select>
              <div className="param-hint">{t("选择生成的图标尺寸")}</div>
            </div>
            {(sourceFormat === 'PNG' || sourceFormat === 'SVG') &&
              <div className="param-item">
                <label className="param-label">{t("背景颜色")}</label>
                <div className="color-picker-container">
                  <input
                    type="color"
                    value={config.background_color || '#FFFFFF'}
                    onChange={handleBackgroundColorChange}
                    className="param-slider"
                    style={{ height: '40px', cursor: 'pointer' }} />
                  
                  <input
                    type="text"
                    value={config.background_color || '#FFFFFF'}
                    onChange={handleBackgroundColorChange}
                    className="param-input"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    style={{ marginTop: '8px', textTransform: 'uppercase' }} />
                  
                </div>
                <div className="param-hint">{t("PNG透明区域的背景色")}</div>
              </div>
              }
          </>);

        }

      default:
        return null;
    }
  };

  const dpiSelector = renderDpiSelector();
  const showScale = sourceFormat === 'SVG';
  const formatOptions = renderFormatSpecificOptions();
  const shouldShowEmptyHint = !dpiSelector && !showScale && !formatOptions;

  return (
    <div className="param-config-container">
      <div className="param-list">
        {dpiSelector}
        {showScale &&
        <div className="param-item">
            <label className="param-label">{t("缩放比例")}</label>
            <input
            type="number"
            min="0.1"
            max="5"
            step="0.1"
            value={config.scale || 1.0}
            onChange={handleScaleChange}
            className="param-input" />
          
          </div>
        }
        {formatOptions}
        {shouldShowEmptyHint &&
        <div className="param-item">
            <p className="param-hint">{t("暂无参数调节设置")}</p>
          </div>
        }
      </div>
    </div>);

}

export default ParamConfig;