const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getInfo: () => ipcRenderer.sendSync("getInfo"),
  updatePreferences: (options: { [key: string]: unknown }) =>
    ipcRenderer.send("updatePreferences", options),
  loadPreferences: () => ipcRenderer.invoke("loadPreferences"),
  canGoBack: () => ipcRenderer.sendSync("canGoBack"),
  canGoForward: () => ipcRenderer.sendSync("canGoForward"),
});
