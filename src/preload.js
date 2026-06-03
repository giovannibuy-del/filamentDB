const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spoolerApi', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (state) => ipcRenderer.invoke('state:save', state),
  fetchMakerWorld: (url) => ipcRenderer.invoke('makerworld:fetch', url),
  openExternal: (url) => ipcRenderer.invoke('link:openExternal', url)
});
