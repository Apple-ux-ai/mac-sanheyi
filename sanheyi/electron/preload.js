const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  convert: (action, payload) => ipcRenderer.invoke('perform-conversion', { action, payload }),
  openFileDialog: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (path, data) => ipcRenderer.invoke('fs:saveFile', { path, data }),
  readFile: (path) => ipcRenderer.invoke('fs:readFile', { path }),
  copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', { src, dest }),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
  openOutputDir: (path) => ipcRenderer.invoke('shell:openOutputDir', path),
  cancelConversion: (payload) => ipcRenderer.invoke('cancel-conversion', payload),
  onProgress: (callback) => ipcRenderer.on('conversion-progress', (event, data) => callback(data)),
  removeProgressListener: () => ipcRenderer.removeAllListeners('conversion-progress'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggleMaximize'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onWindowMaximizedStateChanged: (callback) =>
    ipcRenderer.on('window-maximized-state-changed', (event, state) => callback(state)),
  removeWindowMaximizedStateChangedListener: () =>
    ipcRenderer.removeAllListeners('window-maximized-state-changed'),

  // Missing Download Methods from Reference
  downloadFile: (url, defaultFilename) => 
    ipcRenderer.invoke('download-file', { url, defaultFilename }),
  
  downloadAllFiles: (files) => 
    ipcRenderer.invoke('download-all-files', files),
  
  saveZip: (buffer, defaultFilename) => 
    ipcRenderer.invoke('save-zip', { buffer, defaultFilename }),

  openExternal: (url) => 
    ipcRenderer.invoke('open-external', url),

  getResourceUrl: (filename) => 
    ipcRenderer.invoke('get-resource-url', filename),
});
