// AR2 Crosshair – processus principal (Electron)
// Affiche un crosshair dans une petite fenêtre transparente, toujours au premier plan
// et traversée par les clics. Rien n'est injecté dans le jeu : c'est une simple fenêtre Windows.
const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, nativeImage, shell, desktopCapturer, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const core = require('./crosshair-core.js');
const profileManager = require('./profile-manager.js');
const configStore = require('./config-store.js');
const updater = require('./updater.js');
const ws = require('./weaponswitch.js');
const ac = require('./autocolor.js');
const hud = require('./hud.js');

const ARGS = process.argv.slice(1);
const SELFTEST = (ARGS.find(a => a.startsWith('--selftest=')) || '').split('=').slice(1).join('=') || null;
const SELFTEST_UPDATE = ARGS.includes('--selftest-update');
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_HOTKEYS = {
    toggle: 'Control+Alt+X',
    settings: 'Control+Alt+S',
    sound: 'Control+Alt+Q',
    nextProfile: 'Control+Alt+P',
    center: 'Control+Alt+C',
    up: 'Control+Alt+Up', down: 'Control+Alt+Down', left: 'Control+Alt+Left', right: 'Control+Alt+Right',
    autoColor: 'Control+Alt+A', checklist: 'Control+Alt+O', checkNext: 'Control+Alt+N',
    timer: 'Control+Alt+T', timer1: 'Control+Alt+F1', timer2: 'Control+Alt+F2', timer3: 'Control+Alt+F3', timerStop: 'Control+Alt+R',
    spotlight: 'Control+Alt+W', wiki: 'Control+Alt+Shift+W',
    range: 'Control+Alt+D', rangeZoom: 'Control+Alt+Shift+D',
    compass: 'Control+Alt+K', compassNext: 'Control+Alt+J', compassPrev: 'Control+Alt+Shift+J',
    map: 'Control+Alt+M', mapWorld: 'Control+Alt+Shift+M',
    themeNext: ''
};

let cfgPath, cfg, configLoadError = null, configSaveErrorShown = false, overlay = null, soundOverlay = null, settingsWin = null, tray = null, visible = true;
let autoHidden = { holster: false, ads: false, wl: false };
let lastSlot = null, hkFails = [];
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
const DEFAULT_CHECK = () => ({ title: 'Objectifs', overlay: false, corner: 'tr', x: null, y: null, scale: 1, opacity: 0.85, hideDone: false, items: CHECK_PRESETS.debut.items.map(t => ({ id: uid(), text: t, done: false })) });

const DEFAULT_TIMER = () => ({ overlay: true, corner: 'tl', scale: 1, opacity: 0.9, sound: true, volume: 0.5, warn: 30, warnBeep: false, keepDone: 45,
    presets: [{ id: 'caisses', name: 'Caisses militaires', min: 15 }, { id: 'helico', name: 'Hélico crashé', min: 10 }, { id: 'boost', name: 'Boost', min: 5 }], running: [] });

