// AR2 Crosshair – processus principal (Electron)
// Affiche un crosshair dans une petite fenêtre transparente, toujours au premier plan
// et traversée par les clics. Rien n'est injecté dans le jeu : c'est une simple fenêtre Windows.
const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const core = require('./crosshair-core.js');

const DEFAULT_HOTKEYS = {
    toggle: 'Control+Alt+X',
    settings: 'Control+Alt+S',
    nextProfile: 'Control+Alt+P',
    center: 'Control+Alt+C',
    up: 'Control+Alt+Up', down: 'Control+Alt+Down', left: 'Control+Alt+Left', right: 'Control+Alt+Right'
};

let cfgPath, cfg, overlay = null, settingsWin = null, tray = null, visible = true;

function defaultConfig() {
    return {
        version: 1,
        active: 0,
        profiles: core.PRESETS.map(p => ({ name: p.name, settings: core.withDefaults(p.s) })),
        display: 0,
        hotkeys: { ...DEFAULT_HOTKEYS },
        startHidden: false,
        launchAtStartup: false,
        moveStep: 1
    };
}
function loadConfig() {
    cfgPath = path.join(app.getPath('userData'), 'config.json');
    try {
        const c = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        const d = defaultConfig();
        cfg = Object.assign(d, c);
        cfg.hotkeys = Object.assign({ ...DEFAULT_HOTKEYS }, c.hotkeys || {});
        if (!Array.isArray(cfg.profiles) || !cfg.profiles.length) cfg.profiles = d.profiles;
        cfg.profiles.forEach(p => p.settings = core.withDefaults(p.settings));
        cfg.active = Math.min(Math.max(0, cfg.active | 0), cfg.profiles.length - 1);
    } catch (e) { cfg = defaultConfig(); }
}
let saveTimer = null;
function saveConfig() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { fs.mkdirSync(path.dirname(cfgPath), { recursive: true }); fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2)); } catch (e) {} }, 250);
}
const current = () => cfg.profiles[cfg.active].settings;

function targetDisplay() {
    const all = screen.getAllDisplays();
    return all[cfg.display] || screen.getPrimaryDisplay();
}

// Positionne la fenêtre overlay au centre de l'écran choisi (+ décalage)
function placeOverlay() {
    if (!overlay) return;
    const s = current();
    const d = targetDisplay();
    const size = Math.max(64, core.extent(s) * 2);
    const b = d.bounds;
    const x = Math.round(b.x + b.width / 2 + (s.offsetX || 0) - size / 2);
    const y = Math.round(b.y + b.height / 2 + (s.offsetY || 0) - size / 2);
    overlay.setBounds({ x, y, width: size, height: size });
    overlay.webContents.send('settings', s);
}

function createOverlay() {
    overlay = new BrowserWindow({
        width: 200, height: 200, frame: false, transparent: true, resizable: false, movable: false,
        alwaysOnTop: true, skipTaskbar: true, focusable: false, hasShadow: false, fullscreenable: false,
        show: false, backgroundColor: '#00000000',
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    });
    overlay.setIgnoreMouseEvents(true, { forward: false });
    overlay.setAlwaysOnTop(true, 'screen-saver');
    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlay.loadFile(path.join(__dirname, 'overlay.html'));
    overlay.webContents.on('did-finish-load', () => {
        placeOverlay();
        if (visible) overlay.showInactive();
    });
    // certains jeux repassent devant : on réaffirme le premier plan régulièrement
    setInterval(() => { if (overlay && visible) { overlay.setAlwaysOnTop(true, 'screen-saver'); if (!overlay.isVisible()) overlay.showInactive(); } }, 2000);
}

