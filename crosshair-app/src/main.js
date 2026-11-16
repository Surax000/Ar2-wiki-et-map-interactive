// AR2 Crosshair – processus principal (Electron)
// Affiche un crosshair dans une petite fenêtre transparente, toujours au premier plan
// et traversée par les clics. Rien n'est injecté dans le jeu : c'est une simple fenêtre Windows.
const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, nativeImage, shell, desktopCapturer, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const core = require('./crosshair-core.js');
const updater = require('./updater.js');
const ws = require('./weaponswitch.js');
const ac = require('./autocolor.js');

const ARGS = process.argv.slice(1);
const SELFTEST = (ARGS.find(a => a.startsWith('--selftest=')) || '').split('=').slice(1).join('=') || null;
const SELFTEST_UPDATE = ARGS.includes('--selftest-update');
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_HOTKEYS = {
    toggle: 'Control+Alt+X',
    settings: 'Control+Alt+S',
    nextProfile: 'Control+Alt+P',
    center: 'Control+Alt+C',
    up: 'Control+Alt+Up', down: 'Control+Alt+Down', left: 'Control+Alt+Left', right: 'Control+Alt+Right',
    autoColor: 'Control+Alt+A', checklist: 'Control+Alt+O', checkNext: 'Control+Alt+N'
};

let cfgPath, cfg, overlay = null, settingsWin = null, tray = null, visible = true;
let autoHidden = { holster: false, ads: false, wl: false };
let lastSlot = null;
const DEFAULT_AUTO = { enabled: true, onlyRoblox: true, holsterHide: true, adsHide: false, adsMode: 'hold', showToast: true, slots: {}, labels: {} };
const DEFAULT_WL = () => ({ enabled: false, apps: [
    { id: 'roblox', name: 'Roblox', match: 'Roblox', on: true },
    { id: 'minecraft', name: 'Minecraft', match: 'Minecraft', on: false },
    { id: 'fortnite', name: 'Fortnite', match: 'Fortnite', on: false },
    { id: 'valorant', name: 'VALORANT', match: 'VALORANT', on: false },
    { id: 'cs2', name: 'Counter-Strike 2', match: 'Counter-Strike', on: false },
    { id: 'rust', name: 'Rust', match: 'Rust', on: false }
] });
const CHECK_PRESETS = {
    debut: { name: 'Début de partie', items: ['Trouver une arme de mêlée', 'Trouver un sac à dos', "Avoir 100 d'énergie et 100 d'hydratation en réserve", '3 bandages ou plus', 'Une arme à feu + 2 chargeurs', 'Repérer la zone de loot la plus proche'] },
    militaire: { name: 'Run militaire', items: ['Rejoindre une base militaire', 'Ouvrir les caisses vertes', 'Récupérer un Military MedKit', 'Trouver un viseur', 'Repartir sans se faire repérer', 'Mettre le loot en sécurité'] },
    boss: { name: 'Chasse au boss', items: ['Prendre 2 chargeurs de rechange', 'Booster de PV dans la barre rapide', "Rejoindre l'endroit du boss", 'Nettoyer les infectés autour', 'Tuer le boss', 'Fouiller le butin'] }
};
const DEFAULT_CHECK = () => ({ title: 'Objectifs', overlay: false, corner: 'tr', scale: 1, opacity: 0.85, hideDone: false, items: CHECK_PRESETS.debut.items.map(t => ({ id: uid(), text: t, done: false })) });

