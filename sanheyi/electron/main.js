const { app, BrowserWindow, ipcMain, dialog, protocol, shell, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const UPDATE_SERVER_URL = 'http://software.kunqiongai.com:8000';
const SOFTWARE_ID = '10041';

let pythonProcess = null;
let pendingRequests = new Map();
let lastConversionTargets = null;
let stdoutBuffer = '';

function getAppDirectory() {
  if (app.isPackaged) {
    return path.dirname(process.execPath);
  }
  return path.join(__dirname, '..');
}

function getCurrentVersion() {
  try {
    const appDir = getAppDirectory();
    const versionFile = path.join(appDir, 'version.txt');
    if (fs.existsSync(versionFile)) {
      return fs.readFileSync(versionFile, 'utf-8').trim();
    }
  } catch (e) {}
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg && pkg.version) {
      return pkg.version;
    }
  } catch (e) {}
  return app.getVersion();
}

function getUpdaterPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'updater', 'updater.exe');
  }
  return path.join(__dirname, '..', '更新', '通用更新组件', 'updater.py');
}

function startUpdaterAndQuit(mainWindow, updateInfo) {
  if (!updateInfo || !updateInfo.download_url) {
    return;
  }
  const appDir = getAppDirectory();
  const exeName = path.basename(process.execPath);
  const updaterPath = getUpdaterPath();
  if (!fs.existsSync(updaterPath)) {
    dialog.showErrorBox('更新失败', '未找到更新组件，请重新安装应用。');
    return;
  }
  const args = [];
  if (updaterPath.toLowerCase().endsWith('.exe')) {
    args.push('--url', updateInfo.download_url);
    if (updateInfo.package_hash) {
      args.push('--hash', updateInfo.package_hash);
    }
    args.push('--dir', appDir, '--exe', exeName, '--pid', String(process.pid));
    try {
      const child = spawn(updaterPath, args, {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      app.quit();
    } catch (e) {
      dialog.showErrorBox('更新失败', '无法启动更新组件，请稍后再试。');
    }
  }
}

function checkForUpdates(mainWindow) {
  const currentVersion = getCurrentVersion();
  const requestUrl = `${UPDATE_SERVER_URL}/api/v1/updates/check/?software=${encodeURIComponent(SOFTWARE_ID)}&version=${encodeURIComponent(currentVersion)}`;
  const { net } = require('electron');
  const request = net.request(requestUrl);
  let body = '';
  request.on('response', (response) => {
    response.on('data', (chunk) => {
      body += chunk.toString();
    });
    response.on('end', () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        return;
      }
      if (!data || !data.has_update) {
        return;
      }
      const detailParts = [];
      if (data.version) {
        detailParts.push(`新版本：${data.version}`);
      }
      if (data.update_log) {
        detailParts.push(data.update_log);
      }
      const detail = detailParts.join('\n\n');
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        buttons: ['立即更新', '稍后再说'],
        defaultId: 0,
        cancelId: 1,
        title: '发现新版本',
        message: '检测到有可用更新，是否立即更新？',
        detail
      }).then((result) => {
        if (result.response === 0) {
          startUpdaterAndQuit(mainWindow, data);
        }
      });
    });
  });
  request.end();
}

function stopPythonBackend() {
  if (!pythonProcess) return;

  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pythonProcess.pid), '/f', '/t']);
    } else {
      pythonProcess.kill('SIGKILL');
    }
  } catch (error) {
    console.error('Failed to stop Python backend:', error);
  }

  for (const [id, { reject }] of pendingRequests) {
    reject(new Error('Cancelled'));
  }
  pendingRequests.clear();
  stdoutBuffer = '';
  pythonProcess = null;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1350,
    height: 875,
    minWidth: 1125,
    minHeight: 740,
    center: true,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff', // Set background color to avoid white flash
    frame: false,
    icon: path.join(__dirname, '../build/icon.ico'), // Set window icon
    titleBarStyle: 'hiddenInset', // Better for macOS, ignored on Windows unless we use frame: false
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 开发者模式：允许通过 F12 切换 DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Handle external links to open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    // In dev mode, retry loading the URL if it fails initially
    const devPorts = [5173, 5174, 5175, 5176, 5177, 5178, 5179];
    let portIndex = 0;
    const loadURL = () => {
      const port = devPorts[portIndex];
      const url = `http://localhost:${port}`;
      mainWindow.loadURL(url).catch(() => {
        portIndex = (portIndex + 1) % devPorts.length;
        setTimeout(loadURL, 800);
      });
    };
    loadURL();
    mainWindow.webContents.openDevTools();
  }

  const notifyMaximizedState = () => {
    if (mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
      return;
    }
    mainWindow.webContents.send('window-maximized-state-changed', mainWindow.isMaximized());
  };

  mainWindow.webContents.on('did-finish-load', () => {
    notifyMaximizedState();
  });
  mainWindow.on('maximize', notifyMaximizedState);
  mainWindow.on('unmaximize', notifyMaximizedState);

  // Handle F12 to toggle DevTools (dev only)
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }
  return mainWindow;
}

