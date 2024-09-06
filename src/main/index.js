import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import fs from 'fs';
import readline from 'readline';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle('start-processing', async (event, filePath) => {
    // console.log('Received file path: ', filePath);

    try {
      const headers = [];
      const results = [];
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let isFirstLine = true;
      for await (const line of rl) {
        const parts = line.split(',');
        console.log('Reading line: ', parts);
        if (isFirstLine) {
          headers.push(...parts.slice(1)); // 获取通道名称
          console.log('Headers:', headers);
          isFirstLine = false;
          continue;
        }
        const timestamp = parseInt(parts[0], 10);
        const values = parts.slice(1).map(v => parseInt(v, 10)); // 解析通道数值
        results.push({ timestamp, values });
      }

      if (headers.length === 0 || results.length === 0) {
        throw new Error('解析文件时接收到空数据');
      }

      console.log('Final Headers:', headers);
      console.log('Final Results:', results);
      return { headers, results };
    } catch (error) {
      console.error('Error during file processing: ', error);
      throw error;
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