function defaultConfig() {
    return {
        version: 1,
        active: 0,
        profiles: core.PRESETS.map(p => ({ id: uid(), name: p.name, settings: core.withDefaults(p.s) })),
        autoSwitch: JSON.parse(JSON.stringify(DEFAULT_AUTO)),
        autoUpdate: true,
        autoColor: JSON.parse(JSON.stringify(ac.DEFAULTS)),
        whitelist: DEFAULT_WL(),
        checklist: DEFAULT_CHECK(),
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
        cfg.profiles.forEach(p => { p.settings = core.withDefaults(p.settings); if (!p.id) p.id = uid(); });
        cfg.autoSwitch = Object.assign(JSON.parse(JSON.stringify(DEFAULT_AUTO)), c.autoSwitch || {});
        if (typeof cfg.autoUpdate !== 'boolean') cfg.autoUpdate = true;
        normalizeExtras(c);
        cfg.active = Math.min(Math.max(0, cfg.active | 0), cfg.profiles.length - 1);
    } catch (e) { cfg = defaultConfig(); }
}
function normalizeExtras(c) {
    c = c || {};
    cfg.autoColor = Object.assign(JSON.parse(JSON.stringify(ac.DEFAULTS)), c.autoColor || {});
    if (!Array.isArray(cfg.autoColor.palette) || !cfg.autoColor.palette.length) cfg.autoColor.palette = ac.DEFAULT_PALETTE.slice();
    cfg.autoColor.interval = Math.max(100, Math.min(10000, +cfg.autoColor.interval || 400));
    cfg.autoColor.zone = Math.max(40, Math.min(600, +cfg.autoColor.zone || 140));
    const wl = DEFAULT_WL();
    cfg.whitelist = Object.assign(wl, c.whitelist || {});
    if (!Array.isArray(cfg.whitelist.apps)) cfg.whitelist.apps = DEFAULT_WL().apps;
    cfg.whitelist.apps = cfg.whitelist.apps.filter(a => a && a.match).map(a => ({ id: a.id || uid(), name: String(a.name || a.match), match: String(a.match), on: !!a.on }));
    cfg.checklist = Object.assign(DEFAULT_CHECK(), c.checklist || {});
    if (!Array.isArray(cfg.checklist.items)) cfg.checklist.items = [];
    cfg.checklist.items = cfg.checklist.items.filter(i => i && i.text).map(i => ({ id: i.id || uid(), text: String(i.text).slice(0, 120), done: !!i.done }));
}
let saveTimer = null;
function saveConfig() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { fs.mkdirSync(path.dirname(cfgPath), { recursive: true }); fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2)); } catch (e) {} }, 250);
}
const current = () => cfg.profiles[cfg.active].settings;
// Réglages réellement affichés (couleur automatique appliquée par-dessus le profil)
function effective() {
    const s = current(), a = cfg.autoColor;
    if (!a || !a.enabled || !acState.color) return s;
    const e = Object.assign({}, s, { color: acState.color, _fade: a.fade | 0 });
    if (a.outline) e.outlineColor = acState.outline;
    if (a.glow) e.glowColor = acState.color;
    return e;
}

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
    overlay.webContents.send('settings', effective());
    acGeometry();
    placeChecklist();
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
        if (shown()) overlay.showInactive();
    });
    // certains jeux repassent devant : on réaffirme le premier plan régulièrement
    setInterval(() => { if (overlay && shown()) { overlay.setAlwaysOnTop(true, 'screen-saver'); if (!overlay.isVisible()) overlay.showInactive(); } }, 2000);
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

const shown = () => visible && !autoHidden.holster && !autoHidden.ads && !autoHidden.wl;
function applyVisibility() {
    if (!overlay) return;
    if (shown()) { placeOverlay(); overlay.showInactive(); } else overlay.hide();
    acSync(); placeChecklist();
}
function setVisible(v) {
    visible = v;
    if (v) autoHidden = { holster: false, ads: false, wl: autoHidden.wl };
    applyVisibility();
    refreshTray();
    broadcast();
}
function setActive(i) {
    cfg.active = Math.min(Math.max(0, i), cfg.profiles.length - 1);
    placeOverlay(); saveConfig(); refreshTray(); broadcast();
}

// ---------- Changement d'arme automatique ----------
function onSlot(n) {
    const a = cfg.autoSwitch;
    autoHidden.holster = false; autoHidden.ads = false;
    lastSlot = n;
    const id = a.slots[String(n)];
    if (id === '__hide') { autoHidden.holster = true; applyVisibility(); broadcast(); return; }
    const idx = id ? cfg.profiles.findIndex(p => p.id === id) : -1;
    if (idx >= 0 && idx !== cfg.active) { cfg.active = idx; placeOverlay(); saveConfig(); refreshTray(); }
    applyVisibility(); broadcast();
}
function onHolster() {
    if (!cfg.autoSwitch.holsterHide) return;
    autoHidden.holster = !autoHidden.holster; autoHidden.ads = false;
    applyVisibility(); broadcast();
}
function onAds(down) {
    const a = cfg.autoSwitch; if (!a.adsHide) { if (autoHidden.ads) { autoHidden.ads = false; applyVisibility(); } return; }
    if (a.adsMode === 'toggle') { if (down) { autoHidden.ads = !autoHidden.ads; applyVisibility(); } }
    else if (autoHidden.ads !== down) { autoHidden.ads = down; applyVisibility(); }
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
    reg(h.nextProfile, () => setActive((cfg.active + 1) % cfg.profiles.length));
    reg(h.center, () => { const s = current(); s.offsetX = 0; s.offsetY = 0; placeOverlay(); saveConfig(); broadcast(); });
    reg(h.autoColor, () => toggleAutoColor());
    reg(h.checklist, () => { cfg.checklist.overlay = !cfg.checklist.overlay; saveConfig(); placeChecklist(); broadcast(); });
    reg(h.checkNext, () => checkNext());
    reg(h.up, () => nudge(0, -1)); reg(h.down, () => nudge(0, 1)); reg(h.left, () => nudge(-1, 0)); reg(h.right, () => nudge(1, 0));
    return fails;
}