// Start Python Backend
function startPythonBackend() {
  if (pythonProcess) {
    stopPythonBackend();
  }

  let command;
  let args;

  if (app.isPackaged) {
    // In production, use the bundled executable
    const isWin = process.platform === 'win32';
    const backendPath = isWin ? 'api.exe' : 'api';
    const scriptPath = path.join(process.resourcesPath, 'backend', backendPath);
    command = scriptPath;
    args = [];
    console.log('Starting Python backend (prod):', scriptPath);
  } else {
    // In dev, use python command
    const scriptPath = path.join(__dirname, '../backend/main.py');
    command = 'python';
    args = [scriptPath];
    console.log('Starting Python backend (dev):', scriptPath);
  }
  
  try {
    pythonProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ELECTRON_IPC: '1',
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
        PYTHONUNBUFFERED: '1',
      },
    });
  } catch (e) {
    console.error('Failed to spawn Python process:', e);
    return;
  }
  stdoutBuffer = '';
  pythonProcess.on('error', (error) => {
    console.error('Python process failed to start:', error);
    stopPythonBackend();
  });
  pythonProcess.stdout.on('data', (chunk) => {
    const str = chunk.toString();
    console.log(`Python stdout: ${str}`);

    stdoutBuffer += str;
    const parts = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = parts.pop() ?? '';

    for (const rawLine of parts) {
      const line = rawLine.trim();
      if (!line) continue;

      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch (e) {
        continue;
      }

      if (parsed && parsed.id && pendingRequests.has(parsed.id)) {
        const { resolve } = pendingRequests.get(parsed.id);
        pendingRequests.delete(parsed.id);
        resolve(parsed.result);
        continue;
      }

      if (parsed && parsed.type === 'output') {
        if (Array.isArray(parsed.targets) && parsed.targets.length > 0) {
          lastConversionTargets = parsed.targets;
        } else if (parsed.output) {
          lastConversionTargets = [parsed.output];
        }
      }

      if (parsed && (parsed.type === 'progress' || parsed.type === 'output')) {
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('conversion-progress', parsed);
        });
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    // Reject all pending requests
    for (const [id, { reject }] of pendingRequests) {
      reject(new Error('Cancelled'));
    }
    pendingRequests.clear();
    stdoutBuffer = '';
  });
}

