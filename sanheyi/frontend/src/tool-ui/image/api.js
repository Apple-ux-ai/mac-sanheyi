export const API_BASE_URL = 'http://127.0.0.1:8070';

export const convertPNG = async (files, targetFormat, options = {}) => {
  try {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }

    formData.append('target_format', targetFormat);

    if (options.quality !== undefined) {
      formData.append('quality', options.quality);
    }

    if (options.optimize !== undefined) {
      formData.append('optimize', options.optimize);
    }

    if (options.lossless !== undefined) {
      formData.append('lossless', options.lossless);
    }

    if (options.compression !== undefined) {
      formData.append('compression', options.compression);
    }

    if (options.duration !== undefined) {
      formData.append('duration', options.duration);
    }

    if (options.loop !== undefined) {
      formData.append('loop', options.loop);
    }

    if (options.pdf_orientation !== undefined) {
      formData.append('orientation', options.pdf_orientation);
    }

    if (options.icon_size !== undefined) {
      formData.append('icon_size', options.icon_size);
    }

    if (options.icon_size !== undefined) {
      formData.append('icon_size', options.icon_size);
    }

    if (options.merge_document !== undefined) {
      formData.append('merge_document', options.merge_document);
    }

    if (options.merge_pdf !== undefined) {
      formData.append('merge_pdf', options.merge_pdf);
    }

    if (options.background_color !== undefined && options.background_color !== '#FFFFFF') {
      formData.append('background_color', options.background_color);
    }

    if (options.merge_pdf !== undefined) {
      formData.append('merge_pdf', options.merge_pdf);
    }

    if (options.merge_pdf !== undefined) {
      formData.append('merge_pdf', options.merge_pdf);
    }

    const response = await fetch(`${API_BASE_URL}/api/convert/png`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '转换失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};

export const convertJPG = async (files, targetFormat, options = {}) => {
  try {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }

    formData.append('target_format', targetFormat);

    if (options.quality !== undefined) {
      formData.append('quality', options.quality);
    }

    if (options.optimize !== undefined) {
      formData.append('optimize', options.optimize);
    }

    if (options.lossless !== undefined) {
      formData.append('lossless', options.lossless);
    }

    if (options.compression !== undefined) {
      formData.append('compression', options.compression);
    }

    if (options.duration !== undefined) {
      formData.append('duration', options.duration);
    }

    if (options.loop !== undefined) {
      formData.append('loop', options.loop);
    }

    if (options.pdf_orientation !== undefined) {
      formData.append('orientation', options.pdf_orientation);
    }

    if (options.icon_size !== undefined) {
      formData.append('icon_size', options.icon_size);
    }

    if (targetFormat === 'zip' && options.compression_level !== undefined) {
      formData.append('compression_level', options.compression_level);
    }

    if (options.merge_document !== undefined) {
      formData.append('merge_document', options.merge_document);
    }

    if (options.background_color !== undefined && options.background_color !== '#FFFFFF') {
      formData.append('background_color', options.background_color);
    }

    const response = await fetch(`${API_BASE_URL}/api/convert/jpg`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '转换失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};

export const convertTIFF = async (files, targetFormat, options = {}) => {
  try {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }

    formData.append('target_format', targetFormat);

    if (options.quality !== undefined) {
      formData.append('quality', options.quality);
    }

    if (options.optimize !== undefined) {
      formData.append('optimize', options.optimize);
    }

    if (options.lossless !== undefined) {
      formData.append('lossless', options.lossless);
    }

    if (options.duration !== undefined) {
      formData.append('duration', options.duration);
    }

    if (options.loop !== undefined) {
      formData.append('loop', options.loop);
    }

    if (options.pdf_orientation !== undefined) {
      formData.append('orientation', options.pdf_orientation);
    }

    if (options.icon_size !== undefined) {
      formData.append('icon_size', options.icon_size);
    }

    if (options.background_color !== undefined && options.background_color !== '#FFFFFF') {
      formData.append('background_color', options.background_color);
    }

    if (options.merge_pdf !== undefined) {
      formData.append('merge_pdf', options.merge_pdf);
    }

    const response = await fetch(`${API_BASE_URL}/api/convert/tiff`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '转换失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};

export const convertSVG = async (files, targetFormat, options = {}) => {
  try {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }

    formData.append('target_format', targetFormat);

    if (options.quality !== undefined) {
      formData.append('quality', options.quality);
    }

    if (options.optimize !== undefined) {
      formData.append('optimize', options.optimize);
    }

    if (options.lossless !== undefined) {
      formData.append('lossless', options.lossless);
    }

    if (options.compression !== undefined) {
      formData.append('compression', options.compression);
    }

    if (options.duration !== undefined) {
      formData.append('duration', options.duration);
    }

    if (options.loop !== undefined) {
      formData.append('loop', options.loop);
    }

    if (options.pdf_orientation !== undefined) {
      formData.append('orientation', options.pdf_orientation);
    }

    if (options.icon_size !== undefined) {
      formData.append('icon_size', options.icon_size);
    }

    if (options.dpi !== undefined) {
      formData.append('dpi', options.dpi);
    }

    if (options.scale !== undefined) {
      formData.append('scale', options.scale);
    }

    if (options.background_color !== undefined && options.background_color !== '#FFFFFF') {
      formData.append('background_color', options.background_color);
    }

    const response = await fetch(`${API_BASE_URL}/api/convert/svg`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '转换失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};

export const getSupportedFormats = async () => {
  const res = await fetch(`${API_BASE_URL}/api/formats`);
  if (!res.ok) throw new Error('获取格式列表失败');
  const data = await res.json();
  return data.formats;
};

export const healthCheck = async () => {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return await res.json();
};