function broadcast() {
    if (settingsWin) settingsWin.webContents.send('state', state());
}
function state() {
    return { cfg, visible, shown: shown(), autoHidden, lastSlot, hook: { started: ws.state.started, error: ws.state.error }, update: updater.status, installed: updater.isInstalled(), displays: screen.getAllDisplays().map((d, i) => ({ i, label: `Écran ${i + 1} – ${d.size.width}×${d.size.height}${d.id === screen.getPrimaryDisplay().id ? ' (principal)' : ''}` })), version: app.getVersion(), autoColor: acState, fgTitle: wlTitle, presets: Object.fromEntries(Object.entries(CHECK_PRESETS).map(([k, v]) => [k, v.name])) };
}

function trayIcon() {
    const p = path.join(__dirname, 'assets', 'tray.png');
    return nativeImage.createFromPath(p);
}
function refreshTray() {
    if (!tray) return;
    tray.setToolTip(`AR2 Crosshair – ${cfg.profiles[cfg.active].name}${visible ? '' : ' (masqué)'}`);
    tray.setContextMenu(Menu.buildFromTemplate([
        ...(updater.status.state === 'ready' ? [{ label: `Installer la mise à jour v${updater.status.version} et redémarrer`, click: () => updater.install() }, { type: 'separator' }] : updater.status.state === 'available' ? [{ label: `Télécharger la version v${updater.status.version}…`, click: () => updater.install() }, { type: 'separator' }] : []),
        { label: visible ? 'Masquer le crosshair' : 'Afficher le crosshair', accelerator: cfg.hotkeys.toggle, click: () => setVisible(!visible) },
        { label: 'Réglages…', accelerator: cfg.hotkeys.settings, click: () => createSettings() },
        { type: 'separator' },
        { label: 'Profil', submenu: cfg.profiles.map((p, i) => ({ label: p.name, type: 'radio', checked: i === cfg.active, click: () => setActive(i) })) },
        { label: 'Changement d\'arme automatique', type: 'checkbox', checked: !!cfg.autoSwitch.enabled, click: m => { cfg.autoSwitch.enabled = m.checked; autoHidden = { holster: false, ads: false, wl: autoHidden.wl }; applyVisibility(); saveConfig(); broadcast(); } },
        { label: 'Couleur automatique', type: 'checkbox', checked: !!cfg.autoColor.enabled, accelerator: cfg.hotkeys.autoColor, click: m => toggleAutoColor(m.checked) },
        { label: 'Liste blanche des applis', type: 'checkbox', checked: !!cfg.whitelist.enabled, click: m => { cfg.whitelist.enabled = m.checked; wlSchedule(); saveConfig(); broadcast(); } },
        { label: 'Afficher les objectifs', type: 'checkbox', checked: !!cfg.checklist.overlay, accelerator: cfg.hotkeys.checklist, click: m => { cfg.checklist.overlay = m.checked; saveConfig(); placeChecklist(); broadcast(); } },
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
        try { app.setLoginItemSettings({ openAtLogin: p.launchAtStartup, args: ['--hidden'] }); } catch (err) {}
    }
    if (typeof p.autoUpdate === 'boolean') { cfg.autoUpdate = p.autoUpdate; updater.schedule(cfg.autoUpdate); }
    if (p.autoSwitch) {
        const a = p.autoSwitch;
        if (a.slots) cfg.autoSwitch.slots = Object.assign({}, cfg.autoSwitch.slots, a.slots);
        if (a.labels) cfg.autoSwitch.labels = Object.assign({}, cfg.autoSwitch.labels || {}, a.labels);
        ['enabled', 'onlyRoblox', 'holsterHide', 'adsHide', 'showToast'].forEach(k => { if (typeof a[k] === 'boolean') cfg.autoSwitch[k] = a[k]; });
        if (a.adsMode === 'hold' || a.adsMode === 'toggle') cfg.autoSwitch.adsMode = a.adsMode;
        autoHidden = { holster: false, ads: false, wl: autoHidden.wl }; applyVisibility();
    }
    let fails = [];
    if (p.hotkeys) { cfg.hotkeys = Object.assign({}, cfg.hotkeys, p.hotkeys); fails = registerHotkeys(); }
    placeOverlay(); saveConfig(); refreshTray();
    return { ...state(), fails };
});
ipcMain.handle('profile', (e, { action, name, index, code }) => {
    if (action === 'add') { cfg.profiles.push({ id: uid(), name: name || `Profil ${cfg.profiles.length + 1}`, settings: core.withDefaults({ ...current() }) }); cfg.active = cfg.profiles.length - 1; }
    if (action === 'rename' && cfg.profiles[index]) cfg.profiles[index].name = name || cfg.profiles[index].name;
    if (action === 'delete' && cfg.profiles.length > 1 && cfg.profiles[index]) { cfg.profiles.splice(index, 1); cfg.active = Math.min(cfg.active, cfg.profiles.length - 1); }
    if (action === 'reset') { const d = defaultConfig(); cfg.profiles = d.profiles; cfg.active = 0; cfg.autoSwitch.slots = {}; }
    if (action === 'import') {
        const s = core.fromCode(code);
        cfg.profiles.push({ id: uid(), name: name || 'Profil importé', settings: core.withDefaults(s) });
        cfg.active = cfg.profiles.length - 1;
    }
    placeOverlay(); saveConfig(); refreshTray();
    return state();
});
ipcMain.handle('set-visible', (e, v) => { setVisible(!!v); return state(); });
ipcMain.handle('update-check', async () => { await updater.check(); return state(); });
ipcMain.handle('update-install', () => updater.install());
ipcMain.handle('open-url', (e, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); });