function defaultConfig() {
    return {
        version: 1,
        active: 0,
        profiles: core.PRESETS.map(p => ({ id: uid(), name: p.name, settings: core.withDefaults(p.s) })),
        sound: { enabled: false, sensitivity: 1.2 },
        autoSwitch: JSON.parse(JSON.stringify(DEFAULT_AUTO)),
        autoUpdate: true,
        autoColor: JSON.parse(JSON.stringify(ac.DEFAULTS)),
        whitelist: DEFAULT_WL(),
        checklist: DEFAULT_CHECK(),
        timer: DEFAULT_TIMER(),
        display: 0,
        hotkeys: { ...DEFAULT_HOTKEYS },
        startHidden: false,
        launchAtStartup: false,
        moveStep: 1,
        onboarded: false
    };
}
function loadConfig() {
    cfgPath = path.join(app.getPath('userData'), 'config.json');
    let c;
    try {
        c = configStore.readJson(cfgPath);
    } catch (e) {
        if (e.code === 'ENOENT') { cfg = defaultConfig(); return; }
        configLoadError = e;
        cfg = defaultConfig();
        console.error('Impossible de lire la configuration AR2; le fichier original est conservé.', e);
        dialog.showErrorBox('Configuration non chargée', `Le fichier de réglages n'a pas pu être lu et n'a pas été modifié :\n${cfgPath}\n\n${e.message}\n\nLes changements de cette session ne pourront pas être enregistrés.`);
        return;
    }
    try {
        if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('Le fichier de configuration doit contenir un objet JSON.');
        const d = defaultConfig();
        cfg = Object.assign(d, c);
        cfg.hotkeys = Object.assign({ ...DEFAULT_HOTKEYS }, c.hotkeys || {});
        // v1.5 : Ctrl+Alt+W ouvre maintenant le wiki instantané, le wiki complet passe sur Ctrl+Alt+Maj+W
        if (c.hotkeys && !('spotlight' in c.hotkeys) && c.hotkeys.wiki === 'Control+Alt+W') { cfg.hotkeys.wiki = DEFAULT_HOTKEYS.wiki; cfg.hotkeys.spotlight = DEFAULT_HOTKEYS.spotlight; }
        cfg.profiles = profileManager.normalizeLoaded(cfg.profiles, uid) || d.profiles;
        cfg.autoSwitch = Object.assign(JSON.parse(JSON.stringify(DEFAULT_AUTO)), c.autoSwitch || {});
        if (typeof cfg.autoUpdate !== 'boolean') cfg.autoUpdate = true;
        if (typeof c.onboarded !== 'boolean') cfg.onboarded = true; // déjà installé avant la v1.7 : pas d'assistant imposé
        normalizeExtras(c);
        cfg.active = Math.min(Math.max(0, cfg.active | 0), cfg.profiles.length - 1);
    } catch (e) {
        configLoadError = e;
        cfg = defaultConfig();
        console.error('La configuration AR2 est invalide; le fichier original est conservé.', e);
        dialog.showErrorBox('Configuration non chargée', `Le fichier de réglages est invalide et n'a pas été modifié :\n${cfgPath}\n\n${e.message}\n\nLes changements de cette session ne pourront pas être enregistrés.`);
    }
}
function normalizeExtras(c) {
    c = c || {};
    cfg.sound = Object.assign({ enabled: false, sensitivity: 1.2 }, c.sound || cfg.sound || {});
    cfg.sound.enabled = !!cfg.sound.enabled;
    cfg.sound.sensitivity = Math.max(0.4, Math.min(3, +cfg.sound.sensitivity || 1.2));
    cfg.autoColor = Object.assign(JSON.parse(JSON.stringify(ac.DEFAULTS)), c.autoColor || {});
    const palette = ac.normalizePalette(cfg.autoColor.palette);
    cfg.autoColor.palette = palette.length ? Array.from(new Set(palette)) : ac.DEFAULT_PALETTE.slice();
    if (!['contrast', 'opposite', 'bw'].includes(cfg.autoColor.mode)) cfg.autoColor.mode = ac.DEFAULTS.mode;
    cfg.autoColor.interval = Math.max(100, Math.min(10000, +cfg.autoColor.interval || 400));
    cfg.autoColor.zone = Math.max(40, Math.min(600, +cfg.autoColor.zone || 140));
    const wl = DEFAULT_WL();
    cfg.whitelist = Object.assign(wl, c.whitelist || {});
    if (!Array.isArray(cfg.whitelist.apps)) cfg.whitelist.apps = DEFAULT_WL().apps;
    cfg.whitelist.apps = cfg.whitelist.apps.filter(a => a && a.match).map(a => ({ id: a.id || uid(), name: String(a.name || a.match), match: String(a.match), on: !!a.on }));
    cfg.checklist = Object.assign(DEFAULT_CHECK(), c.checklist || {});
    if (!Array.isArray(cfg.checklist.items)) cfg.checklist.items = [];
    cfg.checklist.items = cfg.checklist.items.filter(i => i && i.text).map(i => ({ id: i.id || uid(), text: String(i.text).slice(0, 120), done: !!i.done }));
    normalizeTimer(c.timer || cfg.timer);
    hud.normalize(cfg, c);
}
function normalizeTimer(t) {
    const d = DEFAULT_TIMER(), o = Object.assign(d, t || {});
    o.scale = Math.max(0.6, Math.min(2, +o.scale || 1)); o.opacity = Math.max(0.2, Math.min(1, +o.opacity || 0.9));
    o.volume = Math.max(0, Math.min(1, isFinite(+o.volume) ? +o.volume : 0.5)); o.warn = Math.max(0, Math.min(600, o.warn | 0)); o.keepDone = Math.max(5, Math.min(600, o.keepDone | 0 || 45));
    if (!['tl', 'tr', 'bl', 'br'].includes(o.corner)) o.corner = 'tl';
    if (!Array.isArray(o.presets) || !o.presets.length) o.presets = DEFAULT_TIMER().presets;
    o.presets = o.presets.slice(0, 3).map((p, i) => ({ id: p.id || 'p' + i, name: String(p.name || 'Minuteur ' + (i + 1)).slice(0, 30), min: Math.max(0.1, Math.min(240, +p.min || 5)) }));
    while (o.presets.length < 3) o.presets.push({ id: 'p' + o.presets.length + uid(), name: 'Minuteur ' + (o.presets.length + 1), min: 5 });
    o.running = (Array.isArray(o.running) ? o.running : []).filter(r => r && r.end > Date.now() - o.keepDone * 1000).slice(0, 8)
        .map(r => ({ id: r.id || uid(), preset: r.preset || null, name: String(r.name || 'Minuteur').slice(0, 30), dur: +r.dur || 60, end: +r.end, doneAt: r.doneAt || null, warned: !!r.warned }));
    cfg.timer = o;
}
let saveTimer = null;
function persistConfig() {
    if (!cfgPath || !cfg || configLoadError) return;
    try {
        configStore.writeJsonAtomically(cfgPath, cfg);
    } catch (e) {
        console.error('Impossible d’enregistrer la configuration AR2.', e);
        if (!configSaveErrorShown) {
            configSaveErrorShown = true;
            dialog.showErrorBox('Échec de la sauvegarde', `Les réglages n'ont pas pu être enregistrés :\n${cfgPath}\n\n${e.message}${e.configTempPath ? `\n\nFichier temporaire conservé : ${e.configTempPath}` : ''}`);
        }
    }
}
function saveConfig() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; persistConfig(); }, 250);
}
const current = () => cfg.profiles[cfg.active].settings;
// Réglages réellement affichés (couleur automatique appliquée par-dessus le profil)
function effective() {
    const s = current(), a = cfg.autoColor;
    const e = Object.assign({}, s, { _sound: cfg.sound });
    if (!a || !a.enabled || !acState.color) return e;
    e.color = acState.color;
    e._fade = a.fade | 0;
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
    placeSoundOverlay();
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

function placeSoundOverlay() {
    if (!soundOverlay) return;
    const d = targetDisplay();
    const s = current();
    const size = 200;
    const b = d.bounds;
    const x = Math.round(b.x + b.width / 2 + (s.offsetX || 0) - size / 2);
    const y = Math.round(b.y + b.height / 2 + (s.offsetY || 0) - size / 2);
    soundOverlay.setBounds({ x, y, width: size, height: size });
    soundOverlay.webContents.send('settings', effective());
}

function createSoundOverlay() {
    if (soundOverlay) return;
    soundOverlay = new BrowserWindow({
        width: 200, height: 200, frame: false, transparent: true, resizable: false, movable: false,
        alwaysOnTop: true, skipTaskbar: true, focusable: false, hasShadow: false, fullscreenable: false,
        show: false, backgroundColor: '#00000000',
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    });
    soundOverlay.setIgnoreMouseEvents(true, { forward: false });
    soundOverlay.setAlwaysOnTop(true, 'screen-saver');
    soundOverlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    soundOverlay.loadFile(path.join(__dirname, 'sound-overlay.html'));
    soundOverlay.webContents.on('did-finish-load', () => {
        placeSoundOverlay();
        if (shown() && cfg.sound.enabled) soundOverlay.showInactive();
    });
    soundOverlay.on('closed', () => { soundOverlay = null; });
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
    if (soundOverlay) {
        if (shown() && cfg.sound.enabled) { placeSoundOverlay(); soundOverlay.showInactive(); }
        else soundOverlay.hide();
    }
    acSync(); placeChecklist(); placeTimer(); hud.refresh();
}
function setVisible(v) {
    visible = v;
    if (v) autoHidden = { holster: false, ads: false, wl: autoHidden.wl };
    applyVisibility();
    refreshTray();
    broadcast();
}
function setActive(i) {
    cfg.active = profileManager.select(cfg.profiles, i);
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
    applyVisibility(); broadcast(); hud.onSlot(n);
}
function onHolster() {
    if (!cfg.autoSwitch.holsterHide) return;
    autoHidden.holster = !autoHidden.holster; autoHidden.ads = false;
    applyVisibility(); broadcast();
}
function onAds(down) {
    hud.onAds(!!down);
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
    // chaque raccourci prévient aussi la fenêtre des réglages (test des touches dans l'assistant de configuration)
    const hit = acc => { if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('hk-fired', acc); };
    const reg = (acc, fn) => { if (!acc) return; try { if (!globalShortcut.register(acc, () => { hit(acc); fn(); })) fails.push(acc); } catch (e) { fails.push(acc); } };
    reg(h.toggle, () => setVisible(!visible));
    reg(h.settings, () => createSettings());
    reg(h.sound, () => toggleSound());
    reg(h.nextProfile, () => setActive((cfg.active + 1) % cfg.profiles.length));
    reg(h.center, () => { const s = current(); s.offsetX = 0; s.offsetY = 0; placeOverlay(); saveConfig(); broadcast(); });
    reg(h.autoColor, () => toggleAutoColor());
    reg(h.checklist, () => { cfg.checklist.overlay = !cfg.checklist.overlay; saveConfig(); placeChecklist(); broadcast(); });
    reg(h.checkNext, () => checkNext());
    reg(h.timer, () => { cfg.timer.overlay = !cfg.timer.overlay; saveConfig(); placeTimer(); broadcast(); refreshTray(); });
    reg(h.timer1, () => timerStart(0)); reg(h.timer2, () => timerStart(1)); reg(h.timer3, () => timerStart(2));
    reg(h.timerStop, () => timerStop('all'));
    reg(h.wiki, () => toggleWiki());
    reg(h.spotlight, () => hud.toggleSpot());
    reg(h.range, () => hud.toggleRange());
    reg(h.rangeZoom, () => hud.cycleZoom(1));
    reg(h.compass, () => hud.toggleCompass());
    reg(h.compassNext, () => hud.compassStep(1));
    reg(h.compassPrev, () => hud.compassStep(-1));
    reg(h.themeNext, () => hud.cycleTheme());
    reg(h.map, () => hud.mapKey());
    reg(h.mapWorld, () => hud.mapNextWorld());
    reg(h.up, () => nudge(0, -1)); reg(h.down, () => nudge(0, 1)); reg(h.left, () => nudge(-1, 0)); reg(h.right, () => nudge(1, 0));
    return fails;
}

function broadcast() {
    if (settingsWin) settingsWin.webContents.send('state', state());
    if (aimWin) aimWin.webContents.send('state', state());
}
// petits rafraîchissements groupés (le HUD appelle souvent broadcast)
let bcTimer = null;
function broadcastSoon() { clearTimeout(bcTimer); bcTimer = setTimeout(broadcast, 60); }
function state() {
    return { cfg, visible, shown: shown(), hkFails, firstRun: !cfg.onboarded, autoHidden, lastSlot, hook: { started: ws.state.started, error: ws.state.error }, update: updater.status, installed: updater.isInstalled(), displays: screen.getAllDisplays().map((d, i) => ({ i, label: `Écran ${i + 1} – ${d.size.width}×${d.size.height}${d.id === screen.getPrimaryDisplay().id ? ' (principal)' : ''}` })), hud: hud.stateInfo(), weapons: hudWeapons(), version: app.getVersion(), autoColor: acState, fgTitle: wlTitle, now: Date.now(), presets: Object.fromEntries(Object.entries(CHECK_PRESETS).map(([k, v]) => [k, v.name])) };
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
        { label: 'Alertes sonores (Fortnite-style)', type: 'checkbox', checked: !!cfg.sound.enabled, accelerator: cfg.hotkeys.sound, click: m => toggleSound(m.checked) },
        { label: 'Réglages…', accelerator: cfg.hotkeys.settings, click: () => createSettings() },
        { label: 'Wiki instantané…', accelerator: cfg.hotkeys.spotlight, click: () => hud.showSpot() },
        { label: 'Wiki AR2 (site complet)…', accelerator: cfg.hotkeys.wiki, click: () => openWiki() },
        { label: 'Télémètre (distance au viseur)', type: 'checkbox', checked: !!cfg.range.show, accelerator: cfg.hotkeys.range, click: m => hud.toggleRange(m.checked) },
        { label: 'Boussole / cap', submenu: [
            { label: 'Afficher la boussole', type: 'checkbox', checked: !!cfg.compass.show, accelerator: cfg.hotkeys.compass, click: m => hud.toggleCompass(m.checked) },
            { label: 'Étape suivante', accelerator: cfg.hotkeys.compassNext, enabled: !!cfg.compass.route, click: () => hud.compassStep(1) },
            { label: 'Étape précédente', accelerator: cfg.hotkeys.compassPrev, enabled: !!cfg.compass.route, click: () => hud.compassStep(-1) },
            { label: 'Effacer la destination', enabled: !!cfg.compass.route, click: () => { cfg.compass.route = null; cfg.compass.leg = 0; saveConfig(); hud.refresh(); refreshTray(); broadcast(); } }
        ] },
        { label: 'Carte tactique (overlay)', submenu: [
            { label: 'Afficher la carte', type: 'checkbox', checked: !!hud.tmapOn, accelerator: cfg.hotkeys.map, click: m => hud.showMap(m.checked) },
            { label: 'Changer de carte (archipel / Kin Flats)', accelerator: cfg.hotkeys.mapWorld, click: () => hud.mapNextWorld() }
        ] },
        { label: 'Assistant de configuration…', click: () => { createSettings(); const go = () => settingsWin && settingsWin.webContents.send('open-onboarding'); if (settingsWin.webContents.isLoading()) settingsWin.webContents.once('did-finish-load', () => setTimeout(go, 300)); else go(); } },
        { label: 'Thème', submenu: hud.T.THEME_ORDER.map(id => ({ label: hud.T.THEMES[id].name, type: 'radio', checked: cfg.theme === id, click: () => hud.setTheme(id) })) },
        { type: 'separator' },
        { label: 'Profil', submenu: cfg.profiles.map((p, i) => ({ label: p.name, type: 'radio', checked: i === cfg.active, click: () => setActive(i) })) },
        { label: 'Changement d\'arme automatique', type: 'checkbox', checked: !!cfg.autoSwitch.enabled, click: m => { cfg.autoSwitch.enabled = m.checked; autoHidden = { holster: false, ads: false, wl: autoHidden.wl }; applyVisibility(); saveConfig(); broadcast(); } },
        { label: 'Couleur automatique', type: 'checkbox', checked: !!cfg.autoColor.enabled, accelerator: cfg.hotkeys.autoColor, click: m => toggleAutoColor(m.checked) },
        { label: 'Liste blanche des applis', type: 'checkbox', checked: !!cfg.whitelist.enabled, click: m => { cfg.whitelist.enabled = m.checked; wlSchedule(); saveConfig(); broadcast(); } },
        { label: 'Afficher les objectifs', type: 'checkbox', checked: !!cfg.checklist.overlay, accelerator: cfg.hotkeys.checklist, click: m => { cfg.checklist.overlay = m.checked; saveConfig(); placeChecklist(); broadcast(); } },
        { label: 'Minuteur tactique', submenu: [
            { label: 'Afficher le minuteur', type: 'checkbox', checked: !!cfg.timer.overlay, accelerator: cfg.hotkeys.timer, click: m => { cfg.timer.overlay = m.checked; saveConfig(); placeTimer(); broadcast(); } },
            { type: 'separator' },
            ...cfg.timer.presets.map((p, i) => ({ label: `Lancer : ${p.name} (${fmtMin(p.min)})`, accelerator: cfg.hotkeys['timer' + (i + 1)], click: () => timerStart(i) })),
            { label: 'Arrêter les minuteurs', accelerator: cfg.hotkeys.timerStop, enabled: cfg.timer.running.length > 0, click: () => timerStop('all') }
        ] },
        { label: 'Entraînement de visée…', click: () => openAim() },
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
    if (typeof p.active === 'number') cfg.active = profileManager.select(cfg.profiles, p.active);
    if (typeof p.display === 'number') cfg.display = p.display;
    if (typeof p.startHidden === 'boolean') cfg.startHidden = p.startHidden;
    if (typeof p.moveStep === 'number') cfg.moveStep = Math.max(1, Math.min(50, p.moveStep));
    if (typeof p.launchAtStartup === 'boolean') {
        cfg.launchAtStartup = p.launchAtStartup;
        try { app.setLoginItemSettings({ openAtLogin: p.launchAtStartup, args: ['--hidden'] }); } catch (err) {}
    }
    if (typeof p.autoUpdate === 'boolean') { cfg.autoUpdate = p.autoUpdate; updater.schedule(cfg.autoUpdate); }
    if (typeof p.onboarded === 'boolean') cfg.onboarded = p.onboarded;
    if (p.autoSwitch) {
        const a = p.autoSwitch;
        if (a.slots) cfg.autoSwitch.slots = Object.assign({}, cfg.autoSwitch.slots, a.slots);
        if (a.labels) cfg.autoSwitch.labels = Object.assign({}, cfg.autoSwitch.labels || {}, a.labels);
        ['enabled', 'onlyRoblox', 'holsterHide', 'adsHide', 'showToast'].forEach(k => { if (typeof a[k] === 'boolean') cfg.autoSwitch[k] = a[k]; });
        if (a.adsMode === 'hold' || a.adsMode === 'toggle') cfg.autoSwitch.adsMode = a.adsMode;
        autoHidden = { holster: false, ads: false, wl: autoHidden.wl }; applyVisibility();
    }
    let fails = [];
    if (p.hotkeys) { cfg.hotkeys = Object.assign({}, cfg.hotkeys, p.hotkeys); fails = registerHotkeys(); hkFails = fails; }
    placeOverlay(); saveConfig(); refreshTray();
    return { ...state(), fails };
});
ipcMain.handle('profile', (e, { action, name, index, code }) => {
    if (action === 'add') {
        const requestedName = name == null ? `Profil ${cfg.profiles.length + 1}` : name;
        const result = profileManager.create(cfg.profiles, requestedName, current(), uid);
        cfg.profiles = result.profiles;
        cfg.active = result.active;
    }
    if (action === 'rename') {
        cfg.profiles = profileManager.rename(cfg.profiles, index, name);
    }
    if (action === 'delete') {
        const result = profileManager.remove(cfg.profiles, cfg.active, Number(index));
        cfg.profiles = result.profiles;
        cfg.active = result.active;
    }
    if (action === 'reset') { const d = defaultConfig(); cfg.profiles = d.profiles; cfg.active = 0; cfg.autoSwitch.slots = {}; }
    if (action === 'import') {
        const cleanName = profileManager.uniqueName(name == null ? 'Profil importé' : name, cfg.profiles);
        const result = profileManager.create(cfg.profiles, cleanName, core.fromCode(code), uid);
        cfg.profiles = result.profiles;
        cfg.active = result.active;
    }
    placeOverlay(); saveConfig(); refreshTray();
    return state();
});
ipcMain.handle('set-visible', (e, v) => { setVisible(!!v); return state(); });
ipcMain.handle('update-check', async () => { await updater.check(); return state(); });
ipcMain.handle('update-install', () => updater.install());
ipcMain.handle('open-url', (e, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); });
ipcMain.handle('sound-source', async () => {
    const d = targetDisplay();
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 }, fetchWindowIcons: false });
    const source = sources.find(x => String(x.display_id) === String(d.id)) || sources[cfg.display] || sources[0];
    return source ? source.id : null;
});

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