function createSettings() {
    if (settingsWin) { settingsWin.show(); settingsWin.focus(); return; }
    settingsWin = new BrowserWindow({
        width: 1120, height: 780, minWidth: 900, minHeight: 640, title: 'AR2 Crosshair – Réglages',
        backgroundColor: '#0f1115', autoHideMenuBar: true, icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
    });
    settingsWin.loadFile(path.join(__dirname, 'settings.html'));
    settingsWin.on('closed', () => { settingsWin = null; });
    settingsWin.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

function setVisible(v) {
    visible = v;
    if (!overlay) return;
    if (v) { placeOverlay(); overlay.showInactive(); } else overlay.hide();
    refreshTray();
    broadcast();
}

function nudge(dx, dy) {
    const s = current();
    s.offsetX = (s.offsetX || 0) + dx * (cfg.moveStep || 1);
    s.offsetY = (s.offsetY || 0) + dy * (cfg.moveStep || 1);
    placeOverlay(); saveConfig(); broadcast();
}

function registerHotkeys() {
    globalShortcut.unregisterAll();
    const h = cfg.hotkeys, fails = [];
    const reg = (acc, fn) => { if (!acc) return; try { if (!globalShortcut.register(acc, fn)) fails.push(acc); } catch (e) { fails.push(acc); } };
    reg(h.toggle, () => setVisible(!visible));
    reg(h.settings, () => createSettings());
    reg(h.nextProfile, () => { cfg.active = (cfg.active + 1) % cfg.profiles.length; placeOverlay(); saveConfig(); refreshTray(); broadcast(); });
    reg(h.center, () => { const s = current(); s.offsetX = 0; s.offsetY = 0; placeOverlay(); saveConfig(); broadcast(); });
    reg(h.up, () => nudge(0, -1)); reg(h.down, () => nudge(0, 1)); reg(h.left, () => nudge(-1, 0)); reg(h.right, () => nudge(1, 0));
    return fails;
}

function broadcast() {
    if (settingsWin) settingsWin.webContents.send('state', state());
}
function state() {
    return { cfg, visible, displays: screen.getAllDisplays().map((d, i) => ({ i, label: `Écran ${i + 1} – ${d.size.width}×${d.size.height}${d.id === screen.getPrimaryDisplay().id ? ' (principal)' : ''}` })), version: app.getVersion() };
}

function trayIcon() {
    const p = path.join(__dirname, 'assets', 'tray.png');
    return nativeImage.createFromPath(p);
}
function refreshTray() {
    if (!tray) return;
    tray.setToolTip(`AR2 Crosshair – ${cfg.profiles[cfg.active].name}${visible ? '' : ' (masqué)'}`);
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: visible ? 'Masquer le crosshair' : 'Afficher le crosshair', accelerator: cfg.hotkeys.toggle, click: () => setVisible(!visible) },
        { label: 'Réglages…', accelerator: cfg.hotkeys.settings, click: () => createSettings() },
        { type: 'separator' },
        { label: 'Profil', submenu: cfg.profiles.map((p, i) => ({ label: p.name, type: 'radio', checked: i === cfg.active, click: () => { cfg.active = i; placeOverlay(); saveConfig(); refreshTray(); broadcast(); } })) },
        { label: 'Recentrer', click: () => { const s = current(); s.offsetX = 0; s.offsetY = 0; placeOverlay(); saveConfig(); broadcast(); } },
        { type: 'separator' },
        { label: 'Quitter AR2 Crosshair', click: () => app.quit() }
    ]));
}

// ---------- IPC (fenêtre de réglages) ----------
ipcMain.handle('get-state', () => state());
ipcMain.handle('update-settings', (e, partial) => { Object.assign(current(), partial || {}); placeOverlay(); saveConfig(); return state(); });
ipcMain.handle('set-config', (e, partial) => {
    const p = partial || {};
    if (typeof p.active === 'number') cfg.active = Math.min(Math.max(0, p.active), cfg.profiles.length - 1);
    if (typeof p.display === 'number') cfg.display = p.display;
    if (typeof p.startHidden === 'boolean') cfg.startHidden = p.startHidden;
    if (typeof p.moveStep === 'number') cfg.moveStep = Math.max(1, Math.min(50, p.moveStep));
    if (typeof p.launchAtStartup === 'boolean') {
        cfg.launchAtStartup = p.launchAtStartup;
        try { app.setLoginItemSettings({ openAtLogin: p.launchAtStartup }); } catch (err) {}
    }
    let fails = [];
    if (p.hotkeys) { cfg.hotkeys = Object.assign({}, cfg.hotkeys, p.hotkeys); fails = registerHotkeys(); }
    placeOverlay(); saveConfig(); refreshTray();
    return { ...state(), fails };
});
ipcMain.handle('profile', (e, { action, name, index, code }) => {
    if (action === 'add') { cfg.profiles.push({ name: name || `Profil ${cfg.profiles.length + 1}`, settings: core.withDefaults({ ...current() }) }); cfg.active = cfg.profiles.length - 1; }
    if (action === 'rename' && cfg.profiles[index]) cfg.profiles[index].name = name || cfg.profiles[index].name;
    if (action === 'delete' && cfg.profiles.length > 1 && cfg.profiles[index]) { cfg.profiles.splice(index, 1); cfg.active = Math.min(cfg.active, cfg.profiles.length - 1); }
    if (action === 'reset') { const d = defaultConfig(); cfg.profiles = d.profiles; cfg.active = 0; }
    if (action === 'import') {
        const s = core.fromCode(code);
        cfg.profiles.push({ name: name || 'Profil importé', settings: core.withDefaults(s) });
        cfg.active = cfg.profiles.length - 1;
    }
    placeOverlay(); saveConfig(); refreshTray();
    return state();
});
ipcMain.handle('set-visible', (e, v) => { setVisible(!!v); return state(); });
ipcMain.handle('open-url', (e, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); });

// ---------- Démarrage ----------
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
    app.on('second-instance', () => createSettings());
    app.whenReady().then(() => {
        if (process.platform === 'win32') app.setAppUserModelId('com.ar2.crosshair');
        loadConfig();
        visible = !cfg.startHidden;
        createOverlay();
        tray = new Tray(trayIcon());
        tray.on('click', () => createSettings());
        refreshTray();
        registerHotkeys();
        createSettings();
        screen.on('display-metrics-changed', placeOverlay);
        screen.on('display-added', placeOverlay);
        screen.on('display-removed', () => { cfg.display = 0; placeOverlay(); });
    });
    app.on('window-all-closed', e => { /* reste dans la barre des tâches (zone de notification) */ });
    app.on('will-quit', () => globalShortcut.unregisterAll());
}
