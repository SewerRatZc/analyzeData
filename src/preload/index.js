import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload'; 

// 自定义 API，暴露给渲染进程使用
const api = {
  // 处理文件并生成索引
  startProcessing: async (filePath) => {
    try {
      const result = await ipcRenderer.invoke('startProcessing', filePath); // 调用主进程的文件处理方法
      console.log(`===== ${JSON.stringify(result)} =====`);
      return result;
    } catch (error) {
      console.log(`===== ${result} =====`);
      console.error('文件解析失败', error);
      throw error;
    }
  },

  // 根据时间戳查找对应的块号
  getBlockByTimestamp: async (timestamp) => {
    try {
      const blockNumber = await ipcRenderer.invoke('getBlockByTimestamp', timestamp);
      if (!blockNumber) {
        throw new Error('未找到对应块号');
      }
      return blockNumber;
    } catch (error) {
      console.error('时间戳查询失败', error);
      throw error;
    }
  },

  // 根据块号查找对应的数据
  getBlockData: async (blockNumber) => {
    try {
      const data = await ipcRenderer.invoke('getBlockData', blockNumber);
      if (!data) {
        throw new Error('未找到对应数据');
      }
      return data;
    } catch (error) {
      console.error('数据块查询失败', error);
      throw error;
    }
  },

  // 更新数据时的回调
  onUpdateData: (callback) => {
    ipcRenderer.on('update-data', (event, data) => {
      if (!data || !data.headers || !data.results) {
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

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