function toggleSound(v) {
    cfg.sound.enabled = typeof v === 'boolean' ? v : !cfg.sound.enabled;
    saveConfig(); placeOverlay();
    if (soundOverlay) {
        if (shown() && cfg.sound.enabled) soundOverlay.showInactive();
        else soundOverlay.hide();
    }
    refreshTray(); broadcast();
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
        alwaysOnTop: true, skipTaskbar: true, focusable: true, hasShadow: false, show: false, backgroundColor: '#00000000',
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    });
    checkWin.setIgnoreMouseEvents(false);
    checkWin.on('moved', () => { if (!cfg || !checkWin) return; const b = checkWin.getBounds(); cfg.checklist.x = b.x; cfg.checklist.y = b.y; saveConfig(); });
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
    const custom = Number.isFinite(c.x) && Number.isFinite(c.y);
    const x = custom ? Math.max(wa.x, Math.min(wa.x + wa.width - w, c.x)) : (/l$/.test(c.corner) ? wa.x + m : wa.x + wa.width - w - m);
    const y = custom ? Math.max(wa.y, Math.min(wa.y + wa.height - h, c.y)) : (/^b/.test(c.corner) ? wa.y + wa.height - h - m : wa.y + m);
    checkWin.setBounds({ x, y, width: w, height: h });
    checkWin.webContents.send('checklist', c);
    if (!checkWin.isVisible()) checkWin.showInactive();
    checkWin.setAlwaysOnTop(true, 'screen-saver');
    if (typeof placeTimer === 'function' && timerWin) placeTimer();
}
function checkNext() {
    const it = cfg.checklist.items.find(i => !i.done);
    if (it) it.done = true;
    saveConfig(); placeChecklist(); broadcast();
}