// ---------- Couleur automatique ----------
// Une fenêtre cachée reçoit le flux de l'écran et analyse seulement la zone autour du crosshair
// (le crosshair lui-même est exclu de l'analyse). Rien n'est lu dans le jeu.
const acState = { color: null, outline: null, bg: null, score: 0, method: null, error: null, samples: 0, rate: 0, kept: false, active: false };
let sampler = null, samplerReady = false, acSourceCache = {}, thumbTimer = null, acRateT0 = Date.now(), acRateN = 0, acLastBroadcast = 0;
const acActive = () => !!(cfg && cfg.autoColor && cfg.autoColor.enabled && overlay && shown());
function acZone() {
    const s = current(), a = cfg.autoColor;
    const ex = Math.max(64, core.extent(s) * 2) / 2 + 2;           // demi-taille de la fenêtre du crosshair (exclue)
    const zone = Math.max(a.zone, ex * 2 + 24);
    return { zone, ex };
}
function acGeom() {
    const d = targetDisplay(), s = current(), b = d.bounds, { zone, ex } = acZone();
    const cx = (b.width / 2 + (s.offsetX || 0)) / b.width, cy = (b.height / 2 + (s.offsetY || 0)) / b.height;
    return { cx, cy, zw: zone / b.width, zh: zone / b.height, exu: ex / zone, interval: cfg.autoColor.interval };
}
function acGeometry() { if (sampler && samplerReady && acActive()) sampler.webContents.send('sampler-geom', acGeom()); }
async function acSource() {
    const d = targetDisplay();
    if (acSourceCache[d.id]) return acSourceCache[d.id];
    const list = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
    const src = list.find(x => String(x.display_id) === String(d.id)) || list[cfg.display] || list[0];
    if (src) acSourceCache[d.id] = src.id;
    return src ? src.id : null;
}
function createSampler() {
    if (sampler) return;
    samplerReady = false;
    sampler = new BrowserWindow({ width: 64, height: 64, show: false, skipTaskbar: true, focusable: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
    sampler.loadFile(path.join(__dirname, 'sampler.html'));
    sampler.webContents.on('did-finish-load', () => { samplerReady = true; acSync(); });
    sampler.on('closed', () => { sampler = null; samplerReady = false; });
}
let acSyncing = false;
async function acSync() {
    if (!cfg) return;
    if (!acActive()) {
        acState.active = false;
        if (sampler && samplerReady) sampler.webContents.send('sampler-config', { enabled: false });
        stopThumb();
        return;
    }
    acState.active = true;
    if (acState.method === 'thumbnail') return startThumb();
    if (!sampler) return createSampler();
    if (!samplerReady || acSyncing) return;
    acSyncing = true;
    try {
        const id = await acSource();
        const d = targetDisplay();
        if (!id) throw new Error('aucun écran capturable');
        const fps = Math.max(1, Math.min(30, Math.ceil(1000 / cfg.autoColor.interval)));
        sampler.webContents.send('sampler-config', Object.assign({ enabled: true, sourceId: id, fps, w: Math.round(d.size.width * d.scaleFactor), h: Math.round(d.size.height * d.scaleFactor) }, acGeom()));
    } catch (e) { acState.error = String(e.message || e); startThumb(); }
    acSyncing = false;
}
// Solution de secours : capture d'écran réduite (plus lente)
function stopThumb() { clearTimeout(thumbTimer); thumbTimer = null; }
function startThumb() {
    acState.method = 'thumbnail';
    if (thumbTimer) return;
    const loop = async () => {
        if (!acActive()) { thumbTimer = null; return; }
        try {
            const d = targetDisplay(), W = Math.round(d.size.width / 2), H = Math.round(d.size.height / 2);
            const list = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: W, height: H } });
            const src = list.find(x => String(x.display_id) === String(d.id)) || list[0];
            if (src && !src.thumbnail.isEmpty()) {
                const g = acGeom(), sz = src.thumbnail.getSize();
                const rw = Math.max(4, Math.round(g.zw * sz.width)), rh = Math.max(4, Math.round(g.zh * sz.height));
                const rect = { x: Math.max(0, Math.round(g.cx * sz.width - rw / 2)), y: Math.max(0, Math.round(g.cy * sz.height - rh / 2)), width: rw, height: rh };
                const img = src.thumbnail.crop(rect).resize({ width: 48, height: 48 });
                const bmp = img.toBitmap(), N = 48;
                const a = ac.analyze(bmp, N * N, i => { const u = ((i % N) + .5) / N - .5, v = (Math.floor(i / N) + .5) / N - .5; return Math.abs(u) < g.exu && Math.abs(v) < g.exu; }, 'bgra');
                if (a) onSample(a, 'thumbnail');
            }
        } catch (e) { acState.error = String(e.message || e); }
        thumbTimer = setTimeout(loop, Math.max(300, cfg.autoColor.interval));
    };
    thumbTimer = setTimeout(loop, 10);
}
function onSample(a, method) {
    if (!acActive()) return;
    acState.samples++; acRateN++; acState.method = method || acState.method;
    const now = Date.now();
    if (now - acRateT0 >= 2000) { acState.rate = Math.round(acRateN / ((now - acRateT0) / 1000) * 10) / 10; acRateN = 0; acRateT0 = now; }
    const r = ac.pick(a, cfg.autoColor, acState.color);
    acState.bg = r.bg; acState.score = r.score; acState.kept = r.kept; acState.error = null;
    if (r.color !== acState.color || r.outline !== acState.outline) {
        acState.color = r.color; acState.outline = r.outline;
        if (overlay) overlay.webContents.send('settings', effective());
    }
    if (now - acLastBroadcast > 700) { acLastBroadcast = now; broadcast(); }
}
ipcMain.on('sampler-sample', (e, a) => { if (a) onSample(a, 'stream'); });
ipcMain.on('sampler-error', (e, msg) => { acState.error = String(msg || 'erreur de capture'); startThumb(); broadcast(); });
function toggleAutoColor(v) {
    cfg.autoColor.enabled = typeof v === 'boolean' ? v : !cfg.autoColor.enabled;
    if (!cfg.autoColor.enabled) { acState.color = null; acState.outline = null; }
    saveConfig(); acSync(); placeOverlay(); refreshTray(); broadcast();
}

