// Pont entre le site AR2 (affiché dans l'appli) et AR2 Crosshair.
// Le site détecte window.ar2App et envoie directement crosshair / objectifs / sauvegardes à l'appli.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ar2App', {
    inApp: true,
    info: () => ipcRenderer.invoke('wiki-info'),
    importCode: (text, opts) => ipcRenderer.invoke('wiki-import', Object.assign({ text }, opts || {})),
    openSettings: () => ipcRenderer.invoke('wiki-settings'),
    retry: () => ipcRenderer.invoke('wiki-retry'),
    // v1.5 : boussole, télémètre, thèmes et index du wiki instantané
    setRoute: (r) => ipcRenderer.invoke('wiki-route', r),
    setRange: (o) => ipcRenderer.invoke('wiki-range', o),
    setTheme: (id) => ipcRenderer.invoke('wiki-theme-set', id),
    getTheme: () => ipcRenderer.invoke('wiki-theme-get'),
    pushIndex: (ix) => ipcRenderer.invoke('wiki-index', ix)
});
