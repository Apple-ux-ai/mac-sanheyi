/**
 * API Service for Electron Backend
 * Encapsulates all interactions with the main process
 */

const getElectron = () => window.electron;

export const api = {
  isAvailable: () => !!window.electron,
  /**
   * Convert file
   * @param {string} action - Action name (e.g., 'convert-avi-to-mp4')
   * @param {Object} payload - Action payload
   * @returns {Promise<Object>} Result
   */
  convert: async (action, payload) => {
    const electron = getElectron();
    if (!electron) throw new Error('Electron environment not available');
    return await electron.convert(action, payload);
  },

  /**
   * Get video info
   * @param {string} filePath 
   * @returns {Promise<Object>}
   */
  getVideoInfo: async (filePath) => {
    return await api.convert('get-video-info', { filePath });
  },

  /**
   * Open file dialog
   * @param {Array} filters - Optional file filters for dialog
   * @returns {Promise<string[]>} Selected file paths
   */
  openFileDialog: async (filters) => {
    const electron = getElectron();
    if (!electron) return [];
    return await electron.openFileDialog(filters);
  },

  /**
   * Open directory dialog
   * @returns {Promise<string>} Selected directory path
   */
  openDirectoryDialog: async () => {
    const electron = getElectron();
    if (!electron) return null;
    return await electron.openDirectoryDialog();
  },

  /**
   * Alias for openDirectoryDialog to match legacy code
   */
  selectDirectory: async () => {
    return await api.openDirectoryDialog();
  },

  /**
   * Save file content to path
   * @param {string} path 
   * @param {ArrayBuffer} data 
   * @returns {Promise<Object>}
   */
  saveFile: async (path, data) => {
    const electron = getElectron();
    if (!electron) return { success: false, error: 'Not in Electron' };
    return await electron.saveFile(path, data);
  },

  /**
   * Copy file
   * @param {string} src 
   * @param {string} dest 
   * @returns {Promise<Object>}
   */
  copyFile: async (src, dest) => {
    const electron = getElectron();
    if (!electron) return { success: false, error: 'Not in Electron' };
    return await electron.copyFile(src, dest);
  },

  /**
   * Show save dialog
   * @param {Object} options 
   * @returns {Promise<string>}
   */
  showSaveDialog: async (options) => {
    const electron = getElectron();
    if (!electron) return null;
    return await electron.showSaveDialog(options);
  },

  /**
   * Open path in file explorer
   * @param {string} path 
   */
  openPath: async (path) => {
    const electron = getElectron();
    if (electron) {
      await electron.openPath(path);
    }
  },

  /**
   * Open default output directory
   */
  openOutputDir: async () => {
    const electron = getElectron();
    if (electron && electron.openOutputDir) {
      await electron.openOutputDir();
    }
  },

  /**
   * Cancel current conversion
   * @param {Object} payload - Optional payload (e.g., targetDir)
   * @returns {Promise<Object>}
   */
  cancelConversion: async (payload) => {
    const electron = getElectron();
    if (!electron) return { success: false };
    return await electron.cancelConversion(payload);
  },

  /**
   * Listen for progress updates
   * @param {Function} callback 
   */
  onProgress: (callback) => {
    const electron = getElectron();
    if (electron) {
      electron.onProgress(callback);
    }
  },

  /**
   * Remove progress listener
   */
  removeProgressListener: () => {
    const electron = getElectron();
    if (electron) {
      electron.removeProgressListener();
    }
  }
};

/**
 * Helper function to handle file path extraction
 * @param {File} file 
 * @returns {string}
 */
const getFilePath = (file) => {
    if (file && file.path) return file.path;
    // For drag and drop in Electron, sometimes path is available
    if (file && file.name) return file.name; // Fallback, likely won't work for conversion without full path
    return null;
};

// Document Conversion APIs
export const convertGeneral = async (file, targetFormat, options) => {
    const filePath = getFilePath(file);
    if (!filePath) throw new Error('Cannot get file path. Please run in Electron.');
    
    // Construct payload matching backend expectation
    const payload = {
        filePath: filePath,
        targetFormat: targetFormat,
        ...options
    };
    
    return await api.convert('convert-general', payload);
};

export const convertJSON = async (file, targetFormat, options) => {
    const filePath = getFilePath(file);
    if (!filePath) throw new Error('Cannot get file path. Please run in Electron.');
    
    const payload = {
        filePath: filePath,
        targetFormat: targetFormat,
        ...options
    };
    
    return await api.convert('convert-json', payload);
};

export const convertXML = async (file, targetFormat, options) => {
    const filePath = getFilePath(file);
    if (!filePath) throw new Error('Cannot get file path. Please run in Electron.');
    
    const payload = {
        filePath: filePath,
        targetFormat: targetFormat,
        ...options
    };
    
    return await api.convert('convert-xml', payload);
};

export const getApiBaseUrl = async () => {
    return 'http://localhost:8000'; // Default or managed by config
};