// ---------- Liste blanche (le crosshair s'affiche seulement dans les applis cochées) ----------
let wlTimer = null, wlTitle = '';
function wlAllowed(title) {
    const w = cfg.whitelist;
    if (!w || !w.enabled) return true;
    if (title === null || title === undefined) return true; // impossible de savoir (hors Windows) : on n'empêche rien
    const t = String(title).toLowerCase();
    if (/ar2 crosshair/.test(t)) return true;                 // nos propres fenêtres
    return w.apps.some(a => a.on && a.match && t.includes(a.match.toLowerCase()));
}
function wlCheck() {
    const t = ws.foregroundTitle();
    wlTitle = t === null ? null : t;
    const hide = !wlAllowed(t);
    if (hide !== autoHidden.wl) { autoHidden.wl = hide; applyVisibility(); broadcast(); }
}
function wlSchedule() {
    clearInterval(wlTimer); wlTimer = null;
    if (cfg.whitelist && cfg.whitelist.enabled) { wlTimer = setInterval(wlCheck, 600); wlCheck(); }
    else if (autoHidden.wl) { autoHidden.wl = false; applyVisibility(); }
}

// ---------- Objectifs (liste à cocher affichée par-dessus le jeu) ----------
let checkWin = null;
function checklistShown() { return !!(cfg.checklist && cfg.checklist.overlay && visible && !autoHidden.wl); }
function createChecklist() {
    if (checkWin) return;
    checkWin = new BrowserWindow({
        width: 300, height: 120, frame: false, transparent: true, resizable: false, movable: false,
        alwaysOnTop: true, skipTaskbar: true, focusable: false, hasShadow: false, show: false, backgroundColor: '#00000000',
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    });
    checkWin.setIgnoreMouseEvents(true, { forward: false });
    checkWin.setAlwaysOnTop(true, 'screen-saver');
    checkWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    checkWin.loadFile(path.join(__dirname, 'checklist.html'));
    checkWin.webContents.on('did-finish-load', placeChecklist);
    checkWin.on('closed', () => { checkWin = null; });
}
function placeChecklist() {
    if (!cfg) return;
    if (!checklistShown()) { if (checkWin) checkWin.hide(); return; }
    if (!checkWin) return createChecklist();
    const c = cfg.checklist, k = Math.max(0.6, Math.min(2, +c.scale || 1));
    const items = c.items.filter(i => !(c.hideDone && i.done));
    const w = Math.round(290 * k), h = Math.round((44 + Math.max(1, items.length) * 26 + 10) * k);
    const wa = targetDisplay().workArea, m = 16;
    const x = /l$/.test(c.corner) ? wa.x + m : wa.x + wa.width - w - m;
    const y = /^b/.test(c.corner) ? wa.y + wa.height - h - m : wa.y + m;
    checkWin.setBounds({ x, y, width: w, height: h });
    checkWin.webContents.send('checklist', c);
    if (!checkWin.isVisible()) checkWin.showInactive();
    checkWin.setAlwaysOnTop(true, 'screen-saver');
}
function checkNext() {
    const it = cfg.checklist.items.find(i => !i.done);
    if (it) it.done = true;
    saveConfig(); placeChecklist(); broadcast();
}

