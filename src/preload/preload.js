const { contextBridge, ipcRenderer } = require('electron');

// Only expose the specific things the UI needs, never raw ipcRenderer.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
});