// Helper to send request to Python and wait for response
function sendToPython(data) {
  return new Promise((resolve, reject) => {
    if (!pythonProcess) {
      reject(new Error('Python backend not running'));
      return;
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const request = { ...data, id };
    
    pendingRequests.set(id, { resolve, reject });
    pythonProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

app.whenReady().then(() => {
  // Register 'media' protocol to serve local files
  protocol.registerFileProtocol('media', (request, callback) => {
    const url = request.url.replace('media://', '');
    try {
      const decodedPath = decodeURIComponent(url);
      const normalizedPath = path.normalize(decodedPath);
      return callback({ path: normalizedPath });
    } catch (error) {
      console.error(error);
    }
  });

  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }

  startPythonBackend();
  const mainWindow = createWindow();
  if (app.isPackaged) {
    checkForUpdates(mainWindow);
  }

  // IPC Handlers
  ipcMain.handle('perform-conversion', async (event, { action, payload }) => {
    try {
      // Pure read-only operations do not need an output directory
      if (action === 'get-video-info' || action === 'cleanup-preview') {
        return await sendToPython({ action, payload });
      }

      if (action === 'generate-preview') {
        if (!payload.outputDir) {
          payload.outputDir = path.join(app.getPath('temp'), 'convert-tool-preview');
        }
        return await sendToPython({ action, payload });
      }

      // For real conversion actions, require an explicit outputDir.
      // Default to a temp directory instead of Desktop to avoid clutter.
      if (!payload.outputDir) {
        const tempDir = path.join(app.getPath('temp'), 'convert-tool-output');
        const fs = require('fs');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        payload.outputDir = tempDir;
      }

      return await sendToPython({ action, payload });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:openFile', async (event, filters) => {
    const options = {
      properties: ['openFile', 'multiSelections']
    };
    if (Array.isArray(filters) && filters.length > 0) {
      options.filters = filters;
    } else {
      options.filters = [{ name: 'Videos', extensions: ['avi', 'mp4', 'mkv', 'mov'] }];
    }
    const { canceled, filePaths } = await dialog.showOpenDialog(options);
    if (canceled) {
      return [];
    } else {
      return filePaths;
    }
  });

  ipcMain.handle('shell:openPath', async (event, path) => {
    await require('electron').shell.openPath(path);
  });

  ipcMain.handle('shell:openOutputDir', async (event, customPath) => {
    // If a custom path is provided (e.g. from frontend state), open that.
    // Otherwise open Desktop as a safe fallback instead of creating a new folder.
    const outputDir = customPath || app.getPath('desktop');
    try {
      await require('electron').shell.openPath(outputDir);
    } catch (error) {
      console.error('Failed to open output directory:', error);
    }
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled) {
      return null;
    } else {
      return filePaths[0];
    }
  });

  ipcMain.handle('fs:saveFile', async (event, { path: filePath, data }) => {
    try {
      const fs = require('fs');
      fs.writeFileSync(filePath, Buffer.from(data));
      return { success: true };
    } catch (error) {
      console.error('Save file error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:readFile', async (event, { path: filePath }) => {
    try {
      const fs = require('fs');
      const data = fs.readFileSync(filePath);
      return { success: true, data };
    } catch (error) {
      console.error('Read file error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:copyFile', async (event, { src, dest }) => {
    try {
      const fs = require('fs');
      fs.copyFileSync(src, dest);
      return { success: true };
    } catch (error) {
      console.error('Copy file error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
    const { canceled, filePath } = await dialog.showSaveDialog(options);
    if (canceled) {
      return null;
    } else {
      return filePath;
    }
  });

  ipcMain.handle('cancel-conversion', async (event, payload) => {
    try {
      console.log('Cancelling conversion...');
      
      stopPythonBackend();

      await new Promise(resolve => setTimeout(resolve, 800));

      startPythonBackend();

      const fs = require('fs');
      const deletePathSafe = (targetPath) => {
        try {
          if (!targetPath) {
            return;
          }

          if (!fs.existsSync(targetPath)) {
            const ext = path.extname(targetPath).toLowerCase();
            if (ext === '.mp4' || ext === '.mov') {
              const dir = path.dirname(targetPath);
              const base = path.basename(targetPath, ext);
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              const hexPattern = /^[0-9a-f]{8}$/i;
              for (const entry of entries) {
                if (!entry.isFile()) continue;
                if (!entry.name.toLowerCase().endsWith(ext)) continue;
                const nameWithoutExt = entry.name.slice(0, -ext.length);
                if (nameWithoutExt === base) {
                  const fullPath = path.join(dir, entry.name);
                  if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log('Deleted partial conversion file:', fullPath);
                  }
                  continue;
                }
                const idx = nameWithoutExt.indexOf('_');
                if (idx > 0) {
                  const prefix = nameWithoutExt.slice(0, idx);
                  const suffix = nameWithoutExt.slice(idx + 1);
                  if (prefix === base && hexPattern.test(suffix)) {
                    const fullPath = path.join(dir, entry.name);
                    if (fs.existsSync(fullPath)) {
                      fs.unlinkSync(fullPath);
                      console.log('Deleted partial conversion file:', fullPath);
                    }
                  }
                }
              }
            }
          }

          if (!fs.existsSync(targetPath)) {
            return;
          }

          const stats = fs.statSync(targetPath);
          if (stats.isDirectory()) {
            fs.rmSync(targetPath, { recursive: true, force: true });
            console.log('Deleted partial conversion directory:', targetPath);
          } else {
            fs.unlinkSync(targetPath);
            console.log('Deleted partial conversion file:', targetPath);
          }
        } catch (e) {
          console.error('Failed to delete path during cancel:', targetPath, e);
        }
      };

      if (payload && payload.targetDir) {
        deletePathSafe(payload.targetDir);
      }

      if (payload && payload.targetPath) {
        if (Array.isArray(payload.targetPath)) {
          payload.targetPath.forEach(deletePathSafe);
        } else {
          deletePathSafe(payload.targetPath);
        }
      }

      if (Array.isArray(lastConversionTargets)) {
        lastConversionTargets.forEach(deletePathSafe);
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel conversion error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.handle('window:toggleMaximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;
    if (win.isMaximized()) {
      win.unmaximize();
      return false;
    }
    win.maximize();
    return true;
  });

  ipcMain.handle('window:isMaximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isMaximized() ?? false;
  });

  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  // Helper for downloading files
  const downloadFile = (url, filePath) => {
    return new Promise((resolve, reject) => {
      const { net } = require('electron');
      const request = net.request(url);
      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        const fs = require('fs');
        const fileStream = fs.createWriteStream(filePath);
        response.on('data', (chunk) => {
          fileStream.write(chunk);
        });
        response.on('end', () => {
          fileStream.end();
          resolve();
        });
        response.on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      });
      request.on('error', (err) => {
        reject(err);
      });
      request.end();
    });
  };

  // IPC 处理器：下载单个文件
  ipcMain.handle('download-file', async (event, { url, defaultFilename }) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        title: '保存文件',
        defaultPath: defaultFilename,
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'] },
          { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'html', 'xml', 'json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }
      
      await downloadFile(url, filePath);
      return { success: true, filePath };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC 处理器：批量下载文件
  ipcMain.handle('download-all-files', async (event, files) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const results = [];
      
      for (const file of files) {
        try {
          const { filePath, canceled } = await dialog.showSaveDialog(win, {
            title: `保存文件 (${results.length + 1}/${files.length})`,
            defaultPath: file.filename,
            filters: [
               { name: 'All Files', extensions: ['*'] }
            ]
          });
          
          if (canceled) {
            results.push({ filename: file.filename, success: false, canceled: true });
            continue;
          }
          
          await downloadFile(file.url, filePath);
          results.push({ filename: file.filename, success: true, filePath });
        } catch (error) {
          console.error(`Failed to download ${file.filename}:`, error);
          results.push({ filename: file.filename, success: false, error: error.message });
        }
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('Batch download error:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC 处理器：保存压缩包
  ipcMain.handle('save-zip', async (event, { buffer, defaultFilename }) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        title: '保存压缩包',
        defaultPath: defaultFilename,
        filters: [
          { name: 'ZIP Archive', extensions: ['zip'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }
      
      const fs = require('fs');
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return { success: true, filePath };
    } catch (error) {
      console.error('Save ZIP error:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC 处理器：打开外部链接
  ipcMain.handle('open-external', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Open external URL error:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC 处理器：获取资源URL (复刻自参考代码)
  ipcMain.handle('get-resource-url', async (event, filename) => {
    const fs = require('fs');
    let resourcePath;
    if (app.isPackaged) {
      resourcePath = path.join(process.resourcesPath, 'frontend', 'dist', 'assets', filename);
      if (!fs.existsSync(resourcePath)) {
          resourcePath = path.join(__dirname, '../frontend/dist', filename);
          if (!fs.existsSync(resourcePath)) {
               resourcePath = path.join(__dirname, '../frontend/dist/assets', filename);
          }
      }
    } else {
      resourcePath = path.join(__dirname, '../frontend/public', filename);
    }
    return `file://${resourcePath.replace(/\\/g, '/')}`;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  stopPythonBackend();
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