// ---------- Sauvegarde : import / export de TOUT ----------
const BACKUP_SECTIONS = ['profiles', 'autoSwitch', 'autoColor', 'whitelist', 'checklist', 'hotkeys', 'general'];
function buildBackup(sections) {
    const sec = (sections && sections.length ? sections : BACKUP_SECTIONS);
    const d = {};
    if (sec.includes('profiles')) { d.profiles = cfg.profiles.map(p => ({ id: p.id, name: p.name, settings: p.settings, code: core.toCode(p.settings) })); d.active = cfg.active; }
    if (sec.includes('autoSwitch')) d.autoSwitch = cfg.autoSwitch;
    if (sec.includes('autoColor')) d.autoColor = cfg.autoColor;
    if (sec.includes('whitelist')) d.whitelist = cfg.whitelist;
    if (sec.includes('checklist')) d.checklist = cfg.checklist;
    if (sec.includes('hotkeys')) d.hotkeys = cfg.hotkeys;
    if (sec.includes('general')) d.general = { display: cfg.display, startHidden: cfg.startHidden, launchAtStartup: cfg.launchAtStartup, moveStep: cfg.moveStep, autoUpdate: cfg.autoUpdate };
    return { app: 'ar2-crosshair', format: 1, version: app.getVersion(), exported: new Date().toISOString(), sections: Object.keys(d).filter(k => k !== 'active'), data: JSON.parse(JSON.stringify(d)) };
}
function parseBackup(text) {
    let t = String(text || '').trim();
    if (/^AR2CFG-/.test(t)) t = Buffer.from(t.slice(7), 'base64').toString('utf8');
    if (/^AR2X-/.test(t)) return { app: 'ar2-crosshair', format: 1, data: { profiles: [{ name: 'Profil importé', settings: core.fromCode(t) }] } };
    const o = JSON.parse(t);
    if (o && o.app === 'ar2-armory') {
        // sauvegarde du site AR2 Armory : on récupère le crosshair du site
        const raw = o.data && o.data.ar2_crosshair_web;
        const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!s) throw new Error('aucun crosshair dans cette sauvegarde du site');
        return { app: 'ar2-crosshair', format: 1, data: { profiles: [{ name: 'Crosshair du site', settings: s }] } };
    }
    if (!o || o.app !== 'ar2-crosshair' || !o.data) throw new Error("ce fichier n'est pas une sauvegarde AR2 Crosshair");
    return o;
}
function applyBackup(o, mode, sections) {
    const d = o.data, sec = sections && sections.length ? sections : BACKUP_SECTIONS, replace = mode === 'replace', done = [];
    const idMap = {};
    if (sec.includes('profiles') && Array.isArray(d.profiles) && d.profiles.length) {
        const list = d.profiles.map(p => { const id = (replace && p.id) ? p.id : uid(); if (p.id) idMap[p.id] = id; return { id, name: String(p.name || 'Profil').slice(0, 40), settings: core.withDefaults(p.settings || (p.code ? core.fromCode(p.code) : {})) }; });
        if (replace) { cfg.profiles = list; cfg.active = Math.min(Math.max(0, d.active | 0), list.length - 1); }
        else { cfg.profiles.push(...list); cfg.active = cfg.profiles.length - list.length; }
        done.push(`${list.length} profil(s)`);
    }
    if (sec.includes('autoSwitch') && d.autoSwitch) {
        const a = JSON.parse(JSON.stringify(d.autoSwitch));
        const slots = {}; Object.entries(a.slots || {}).forEach(([k, v]) => { slots[k] = v === '__hide' ? v : (idMap[v] || (cfg.profiles.some(p => p.id === v) ? v : null)); });
        a.slots = slots;
        cfg.autoSwitch = Object.assign(JSON.parse(JSON.stringify(DEFAULT_AUTO)), replace ? a : Object.assign({}, cfg.autoSwitch, a, { slots: Object.assign({}, cfg.autoSwitch.slots, slots), labels: Object.assign({}, cfg.autoSwitch.labels, a.labels || {}) }));
        done.push("changement d'arme");
    }
    const extras = {};
    if (sec.includes('autoColor') && d.autoColor) { extras.autoColor = d.autoColor; done.push('couleur auto'); }
    if (sec.includes('whitelist') && d.whitelist) {
        if (replace) extras.whitelist = d.whitelist;
        else { const w = JSON.parse(JSON.stringify(cfg.whitelist)); (d.whitelist.apps || []).forEach(x => { const e = w.apps.find(y => y.match.toLowerCase() === String(x.match || '').toLowerCase()); if (e) e.on = !!x.on; else w.apps.push(x); }); if (typeof d.whitelist.enabled === 'boolean') w.enabled = d.whitelist.enabled; extras.whitelist = w; }
        done.push('liste blanche');
    }
    if (sec.includes('checklist') && d.checklist) {
        if (replace) extras.checklist = d.checklist;
        else { const c = JSON.parse(JSON.stringify(cfg.checklist)); (d.checklist.items || []).forEach(x => { if (x && x.text && !c.items.some(y => y.text === x.text)) c.items.push({ id: uid(), text: x.text, done: !!x.done }); }); extras.checklist = c; }
        done.push('objectifs');
    }
    if (Object.keys(extras).length) normalizeExtras(Object.assign({ autoColor: cfg.autoColor, whitelist: cfg.whitelist, checklist: cfg.checklist }, extras));
    if (sec.includes('hotkeys') && d.hotkeys) { cfg.hotkeys = Object.assign({ ...DEFAULT_HOTKEYS }, replace ? {} : cfg.hotkeys, d.hotkeys); done.push('raccourcis'); }
    if (sec.includes('general') && d.general) {
        const g = d.general;
        if (typeof g.display === 'number') cfg.display = g.display;
        if (typeof g.startHidden === 'boolean') cfg.startHidden = g.startHidden;
        if (typeof g.moveStep === 'number') cfg.moveStep = Math.max(1, Math.min(50, g.moveStep));
        if (typeof g.autoUpdate === 'boolean') { cfg.autoUpdate = g.autoUpdate; updater.schedule(cfg.autoUpdate); }
        if (typeof g.launchAtStartup === 'boolean') { cfg.launchAtStartup = g.launchAtStartup; try { app.setLoginItemSettings({ openAtLogin: g.launchAtStartup, args: ['--hidden'] }); } catch (err) {} }
        done.push('réglages généraux');
    }
    const fails = registerHotkeys();
    autoHidden = { holster: false, ads: false, wl: false };
    wlSchedule(); acSync(); placeOverlay(); saveConfig(); refreshTray();
    return { done, fails };
}
ipcMain.handle('backup-export', (e, { sections, as } = {}) => {
    const b = buildBackup(sections);
    return as === 'code' ? 'AR2CFG-' + Buffer.from(JSON.stringify(b), 'utf8').toString('base64') : JSON.stringify(b, null, 2);
});
ipcMain.handle('backup-save', async (e, { sections } = {}) => {
    const r = await dialog.showSaveDialog(settingsWin, { title: 'Exporter la sauvegarde AR2 Crosshair', defaultPath: `ar2-crosshair-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: 'Sauvegarde AR2 Crosshair', extensions: ['json'] }] });
    if (r.canceled || !r.filePath) return { ok: false };
    fs.writeFileSync(r.filePath, JSON.stringify(buildBackup(sections), null, 2));
    return { ok: true, file: r.filePath };
});
ipcMain.handle('backup-open', async () => {
    const r = await dialog.showOpenDialog(settingsWin, { title: 'Importer une sauvegarde', properties: ['openFile'], filters: [{ name: 'Sauvegarde JSON', extensions: ['json', 'txt'] }] });
    if (r.canceled || !r.filePaths[0]) return null;
    return fs.readFileSync(r.filePaths[0], 'utf8');
});
ipcMain.handle('backup-inspect', (e, text) => { const o = parseBackup(text); return { sections: Object.keys(o.data).filter(k => k !== 'active'), version: o.version || null, exported: o.exported || null }; });
ipcMain.handle('backup-import', (e, { text, mode, sections }) => { const r = applyBackup(parseBackup(text), mode, sections); return { ...state(), ...r }; });

// ---------- IPC des nouvelles fonctions ----------
ipcMain.handle('set-extras', (e, p) => {
    p = p || {};
    if (p.autoColor) {
        const was = cfg.autoColor.enabled;
        normalizeExtras({ autoColor: Object.assign({}, cfg.autoColor, p.autoColor), whitelist: cfg.whitelist, checklist: cfg.checklist });
        if (!cfg.autoColor.enabled) { acState.color = null; acState.outline = null; }
        if (was !== cfg.autoColor.enabled || p.autoColor.interval) { if (sampler && samplerReady) sampler.webContents.send('sampler-config', { enabled: false }); }
        acSync(); placeOverlay();
    }
    if (p.whitelist) { normalizeExtras({ autoColor: cfg.autoColor, whitelist: Object.assign({}, cfg.whitelist, p.whitelist), checklist: cfg.checklist }); wlSchedule(); }
    if (p.checklist) { normalizeExtras({ autoColor: cfg.autoColor, whitelist: cfg.whitelist, checklist: Object.assign({}, cfg.checklist, p.checklist) }); placeChecklist(); }
    saveConfig(); refreshTray();
    return state();
});
ipcMain.handle('checklist-preset', (e, key) => {
    const p = CHECK_PRESETS[key]; if (!p) return state();
    cfg.checklist.items = p.items.map(t => ({ id: uid(), text: t, done: false })); cfg.checklist.title = p.name;
    saveConfig(); placeChecklist(); return state();
});
ipcMain.handle('wl-capture', async (e, delay) => {
    await new Promise(r => setTimeout(r, Math.max(0, Math.min(10000, delay | 0))));
    const t = ws.foregroundTitle();
    return t === null ? { ok: false, error: 'Détection de la fenêtre active disponible seulement sous Windows.' } : { ok: true, title: t };
});

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
        updater.init({ onChange: () => { refreshTray(); broadcast(); } });
        if (ws.loadForeground) ws.loadForeground();
        wlSchedule(); acSync(); placeChecklist();
        ws.start({ config: () => SELFTEST ? Object.assign({}, cfg.autoSwitch, { onlyRoblox: false }) : cfg.autoSwitch, slot: onSlot, holster: onHolster, ads: onAds });
        if (SELFTEST) return runSelftest();
        updater.schedule(cfg.autoUpdate);
        if (!process.argv.includes('--hidden')) createSettings();
        screen.on('display-metrics-changed', () => { acSourceCache = {}; placeOverlay(); acSync(); });
        screen.on('display-added', placeOverlay);
        screen.on('display-removed', () => { cfg.display = 0; placeOverlay(); });
    });
    app.on('window-all-closed', e => { /* reste dans la barre des tâches (zone de notification) */ });
    app.on('will-quit', () => { globalShortcut.unregisterAll(); ws.stop(); stopThumb(); clearInterval(wlTimer); });
}

// ---------- Auto-test (utilisé par GitHub Actions) ----------
async function runSelftest() {
    const out = { version: app.getVersion(), platform: process.platform, installed: updater.isInstalled(), mode: updater.status.mode, steps: [] };
    const write = () => { try { fs.writeFileSync(SELFTEST, JSON.stringify(out, null, 2)); } catch (e) {} };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    try {
        await wait(1500);
        out.overlay = { created: !!overlay, visible: overlay ? overlay.isVisible() : false, bounds: overlay ? overlay.getBounds() : null, alwaysOnTop: overlay ? overlay.isAlwaysOnTop() : false };
        out.hook = { started: ws.state.started, error: ws.state.error };
        out.foreground = { title: ws.foregroundTitle() };
        // test du changement d'arme : emplacement 2 -> profil 4, V -> masqué, 1 -> profil 0
        cfg.autoSwitch.enabled = true; cfg.autoSwitch.holsterHide = true;
        cfg.autoSwitch.slots = { '1': cfg.profiles[0].id, '2': cfg.profiles[4].id };
        cfg.active = 0;
        ws.tap('2'); await wait(700);
        out.steps.push({ key: '2', active: cfg.active, expected: 4, shown: shown() });
        ws.tap('V'); await wait(700);
        out.steps.push({ key: 'V', shown: shown(), expectedShown: false, overlayVisible: overlay.isVisible() });
        ws.tap('1'); await wait(700);
        out.steps.push({ key: '1', active: cfg.active, expected: 0, shown: shown(), overlayVisible: overlay.isVisible() });
        out.switchOk = out.steps[0].active === 4 && out.steps[1].shown === false && out.steps[2].active === 0 && out.steps[2].shown === true;
        write();
        // couleur automatique : logique + capture réelle de l'écran
        const green = ac.analyze(new Uint8Array(Array.from({ length: 400 }, (_, i) => [40, 150, 40, 255][i % 4])), 100);
        out.autoColorLogic = ac.pick(green, { mode: 'contrast' }).color;
        out.autoColorLogicOk = ac.deltaE(ac.hexToRgb(out.autoColorLogic), [40, 150, 40]) > 50;
        cfg.autoColor.enabled = true; cfg.autoColor.interval = 250; acSync();
        await wait(5000);
        out.autoColor = { method: acState.method, samples: acState.samples, color: acState.color, bg: acState.bg, error: acState.error };
        out.autoColorOk = acState.samples > 0;
        cfg.autoColor.enabled = false; acSync();
        // liste blanche, objectifs, sauvegarde
        out.whitelist = { allowedRoblox: wlAllowed('Roblox'), allowedNotepad: (cfg.whitelist.enabled = true, wlAllowed('Bloc-notes')) };
        cfg.whitelist.enabled = false;
        const nb = cfg.profiles.length; const bk = JSON.stringify(buildBackup());
        applyBackup(parseBackup(bk), 'merge');
        out.backupOk = cfg.profiles.length === nb * 2 && applyBackup(parseBackup(bk), 'replace') && cfg.profiles.length === nb;
        cfg.checklist.overlay = true; placeChecklist(); await wait(1500);
        out.checklist = { created: !!checkWin, visible: checkWin ? checkWin.isVisible() : false, items: cfg.checklist.items.length };
        checkNext(); out.checklist.doneAfterNext = cfg.checklist.items.filter(i => i.done).length;
        write();
        // mises à jour
        await updater.check();
        const t0 = Date.now();
        while (['checking', 'downloading'].includes(updater.status.state) && Date.now() - t0 < 240000) await wait(1000);
        out.update = updater.status;
        write();
        if (SELFTEST_UPDATE && updater.status.state === 'ready') { out.installing = true; write(); updater.autoUpdater.quitAndInstall(true, false); return; }
    } catch (e) { out.error = String(e.stack || e); }
    write();
    app.exit(0);
}
