// Pont entre le site AR2 (affiché dans l'appli) et AR2 Crosshair.
// Le site détecte window.ar2App et envoie directement crosshair / objectifs / sauvegardes à l'appli.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ar2App', {
    inApp: true,
    info: () => ipcRenderer.invoke('wiki-info'),
    importCode: (text, opts) => ipcRenderer.invoke('wiki-import', Object.assign({ text }, opts || {})),
    openSettings: () => ipcRenderer.invoke('wiki-settings'),
    retry: () => ipcRenderer.invoke('wiki-retry')
});
