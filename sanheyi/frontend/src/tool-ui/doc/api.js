import { api } from '../../services/api';

const getFilePath = (file) => {
  if (!file) return null;
  if (typeof file === 'string') return file;
  if (file.path) return file.path;
  if (file.name) return file.name;
  return null;
};

const handleConvert = async (action, file, targetFormat, options) => {
  const filePath = getFilePath(file);
  if (!filePath) {
    throw new Error('Cannot get file path. Please run in Electron.');
  }

  const payload = {
    filePath,
    targetFormat,
    ...options
  };
  return await api.convert(action, payload);
};

export const convertJSON = (file, targetFormat, options) =>
  handleConvert('convert-json', file, targetFormat, options);

export const convertXML = (file, targetFormat, options) =>
  handleConvert('convert-xml', file, targetFormat, options);

export const convertGeneral = (file, targetFormat, options = {}) => {
  const filePath = getFilePath(file);
  if (!filePath) {
    throw new Error('Cannot get file path. Please run in Electron.');
  }

  const payload = {
    filePath,
    targetFormat,
    ...options
  };

  const addIfDefined = (key, value) => {
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  };

  // If the caller passed raw config (camelCase), we attempt mapping, 
  // but if they passed snake_case (from new DocToolWrapper), we preserve it.
  
  // HTML specific options (Mapping camelCase if present)
  if (options.enablePreview !== undefined) payload['enable_preview'] = options.enablePreview;
  if (options.codeMode !== undefined) payload['code_mode'] = options.codeMode;
  addIfDefined('css_handling', options.cssHandling);
  if (options.compressCss !== undefined) payload['compress_css'] = options.compressCss;
  addIfDefined('custom_css', options.customCss);
  if (options.removeScripts !== undefined) payload['remove_scripts'] = options.removeScripts;
  if (options.removeComments !== undefined) payload['remove_comments'] = options.removeComments;
  if (options.compressHtml !== undefined) payload['compress_html'] = options.compressHtml;
  if (options.removeEmptyTags !== undefined) payload['remove_empty_tags'] = options.removeEmptyTags;
  addIfDefined('page_size', options.pageSize);
  addIfDefined('orientation', options.orientation);
  
  // Image quality options
  if (options.quality !== undefined) payload['quality'] = options.quality;
  addIfDefined('background_color', options.backgroundColor);
  
  // Watermark options (handle nested object if passed)
  if (options.watermark) {
      addIfDefined('watermark_text', options.watermark.text);
      if (options.watermark.opacity !== undefined) payload['watermark_opacity'] = options.watermark.opacity;
      if (options.watermark.size !== undefined) payload['watermark_size'] = options.watermark.size;
      addIfDefined('watermark_color', options.watermark.color);
      if (options.watermark.angle !== undefined) payload['watermark_angle'] = options.watermark.angle;
      addIfDefined('watermark_position', options.watermark.position);
  }
  
  // CSV options
  addIfDefined('csv_delimiter', options.csvDelimiter);
  
  // PDF page selection
  addIfDefined('pdf_page_selection', options.pdfPageSelection);
  addIfDefined('pdf_page_range', options.pdf_page_range);
  
  // GIF animation options
  if (options.animationDelay !== undefined) payload['animation_delay'] = options.animationDelay;
  if (options.loopAnimation !== undefined) payload['loop_animation'] = options.loopAnimation;

  return api.convert('convert-general', payload);
};

export const getApiBaseUrl = async () => '';

export const healthCheck = async () => {
    return { status: 'ok' };
};
