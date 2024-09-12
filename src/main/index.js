import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import fs from 'fs';
import readline from 'readline';
import { setupDatabase, insertDataBlock, insertTimestampIndex } from './database.js';

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

  // 处理文件的解析逻辑
  ipcMain.handle('startProcessing', async (event, filePath) => {
    try {
      const db = setupDatabase(); // 初始化数据库连接
      const fileStream = fs.createReadStream(filePath); // 创建文件流
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity }); // 逐行读取文件内容

      let blockData = []; // 存储当前块数据
      let blockNumber = 0; // 块号
      let startOffset = 0; // 初始偏移量
      const processedData = []; // 存储处理后的块信息

      console.log(`Processing file: ${filePath}`);

      // 逐行处理文件
      for await (const line of rl) {
        const parts = line.split(',');
        const timestamp = parseInt(parts[0], 10);

        blockData.push(line);

        // 每1000行数据存为一个块
        if (blockData.length >= 1000) {
          const blockFilePath = join(__dirname, `../../resources/block_${blockNumber}.txt`);
          console.log(`Creating block file: ${blockFilePath}`);
          fs.writeFileSync(blockFilePath, blockData.join('\n'), 'utf-8');
          const endOffset = blockData.length;

          insertDataBlock(db, blockNumber, blockFilePath, startOffset, endOffset);
          insertTimestampIndex(db, timestamp, blockNumber);

          processedData.push({ blockNumber, blockFilePath, startOffset, endOffset });

          blockData = [];
          blockNumber++;
          startOffset = endOffset; // 更新偏移量
        }
      }

      // 处理最后一块数据
      if (blockData.length > 0) {
        const blockFilePath = join(__dirname, `../../resources/block_${blockNumber}.txt`);
        console.log(`Creating last block file: ${blockFilePath}`);
        fs.writeFileSync(blockFilePath, blockData.join('\n'), 'utf-8');
        const endOffset = blockData.length;

        insertDataBlock(db, blockNumber, blockFilePath, startOffset, endOffset);
        insertTimestampIndex(db, parseInt(blockData[0].split(',')[0], 10), blockNumber);

        processedData.push({ blockNumber, blockFilePath, startOffset, endOffset });
      }

      console.log('File processing completed successfully.');

      return { success: true, processedData }; // 返回处理后的数据
    } catch (error) {
      console.error('Error during file processing:', error);
      throw error;
    }
  });

  // 根据块号获取块数据
  ipcMain.handle('getBlockData', async (event, blockNumber) => {
    try {
      const db = setupDatabase();
      const blockStmt = db.prepare('SELECT * FROM data_blocks WHERE block_number = ?');
      const blockInfo = blockStmt.get(blockNumber);
      
      if (!blockInfo) {
        return null; // 如果块信息为空，返回null
      }

      // 读取块文件并返回数据
      const blockData = fs.readFileSync(blockInfo.file_path, 'utf-8').split('\n').map(line => {
        const [timestamp, ...values] = line.split(',');
        return { timestamp: parseInt(timestamp, 10), values: values.map(v => parseInt(v, 10)) };
      });

      return {
        blockNumber,
        blockData
      };
    } catch (error) {
      console.error(`Error fetching block data for block number ${blockNumber}:`, error);
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
