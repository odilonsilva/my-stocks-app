const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  findStock: (url) => ipcRenderer.invoke('find-stock', url),
  updateListHandler: (callback) => ipcRenderer.on('update-list', callback),
  loadStocks: () => ipcRenderer.invoke('load-stocks'),
  deleteStock: (id) =>ipcRenderer.invoke('remove-stock', id)
})

// window.addEventListener('DOMContentLoaded', () => {
//   window.electronAPI.loadStocks();
// })