// ---------- Minuteur tactique (petit compte à rebours dans un coin) ----------
let timerWin = null, timerTick = null, timerReady = false, timerBeeps = 0;
const fmtMin = m => m >= 1 ? (Number.isInteger(m) ? m : m.toFixed(1).replace('.', ',')) + ' min' : Math.round(m * 60) + ' s';
function timerShown() { return !!(cfg.timer && cfg.timer.overlay && visible && !autoHidden.wl); }
function createTimerWin() {
    if (timerWin) return;
    timerReady = false;
    timerWin = new BrowserWindow({
        width: 240, height: 60, frame: false, transparent: true, resizable: false, movable: false,
        alwaysOnTop: true, skipTaskbar: true, focusable: false, hasShadow: false, show: false, backgroundColor: '#00000000',
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' }
    });
    timerWin.setIgnoreMouseEvents(true, { forward: false });
    timerWin.setAlwaysOnTop(true, 'screen-saver');
    timerWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    timerWin.loadFile(path.join(__dirname, 'timer.html'));
    timerWin.webContents.on('did-finish-load', () => { timerReady = true; placeTimer(); });
    timerWin.on('closed', () => { timerWin = null; timerReady = false; });
}
function keyLabel(acc) { return acc ? acc.replace('Control', 'Ctrl').replace(/\+/g, '+') : ''; }
function placeTimer() {
    if (!cfg) return;
    const t = cfg.timer, need = timerShown() || t.running.length > 0;
    if (!need) { if (timerWin) timerWin.hide(); return; }
    if (!timerWin) return createTimerWin();
    if (!timerReady) return;
    const k = t.scale, rows = Math.max(1, t.running.length);
    const w = Math.round(250 * k), h = Math.round((t.running.length ? 14 + rows * 40 : 46) * k);
    const wa = targetDisplay().workArea, m = 16;
    let x = /l$/.test(t.corner) ? wa.x + m : wa.x + wa.width - w - m;
    let y = /^b/.test(t.corner) ? wa.y + wa.height - h - m : wa.y + m;
    // même coin que les objectifs : on se place juste à côté
    if (checkWin && checkWin.isVisible() && cfg.checklist.corner === t.corner) { const cb = checkWin.getBounds(); y = /^b/.test(t.corner) ? cb.y - h - 8 : cb.y + cb.height + 8; }
    timerWin.setBounds({ x, y, width: w, height: h });
    timerWin.webContents.send('timer', { cfg: Object.assign({}, t, { running: undefined }), running: t.running, now: Date.now(), keys: [1, 2, 3].map(i => keyLabel(cfg.hotkeys['timer' + i])), toggleKey: keyLabel(cfg.hotkeys.timer) });
    if (timerShown()) { if (!timerWin.isVisible()) timerWin.showInactive(); timerWin.setAlwaysOnTop(true, 'screen-saver'); }
    else timerWin.hide();
}
function timerLoop() {
    const t = cfg.timer, now = Date.now();
    let changed = false;
    t.running.forEach(r => {
        if (!r.doneAt && now >= r.end) { r.doneAt = now; changed = true; if (timerWin && timerReady) timerWin.webContents.send('timer-alarm', { kind: 'done', sound: t.sound, volume: t.volume, name: r.name }); }
        if (!r.doneAt && !r.warned && t.warn && t.warnBeep && r.end - now <= t.warn * 1000 && r.dur > t.warn * 2) { r.warned = true; if (timerWin && timerReady) timerWin.webContents.send('timer-alarm', { kind: 'warn', sound: t.sound, volume: t.volume * 0.6, name: r.name }); }
    });
    const before = t.running.length;
    t.running = t.running.filter(r => !r.doneAt || now - r.doneAt < t.keepDone * 1000);
    if (t.running.length !== before) changed = true;
    if (changed) { saveConfig(); placeTimer(); broadcast(); refreshTray(); }
    if (!t.running.length) { clearInterval(timerTick); timerTick = null; }
}
function timerSchedule() { if (cfg.timer.running.length && !timerTick) timerTick = setInterval(timerLoop, 250); }
function timerStart(which) {
    const t = cfg.timer, now = Date.now();
    let p = typeof which === 'number' ? t.presets[which] : (which && which.preset ? t.presets.find(x => x.id === which.preset) : null);
    if (!p && which && typeof which === 'object') p = { id: null, name: String(which.name || 'Minuteur').slice(0, 30), min: Math.max(1 / 60, Math.min(240, (+which.sec ? +which.sec / 60 : +which.min) || 5)) };
    if (!p) return state();
    const dur = Math.round(p.min * 60 * 10) / 10;
    const ex = p.id ? t.running.find(r => r.preset === p.id) : null;
    if (ex) { ex.end = now + dur * 1000; ex.dur = dur; ex.doneAt = null; ex.warned = false; ex.name = p.name; }   // relancer le même minuteur
    else { t.running.push({ id: uid(), preset: p.id, name: p.name, dur, end: now + dur * 1000, doneAt: null }); if (t.running.length > 8) t.running.shift(); }
    t.running.sort((a, b) => a.end - b.end);
    saveConfig(); timerSchedule(); placeTimer(); broadcast(); refreshTray();
    return state();
}
function timerStop(id) {
    const t = cfg.timer;
    t.running = id === 'all' ? [] : t.running.filter(r => r.id !== id);
    saveConfig(); timerLoop(); placeTimer(); broadcast(); refreshTray();
    return state();
}
ipcMain.handle('timer-start', (e, w) => timerStart(w));
ipcMain.handle('timer-stop', (e, id) => timerStop(id));
ipcMain.handle('timer-add', (e, { id, sec }) => { const r = cfg.timer.running.find(x => x.id === id); if (r) { r.end = Math.max(Date.now() + 1000, r.end + (sec | 0) * 1000); r.doneAt = null; r.warned = false; r.dur = Math.max(r.dur, (r.end - Date.now()) / 1000); saveConfig(); timerSchedule(); placeTimer(); broadcast(); } return state(); });
ipcMain.on('timer-beeped', () => { timerBeeps++; });

