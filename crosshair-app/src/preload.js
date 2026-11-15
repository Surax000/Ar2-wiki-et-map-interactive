const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('xh', {
    getState: () => ipcRenderer.invoke('get-state'),
    update: (partial) => ipcRenderer.invoke('update-settings', partial),
    setConfig: (partial) => ipcRenderer.invoke('set-config', partial),
    profile: (args) => ipcRenderer.invoke('profile', args),
    setVisible: (v) => ipcRenderer.invoke('set-visible', v),
    checkUpdate: () => ipcRenderer.invoke('update-check'),
    installUpdate: () => ipcRenderer.invoke('update-install'),
    openUrl: (u) => ipcRenderer.invoke('open-url', u),
    onState: (cb) => ipcRenderer.on('state', (e, s) => cb(s)),
    onSettings: (cb) => ipcRenderer.on('settings', (e, s) => cb(s))
});
