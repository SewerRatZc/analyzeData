import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {
  startProcessing: async (filePath) => {
    try {
      const result = await ipcRenderer.invoke('startProcessing', filePath);
      return result;
    } catch (error) {
      console.error('文件解析失败', error);
      throw error;
    }
  },

  getBlockByTimestamp: async (timestamp) => {
    try {
      const blockNumber = await ipcRenderer.invoke('getBlockByTimestamp', timestamp);
      return blockNumber;
    } catch (error) {
      console.error('时间戳查询失败', error);
      throw error;
    }
  },

  getBlockData: async (blockNumber) => {
    try {
      const data = await ipcRenderer.invoke('getBlockData', blockNumber);
      return data;
    } catch (error) {
      console.error('数据块查询失败', error);
      throw error;
    }
  },

  onUpdateData: (callback) => {
    ipcRenderer.on('update-data', (event, data) => {
      if (!data) {
        console.error('Received undefined data');
        return;
      }
      callback(data);
    });
  },

  toggleRefresh: () => {
    ipcRenderer.send('toggle-refresh');
  }
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