// ---------- Wiki AR2 : le site complet dans l'appli ----------
const WIKI_URL = process.env.AR2_WIKI_URL || 'https://surax000.github.io/Ar2-wiki-et-map-interactive/';
const WIKI_ORIGIN = new URL(WIKI_URL).origin, WIKI_PATH = new URL(WIKI_URL).pathname;
let wikiWin = null, wikiOffline = false;
const isWikiUrl = u => { try { const x = new URL(u); return x.origin === WIKI_ORIGIN && x.pathname.startsWith(WIKI_PATH); } catch (e) { return false; } };
function openWiki(tab) {
    if (wikiWin) { if (wikiWin.isMinimized()) wikiWin.restore(); wikiWin.show(); wikiWin.focus(); if (tab) wikiGo(tab); return wikiWin; }
    const b = cfg.wikiBounds || {};
    wikiWin = new BrowserWindow({ width: b.width || 1440, height: b.height || 900, x: b.x, y: b.y, minWidth: 820, minHeight: 560, title: 'AR2 Crosshair – Wiki AR2', backgroundColor: '#0b0d10', autoHideMenuBar: true, icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: { preload: path.join(__dirname, 'wikipreload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    if (b.max) wikiWin.maximize();
    wikiWin.setMenuBarVisibility(false);
    const wc = wikiWin.webContents;
    // liens externes (wiki fandom, devforum, YouTube…) : navigateur par défaut
    wc.setWindowOpenHandler(({ url }) => { if (isWikiUrl(url)) { wc.loadURL(url); } else if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
    wc.on('will-navigate', (e, url) => { if (!isWikiUrl(url) && !url.startsWith('file:')) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
    wc.on('did-fail-load', (e, code, desc, url, isMain) => { if (!isMain || code === -3) return; wikiOffline = true; wikiWin.loadFile(path.join(__dirname, 'wikioffline.html'), { query: { err: desc || String(code) } }); });
    wc.on('did-finish-load', () => { if (tab) { wikiGo(tab); tab = null; } });
    wc.on('before-input-event', (e, i) => {
        if (i.type !== 'keyDown') return;
        if (i.key === 'F5' || (i.control && i.key.toLowerCase() === 'r')) { e.preventDefault(); wikiReload(i.shift); }
        else if (i.alt && i.key === 'ArrowLeft' && wc.canGoBack()) wc.goBack();
        else if (i.control && (i.key === '+' || i.key === '=')) wc.setZoomLevel(Math.min(4, wc.getZoomLevel() + 0.5));
        else if (i.control && i.key === '-') wc.setZoomLevel(Math.max(-3, wc.getZoomLevel() - 0.5));
        else if (i.control && i.key === '0') wc.setZoomLevel(0);
    });
    const keep = () => { if (!wikiWin) return; cfg.wikiBounds = Object.assign(wikiWin.isMaximized() ? (cfg.wikiBounds || {}) : wikiWin.getBounds(), { max: wikiWin.isMaximized() }); saveConfig(); };
    wikiWin.on('resized', keep); wikiWin.on('moved', keep); wikiWin.on('maximize', keep); wikiWin.on('unmaximize', keep);
    wikiWin.on('closed', () => { wikiWin = null; });
    wikiReload();
    return wikiWin;
}
function wikiReload(hard) {
    if (!wikiWin) return;
    wikiOffline = false;
    if (hard) wikiWin.webContents.session.clearCache().catch(() => {}).then(() => wikiWin && wikiWin.loadURL(WIKI_URL));
    else wikiWin.loadURL(WIKI_URL);
}
function wikiGo(tab) { if (wikiWin && !wikiOffline) wikiWin.webContents.executeJavaScript(`window.toolGoTab && window.toolGoTab(${JSON.stringify(String(tab))})`).catch(() => {}); }
function toggleWiki() { if (wikiWin && wikiWin.isFocused()) wikiWin.minimize(); else openWiki(); }
const fromWiki = e => wikiWin && e.sender === wikiWin.webContents;
// ouvre le wiki complet sur un lien direct (#q=M4A1, #lieu=l13…) : utilisé par le wiki instantané
function openWikiHash(hash) {
    const had = !!wikiWin && !wikiOffline && !wikiWin.webContents.isLoading();
    const w = openWiki(); if (!w) return;
    const go = () => { if (wikiWin && !wikiOffline) wikiWin.webContents.executeJavaScript(`history.replaceState(null, '', location.pathname + location.search); location.hash = ${JSON.stringify(String(hash))};`).catch(() => {}); };
    if (had) go(); else w.webContents.once('did-finish-load', () => setTimeout(go, 900));
}
function hudWeapons() { return hud.weaponList(); }
hud.init({
    cfg: () => cfg, save: () => saveConfig(), broadcast: () => broadcastSoon(), refreshTray: () => refreshTray(),
    display: () => targetDisplay(), visible: () => visible, wlHidden: () => !!autoHidden.wl, lastSlot: () => lastSlot,
    center: () => { const b = targetDisplay().bounds, s = current(); return { x: b.x + b.width / 2 + (s.offsetX || 0), y: b.y + b.height / 2 + (s.offsetY || 0) }; },
    keyLabel: a => keyLabel(a), userData: () => app.getPath('userData'), wikiUrl: WIKI_URL,
    fromWiki: e => fromWiki(e), wikiWin: () => (wikiWin && !wikiOffline ? wikiWin : null), openWikiHash: h => openWikiHash(h),
    themeTargets: () => [settingsWin, aimWin, checkWin, timerWin].filter(Boolean)
});
ipcMain.handle('hud-extras', (e, p = {}) => {
    const c = {};
    if (p.range) c.range = Object.assign({}, cfg.range, p.range, { zoomBy: Object.assign({}, cfg.range.zoomBy, (p.range && p.range.zoomBy) || {}) });
    if (p.compass) c.compass = Object.assign({}, cfg.compass, p.compass);
    if (p.spotlight) c.spotlight = Object.assign({}, cfg.spotlight, p.spotlight);
    if (p.tmap) c.tmap = Object.assign({}, cfg.tmap, p.tmap);
    if ('showMap' in p) hud.showMap(!!p.showMap);
    if ('clearRoute' in p) c.compass = Object.assign({}, c.compass || cfg.compass, { route: null, leg: 0 });
    hud.normalize(cfg, Object.assign({ theme: cfg.theme }, c));
    if (p.theme) hud.setTheme(p.theme);
    if (p.openSpot) hud.showSpot(p.openSpot === true ? '' : String(p.openSpot));
    if (p.refreshIndex) hud.refreshIndex(true);
    saveConfig(); hud.refresh(); refreshTray();
    return state();
});
ipcMain.handle('wiki-open', (e, tab) => { openWiki(tab); return true; });
ipcMain.handle('wiki-retry', () => { wikiReload(true); return true; });
ipcMain.handle('wiki-info', e => ({ inApp: true, version: app.getVersion(), profiles: cfg.profiles.map(p => p.name), active: cfg.active, theme: cfg.theme, hotkeys: { wiki: cfg.hotkeys.wiki, settings: cfg.hotkeys.settings, spotlight: cfg.hotkeys.spotlight, range: cfg.hotkeys.range, compass: cfg.hotkeys.compass } }));
// le site envoie un crosshair (code AR2X-) ou une sauvegarde AR2SAVE- : import direct, sans copier-coller
ipcMain.handle('wiki-import', (e, { text, name, sections } = {}) => {
    if (!fromWiki(e)) throw new Error('refusé');
    const o = parseBackup(text);
    if (name && o.data && Array.isArray(o.data.profiles) && o.data.profiles.length === 1) o.data.profiles[0].name = String(name).slice(0, 40);
    const r = applyBackup(o, 'merge', sections);
    broadcast();
    return { done: r.done, active: cfg.profiles[cfg.active].name };
});
ipcMain.handle('wiki-settings', e => { if (fromWiki(e)) createSettings(); return true; });

// ---------- Entraînement de visée ----------
let aimWin = null;
function openAim() {
    if (aimWin) { aimWin.show(); aimWin.focus(); return; }
    aimWin = new BrowserWindow({ width: 1180, height: 840, minWidth: 720, minHeight: 560, title: 'AR2 Crosshair – Entraînement de visée', backgroundColor: '#0f1115', autoHideMenuBar: true, icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
    aimWin.setMenuBarVisibility(false);
    aimWin.loadFile(path.join(__dirname, 'aim.html'));
    aimWin.on('closed', () => { aimWin = null; });
}
ipcMain.handle('aim-open', () => { openAim(); return true; });

// ---------- Sauvegarde : import / export de TOUT ----------
const BACKUP_SECTIONS = ['profiles', 'autoSwitch', 'autoColor', 'whitelist', 'checklist', 'timer', 'hud', 'hotkeys', 'general'];
function buildBackup(sections) {
    const sec = (sections && sections.length ? sections : BACKUP_SECTIONS);
    const d = {};
    if (sec.includes('profiles')) { d.profiles = profileManager.exportProfiles(cfg.profiles); d.active = cfg.active; }
    if (sec.includes('autoSwitch')) d.autoSwitch = cfg.autoSwitch;
    if (sec.includes('autoColor')) d.autoColor = cfg.autoColor;
    if (sec.includes('whitelist')) d.whitelist = cfg.whitelist;
    if (sec.includes('checklist')) d.checklist = cfg.checklist;
    if (sec.includes('timer')) d.timer = Object.assign({}, cfg.timer, { running: [] });
    if (sec.includes('hud')) d.hud = { theme: cfg.theme, range: cfg.range, compass: Object.assign({}, cfg.compass, { show: false }), spotlight: cfg.spotlight, tmap: cfg.tmap };
    if (sec.includes('hotkeys')) d.hotkeys = cfg.hotkeys;
    if (sec.includes('general')) d.general = { display: cfg.display, startHidden: cfg.startHidden, launchAtStartup: cfg.launchAtStartup, moveStep: cfg.moveStep, autoUpdate: cfg.autoUpdate };
    return { app: 'ar2-crosshair', format: 1, version: app.getVersion(), exported: new Date().toISOString(), sections: Object.keys(d).filter(k => k !== 'active'), data: JSON.parse(JSON.stringify(d)) };
}
function parseBackup(text) {
    let t = String(text || '').trim();
    if (/^AR2(CFG|SAVE)-/.test(t)) t = Buffer.from(t.replace(/^AR2(CFG|SAVE)-/, '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    if (/^AR2X-/.test(t)) return { app: 'ar2-crosshair', format: 1, data: { profiles: [{ name: 'Profil importé', settings: core.fromCode(t) }] } };
    const o = JSON.parse(t);
    if (o && o.app === 'ar2-armory') {
        // sauvegarde du site AR2 Armory : on récupère le crosshair et les objectifs du site
        const get = k => { const raw = o.data && o.data[k]; try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return null; } };
        const s = get('ar2_crosshair_web'), c = get('ar2_checklist_v1'), d = {};
        if (s) d.profiles = [{ name: 'Crosshair du site', settings: s }];
        if (c && Array.isArray(c.items)) d.checklist = { title: c.title || 'Objectifs', items: c.items };
        if (!Object.keys(d).length) throw new Error('ni crosshair ni objectifs dans cette sauvegarde du site');
        return { app: 'ar2-crosshair', format: 1, data: d };
    }
    if (!o || o.app !== 'ar2-crosshair' || !o.data) throw new Error("ce fichier n'est pas une sauvegarde AR2 Crosshair");
    return o;
}
function applyBackup(o, mode, sections) {
    const d = o.data, sec = sections && sections.length ? sections : BACKUP_SECTIONS, replace = mode === 'replace', done = [];
    const idMap = {};
    const profileImport = sec.includes('profiles') && Object.prototype.hasOwnProperty.call(d, 'profiles')
        ? profileManager.importProfiles(d.profiles, replace ? [] : cfg.profiles, { preserveIds: replace, idFactory: uid })
        : null;
    if (profileImport) {
        const list = profileImport.profiles;
        Object.assign(idMap, profileImport.idMap);
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
    if (sec.includes('timer') && d.timer) { normalizeTimer(Object.assign({}, replace ? {} : cfg.timer, d.timer, { running: cfg.timer.running })); placeTimer(); done.push('minuteur'); }
    if (Object.keys(extras).length) normalizeExtras(Object.assign({ autoColor: cfg.autoColor, whitelist: cfg.whitelist, checklist: cfg.checklist }, extras));
    if (sec.includes('hud') && d.hud) {
        const h = d.hud;
        hud.normalize(cfg, { theme: h.theme || cfg.theme, range: Object.assign({}, replace ? {} : cfg.range, h.range || {}), compass: Object.assign({}, replace ? {} : cfg.compass, h.compass || {}), spotlight: Object.assign({}, cfg.spotlight, h.spotlight || {}), tmap: Object.assign({}, cfg.tmap, h.tmap || {}) });
        hud.setTheme(cfg.theme); hud.refresh();
        done.push('thème, télémètre, boussole et carte tactique');
    }
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
    if (p.sound) {
        cfg.sound = Object.assign({ enabled: false, sensitivity: 1.2 }, p.sound);
        cfg.sound.enabled = !!cfg.sound.enabled;
        cfg.sound.sensitivity = Math.max(0.4, Math.min(3, +cfg.sound.sensitivity || 1.2));
        applyVisibility();
    }
    if (p.autoColor) {
        const was = cfg.autoColor.enabled;
        normalizeExtras({ autoColor: Object.assign({}, cfg.autoColor, p.autoColor), whitelist: cfg.whitelist, checklist: cfg.checklist });
        if (!cfg.autoColor.enabled) { acState.color = null; acState.outline = null; }
        if (was !== cfg.autoColor.enabled || p.autoColor.interval) { if (sampler && samplerReady) sampler.webContents.send('sampler-config', { enabled: false }); }
        acSync(); placeOverlay();
    }
    if (p.whitelist) { normalizeExtras({ autoColor: cfg.autoColor, whitelist: Object.assign({}, cfg.whitelist, p.whitelist), checklist: cfg.checklist }); wlSchedule(); }
    if (p.checklist) { normalizeExtras({ autoColor: cfg.autoColor, whitelist: cfg.whitelist, checklist: Object.assign({}, cfg.checklist, p.checklist) }); placeChecklist(); placeTimer(); }
    if (p.timer) { normalizeTimer(Object.assign({}, cfg.timer, p.timer, { running: cfg.timer.running })); placeTimer(); }
    saveConfig(); refreshTray();
    return state();
});
ipcMain.handle('checklist-toggle', (e, id) => {
    if (!checkWin || e.sender !== checkWin.webContents) throw new Error('refusé');
    const item = cfg.checklist.items.find(i => i.id === String(id));
    if (!item) return false;
    item.done = !item.done;
    saveConfig(); placeChecklist(); broadcast();
    return true;
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
        session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            callback(permission === 'media');
        });
        loadConfig();
        hud.normalize(cfg, cfg);
        visible = !cfg.startHidden;
        createOverlay();
        createSoundOverlay();
        tray = new Tray(trayIcon());
        tray.on('click', () => createSettings());
        refreshTray();
        hkFails = registerHotkeys();
        updater.init({ onChange: () => { refreshTray(); broadcast(); } });
        if (ws.loadForeground) ws.loadForeground();
        wlSchedule(); acSync(); placeChecklist(); timerSchedule(); placeTimer();
        ws.start({ config: () => SELFTEST ? Object.assign({}, cfg.autoSwitch, { onlyRoblox: false }) : cfg.autoSwitch, slot: onSlot, holster: onHolster, ads: onAds, rawDown: (c, k) => hud.onKeyDown(c, k), rawUp: (c, k) => hud.onKeyUp(c, k) });
        if (SELFTEST) return runSelftest();
        updater.schedule(cfg.autoUpdate);
        if (!process.argv.includes('--hidden')) createSettings();
        hud.refresh();
        setTimeout(() => hud.refreshIndex(false), 30000);
        screen.on('display-metrics-changed', () => { acSourceCache = {}; placeOverlay(); acSync(); });
        screen.on('display-added', placeOverlay);
        screen.on('display-removed', () => { cfg.display = 0; placeOverlay(); });
    });
    app.on('before-quit', () => {
        clearTimeout(saveTimer);
        saveTimer = null;
        persistConfig();
    });
    app.on('window-all-closed', e => { /* reste dans la barre des tâches (zone de notification) */ });
    app.on('will-quit', () => { globalShortcut.unregisterAll(); ws.stop(); stopThumb(); clearInterval(wlTimer); clearInterval(timerTick); });
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
        // Gestion des profils : suppression avant / du / après le profil actif.
        const testProfiles = Array.from({ length: 5 }, (_, i) => ({ id: 'test-' + i, name: 'Test ' + i, settings: {} }));
        const deleteBefore = profileManager.remove(testProfiles, 3, 1);
        const deleteActive = profileManager.remove(testProfiles, 2, 2);
        const deleteAfter = profileManager.remove(testProfiles, 1, 3);
        const oneLeft = profileManager.remove(testProfiles.slice(0, 2), 0, 1).profiles;
        out.profileManagementOk = deleteBefore.active === 2 && deleteActive.active === 2 &&
            deleteAfter.active === 1 && oneLeft.length === 1;
        let lastProfileProtected = false;
        try { profileManager.remove(oneLeft, 0, 0); } catch (e) { lastProfileProtected = /dernier profil/.test(e.message); }
        out.profileManagementOk = out.profileManagementOk && lastProfileProtected;
        if (!out.profileManagementOk) throw new Error('gestion des profils : index actif incorrect après suppression');
        const cloneSource = { ...current(), customParts: [{ style: 'cross', x: 0 }] };
        const clonedProfile = profileManager.create([], 'Test indépendant', cloneSource, uid);
        clonedProfile.profiles[clonedProfile.active].settings.customParts[0].x = 99;
        out.profileCloneOk = clonedProfile.profiles[clonedProfile.active].settings.customParts[0].x === 99 && cloneSource.customParts[0].x === 0;
        if (!out.profileCloneOk) throw new Error('gestion des profils : copie non indépendante');
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
        // minuteur tactique : un compte à rebours de 1,5 s doit se terminer et biper
        try {
            cfg.timer.overlay = true; cfg.timer.sound = true; cfg.timer.volume = 0.05;
            timerStart({ name: 'Test', sec: 1.5 }); timerStart(0);
            await wait(1200);
            out.timer = { created: !!timerWin, visible: timerWin ? timerWin.isVisible() : false, running: cfg.timer.running.length, bounds: timerWin ? timerWin.getBounds() : null };
            await wait(1500);
            const tr = cfg.timer.running.find(r => r.name === 'Test');
            out.timer.done = !!(tr && tr.doneAt); out.timer.beeps = timerBeeps;
            timerStop('all'); out.timer.afterStop = cfg.timer.running.length;
            out.timerOk = out.timer.created && out.timer.running === 2 && out.timer.done && out.timer.afterStop === 0;
            // fenêtre d'entraînement de visée
            openAim(); await wait(2500);
            out.aim = { created: !!aimWin, ok: aimWin ? await aimWin.webContents.executeJavaScript('!!(window.AR2Aim && document.querySelector(".aim canvas") && window.__aimReady)') : false };
            if (aimWin) aimWin.close();
            // wiki : le site complet doit se charger dans l'appli avec le pont ar2App
            openWiki(); const tw = Date.now(); let wk = null;
            while (Date.now() - tw < 25000) { await wait(1000); if (!wikiWin) break; try { wk = await wikiWin.webContents.executeJavaScript('({ groups: (typeof GROUPS !== "undefined" ? GROUPS.length : 0), inApp: document.documentElement.classList.contains("in-app"), toApp: !!document.getElementById("xh-toapp"), bridge: !!(window.ar2App && window.ar2App.inApp), offline: !!window.__wikiOffline, title: document.title })'); } catch (err) {} if (wk && (wk.groups > 5 || wk.offline)) break; }
            if (wk && wk.groups > 5) { try { const n0 = cfg.profiles.length; await wikiWin.webContents.executeJavaScript("toolGoTab('crosshair'); new Promise(r => setTimeout(r, 600)).then(() => document.getElementById('xh-toapp').click())"); await wait(1500); wk.sentProfile = cfg.profiles.length === n0 + 1 && cfg.profiles[cfg.active].name === 'Crosshair du wiki'; if (wk.sentProfile) { cfg.profiles.splice(cfg.active, 1); cfg.active = 0; saveConfig(); } } catch (err) { wk.sendError = String(err && err.message || err); } }
            out.wiki = Object.assign({ created: !!wikiWin }, wk || {}); out.wikiOk = !!(wk && wk.groups > 5 && wk.bridge);
            if (wikiWin) wikiWin.close();
        } catch (e) { out.timerError = String(e && e.message || e); }
        write();
        // v1.5 : wiki instantané, télémètre, boussole, thèmes (non bloquant)
        try {
            const W = () => hud.wins();
            out.hud = { indexItems: hud.stateInfo().indexItems };
            hud.toggleRange(true); await wait(1500);
            out.hud.range = { created: !!W().rangeWin, visible: W().rangeWin ? W().rangeWin.isVisible() : false, marks: hud.rangeData().ladder.length, bounds: W().rangeWin ? W().rangeWin.getBounds() : null };
            hud.setRoute({ title: 'Test', points: [{ id: 'l0', name: 'Ashland', x: 540, y: 600 }, { id: 'l13', name: 'Regional Airport', x: 345, y: 770 }] }); await wait(1500);
            out.hud.compass = { created: !!W().compWin, visible: W().compWin ? W().compWin.isVisible() : false, deg: Math.round(hud.compassData().deg), card: hud.compassData().card };
            hud.showSpot('m4a1'); await wait(2500);
            const sw = W().spotWin;
            out.hud.spot = { created: !!sw, visible: sw ? sw.isVisible() : false, ok: sw ? await sw.webContents.executeJavaScript('!!(window.__spotReady && document.querySelector(".aq-it"))') : false };
            hud.hideSpot();
            hud.setTheme('nvg'); await wait(300); out.hud.theme = cfg.theme; hud.setTheme('classic');
            hud.toggleRange(false); hud.toggleCompass(false); cfg.compass.route = null;
            out.hudOk = out.hud.indexItems > 100 && out.hud.range.created && out.hud.range.marks > 3 && out.hud.compass.created && out.hud.compass.deg === 229 && out.hud.spot.ok && out.hud.theme === 'nvg';
        } catch (e) { out.hudError = String(e && e.stack || e); }
        write();
        // v1.7 : carte tactique + chaîne Kin Flats (non bloquant)
        try {
            const W = () => hud.wins();
            const kf = (hud.index && hud.index.locs || []).filter(l => l.world === 'kf' && /^(Clinique|Caserne|Commissariat|Hôpital|Supérette|Église)/.test(l.name));
            const pick = re => kf.find(l => re.test(l.name));
            const pts = [pick(/^Clinique de Kin/), pick(/pompiers de Kin/i), pick(/^Commissariat de Kin/)].filter(Boolean);
            if (pts.length === 3) hud.setRoute({ title: 'Kin', points: pts.map(l => ({ id: l.id, name: l.name, x: l.x, y: l.y, world: 'kf' })) });
            hud.showMap(true); await wait(2000);
            const tw = W().tmapWin;
            const d = hud.tmapData();
            out.tmap = { created: !!tw, visible: tw ? tw.isVisible() : false, world: d.world, pts: (d.pts || []).length, route: d.route ? d.route.pts.length : 0, kfBld: kf.length,
                svg: tw ? await tw.webContents.executeJavaScript('document.querySelectorAll("svg *").length') : 0 };
            if (process.env.AR2_SHOT && tw) { try { fs.writeFileSync(path.join(process.env.AR2_SHOT, 'tmap.png'), (await tw.webContents.capturePage()).toPNG()); } catch (e) { } }
            hud.showMap(false); await wait(300); out.tmap.hidden = tw ? !tw.isVisible() : true;
            hud.toggleCompass(false); cfg.compass.route = null;
            out.tmapOk = out.tmap.created && out.tmap.visible && out.tmap.hidden && out.tmap.svg > 20 && out.tmap.kfBld >= 15 && out.tmap.world === 'kf' && out.tmap.route === 3;
        } catch (e) { out.tmapError = String(e && e.stack || e); }
        write();
        // mises à jour
        await updater.check();
        const t0 = Date.now();
        while (['checking', 'downloading'].includes(updater.status.state) && Date.now() - t0 < 240000) await wait(1000);
        out.update = updater.status;
        write();
        if (SELFTEST_UPDATE && updater.status.state === 'ready') {
            await updater.check();
            out.updateAfterRepeatCheck = updater.status;
            if (updater.status.state !== 'ready') throw new Error('Le statut prêt a été perdu après une nouvelle vérification');
            out.installing = true; write(); updater.autoUpdater.quitAndInstall(true, false); return;
        }
    } catch (e) { out.error = String(e.stack || e); }
    write();
    app.exit(0);
}
