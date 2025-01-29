const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  findStock: (url) => ipcRenderer.invoke("find-stock", url),
  updateListHandler: (callback) => ipcRenderer.on("update-list", callback),
  loadStocks: () => ipcRenderer.invoke("load-stocks"),
  deleteStock: (id) => ipcRenderer.invoke("remove-stock", id),
  updateData: () => ipcRenderer.invoke("update-data"),
  openAnalyze: (id) => ipcRenderer.invoke("open-analyze", id),
  getStock: (data) => ipcRenderer.invoke("get-stock", data),
  onMessage: (callback) => ipcRenderer.on("selected-stock", callback),
  openSettings: () => ipcRenderer.invoke("open-settings"),
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  updateInterval: (interval) => ipcRenderer.on("update-interval", interval),
  openLogs: () => ipcRenderer.invoke("open-logs"),
  getLogs: () => ipcRenderer.invoke("get-logs"),
});
