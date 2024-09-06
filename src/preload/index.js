import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  startProcessing: async (filePath) => {
    try {
      const result = await ipcRenderer.invoke('start-processing', filePath);
      if (!result || !result.headers || !result.results) {
        throw new Error('解析文件时接收到空数据');
      }
      return result;
    } catch (error) {
      console.error('文件解析失败', error);
      throw error;
    }
  },
  onUpdateData: (callback) => {
    ipcRenderer.on('update-data', (event, data) => {
      if (!data || !data.headers || !data.results) {
        console.error('Received undefined data');
        return;
      }
      callback(data);
    });
  }
}

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
