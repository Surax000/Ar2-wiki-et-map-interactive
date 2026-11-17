// AR2 Crosshair – HUD v1.5
//  • Wiki instantané (Ctrl+Alt+W) : barre de recherche semi-transparente par-dessus Roblox
//  • Télémètre (Ctrl+Alt+D) : jauge de distance à côté du viseur + dégâts de l'arme équipée
//  • Boussole / cap (Ctrl+Alt+K) : cap à suivre en haut de l'écran + temps de trajet
//  • Thèmes visuels partagés par toutes les fenêtres (et le site)
const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const T = require('./ar2-tools.js');

const DEFAULT_RANGE = () => ({ show: false, weapon: 'm4a1', followSlot: true, zoomBy: {}, fov: 70, calib: 1, side: 'right', gap: 70, onlyAds: false, opacity: 0.9, scale: 1 });
const DEFAULT_COMPASS = () => ({ show: false, route: null, leg: 0, origin: '', opacity: 0.92, scale: 1, speed: 'sprint', top: 10 });
const DEFAULT_SPOT = () => ({ opacity: 0.9, hideOnBlur: true });
const DEFAULT_TMAP = () => ({ world: 'auto', last: 'halsey', opacity: 0.85, size: 0.72, bld: true, hidden: true, custom: true, route: true, events: false, labels: true });
const clamp = (v, a, b, d) => { v = +v; return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };

let C = null;                    // contexte fourni par main.js
let raw = null, index = null;    // index du wiki (brut pour les fenêtres, préparé pour main)
let spotWin = null, rangeWin = null, compWin = null, refreshWin = null, tmapWin = null;
let adsDown = false, lastMsg = null;

// ---------- configuration ----------
function normalize(cfg, c) {
    c = c || {};
    cfg.theme = T.THEMES[c.theme] ? c.theme : (T.THEMES[cfg.theme] ? cfg.theme : 'classic');
    const r = Object.assign(DEFAULT_RANGE(), c.range || cfg.range || {});
    r.fov = clamp(r.fov, 40, 120, 70); r.calib = clamp(r.calib, 0.4, 2.5, 1); r.gap = clamp(r.gap, 20, 400, 70);
    r.opacity = clamp(r.opacity, 0.2, 1, 0.9); r.scale = clamp(r.scale, 0.6, 2, 1);
    if (!['left', 'right'].includes(r.side)) r.side = 'right';
    if (!r.zoomBy || typeof r.zoomBy !== 'object') r.zoomBy = {};
    r.show = !!r.show; r.followSlot = !!r.followSlot; r.onlyAds = !!r.onlyAds;
    cfg.range = r;
    const k = Object.assign(DEFAULT_COMPASS(), c.compass || cfg.compass || {});
    k.opacity = clamp(k.opacity, 0.2, 1, 0.92); k.scale = clamp(k.scale, 0.6, 2, 1); k.top = clamp(k.top, 0, 600, 10);
    if (!['walk', 'sprint', 'vehicle'].includes(k.speed)) k.speed = 'sprint';
    k.route = cleanRoute(k.route); k.leg = k.route ? clamp(k.leg | 0, 0, k.route.points.length - 2, 0) : 0; k.show = !!k.show;
    cfg.compass = k;
    const s = Object.assign(DEFAULT_SPOT(), c.spotlight || cfg.spotlight || {});
    s.opacity = clamp(s.opacity, 0.4, 1, 0.9); s.hideOnBlur = s.hideOnBlur !== false;
    cfg.spotlight = s;
    const m = Object.assign(DEFAULT_TMAP(), c.tmap || cfg.tmap || {});
    if (!['auto', 'halsey', 'kf'].includes(m.world)) m.world = 'auto';
    if (!['halsey', 'kf'].includes(m.last)) m.last = 'halsey';
    m.opacity = clamp(m.opacity, 0.3, 1, 0.85); m.size = clamp(m.size, 0.35, 0.95, 0.72);
    ['bld', 'hidden', 'custom', 'route', 'labels'].forEach(x => { m[x] = m[x] !== false; }); m.events = !!m.events;
    cfg.tmap = m;
}
function cleanRoute(r) {
    if (!r || !Array.isArray(r.points)) return null;
    const pts = r.points.filter(p => p && isFinite(+p.x) && isFinite(+p.y)).slice(0, 30)
        .map(p => ({ id: String(p.id || ''), name: String(p.name || 'Point').slice(0, 60), x: +p.x, y: +p.y, world: p.world === 'kf' ? 'kf' : 'halsey' }));
    return pts.length >= 2 ? { title: String(r.title || '').slice(0, 80), points: pts } : null;
}

// ---------- index du wiki ----------
const cachePath = () => path.join(C.userData(), 'ar2-index.json');
function validIndex(o) { return o && o.app === 'ar2-index' && Array.isArray(o.items) && o.items.length > 20 && Array.isArray(o.locs); }
function loadIndex() {
    let best = null;
    for (const f of [path.join(__dirname, 'ar2-index.json'), cachePath()]) {
        try { const o = JSON.parse(fs.readFileSync(f, 'utf8')); if (validIndex(o) && (!best || String(o.generated) > String(best.generated))) best = o; } catch (e) {}
    }
    setIndex(best || { app: 'ar2-index', items: [], locs: [], scale: {} }, false);
}
function setIndex(o, save) {
    raw = o; index = T.prep(JSON.parse(JSON.stringify(o)));
    if (save) { try { fs.mkdirSync(path.dirname(cachePath()), { recursive: true }); fs.writeFileSync(cachePath(), JSON.stringify(o)); } catch (e) {} }
    send(spotWin, 'hud-index', raw);
    placeRange(); placeCompass(); placeTmap();
}
function cacheAge() { try { return Date.now() - fs.statSync(cachePath()).mtimeMs; } catch (e) { return Infinity; } }
// mise à jour discrète de l'index : le site est chargé dans une fenêtre invisible et pousse ses données
function refreshIndex(force) {
    if (refreshWin || (!force && cacheAge() < 20 * 3600 * 1000)) return;
    refreshWin = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: { preload: path.join(__dirname, 'wikipreload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    const w = refreshWin, kill = () => { if (refreshWin === w) refreshWin = null; try { w.destroy(); } catch (e) {} };
    w.webContents.setAudioMuted(true);
    w.webContents.on('did-fail-load', (e, code, d, u, isMain) => { if (isMain && code !== -3) kill(); });
    w.__kill = kill;
    setTimeout(kill, 90000);
    w.loadURL(C.wikiUrl).catch(kill);
}

// ---------- outils fenêtres ----------
function send(win, ch, data) { if (win && !win.isDestroyed() && win.__ready) win.webContents.send(ch, data); }
function overlayWin(file, focusable, extra) {
    const win = new BrowserWindow(Object.assign({
        width: 300, height: 120, frame: false, transparent: true, resizable: false, movable: false, minimizable: false, maximizable: false,
        alwaysOnTop: true, skipTaskbar: true, focusable, hasShadow: false, show: false, backgroundColor: '#00000000', fullscreenable: false,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    }, extra || {}));
    if (!focusable) win.setIgnoreMouseEvents(true, { forward: false });
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setMenuBarVisibility(false);
    win.loadFile(path.join(__dirname, file));
    return win;
}
const themeOf = () => C.cfg().theme || 'classic';
const kl = acc => C.keyLabel(acc || '');

// ---------- Wiki instantané (Spotlight) ----------
function spotBounds() {
    const b = C.display().workArea;
    const w = Math.min(860, b.width - 40), h = Math.min(560, b.height - 60);
    return { x: Math.round(b.x + (b.width - w) / 2), y: Math.round(b.y + Math.max(20, b.height * 0.12)), width: w, height: h };
}
function createSpot() {
    if (spotWin) return spotWin;
    spotWin = overlayWin('spotlight.html', true, { width: 860, height: 560 });
    const w = spotWin;
    w.webContents.on('did-finish-load', () => { w.__ready = true; if (w.__pending) { w.__pending = false; showSpot(w.__text); } });
    w.on('blur', () => { if (C.cfg().spotlight.hideOnBlur && !w.__noBlur) w.hide(); });
    w.on('closed', () => { if (spotWin === w) spotWin = null; });
    return w;
}
function showSpot(text) {
    const w = createSpot();
    if (!w.__ready) { w.__pending = true; w.__text = text; return; }
    w.setBounds(spotBounds());
    w.show(); w.setAlwaysOnTop(true, 'screen-saver'); w.focus(); w.webContents.focus();
    w.webContents.send('hud-spot-show', { text: text || '', theme: themeOf(), opacity: C.cfg().spotlight.opacity, origin: C.cfg().compass.origin, msg: lastMsg });
    lastMsg = null;
}
function hideSpot() { if (spotWin && spotWin.isVisible()) spotWin.hide(); }
function toggleSpot() { if (spotWin && spotWin.isVisible() && spotWin.isFocused()) hideSpot(); else showSpot(); }

// ---------- Télémètre ----------
function weaponFor() {
    const cfg = C.cfg(), r = cfg.range;
    let w = null, src = 'manuel';
    if (r.followSlot) {
        const slot = C.lastSlot(), label = slot != null && cfg.autoSwitch && cfg.autoSwitch.labels ? cfg.autoSwitch.labels[String(slot)] : '';
        if (label) { w = T.best(index, label, o => o.type === 'weapon'); if (w) src = 'emplacement ' + slot; }
    }
    if (!w && r.weapon) w = T.get(index, r.weapon);
    if (!w) w = T.best(index, 'm4a1', o => o.type === 'weapon');
    return { w, src };
}
function scopesUnique(w) {
    const seen = new Set(), out = [];
    for (const s of T.scopesFor(index, w)) { const k = Math.round(s.z * 10); if (seen.has(k)) continue; seen.add(k); out.push(s); }
    return out.sort((a, b) => a.z - b.z);
}
function zoomFor(w) {
    const r = C.cfg().range, list = scopesUnique(w);
    const want = w && r.zoomBy[w.id] != null ? +r.zoomBy[w.id] : (w && w.builtin ? w.builtin : 1);
    return list.find(s => Math.abs(s.z - want) < 0.05) || list.find(s => s.z === 1) || list[0];
}
function cycleZoom(dir) {
    const { w } = weaponFor(); if (!w) return;
    const list = scopesUnique(w), cur = zoomFor(w);
    const i = list.findIndex(s => s === cur), n = list[(i + (dir || 1) + list.length) % list.length];
    C.cfg().range.zoomBy[w.id] = n.z; C.cfg().range.show = true;
    C.save(); placeRange(); C.broadcast();
}
function rangeShown() {
    const r = C.cfg().range;
    return r.show && C.visible() && !C.wlHidden() && !(r.onlyAds && !adsDown);
}
function rangeData() {
    const cfg = C.cfg(), r = cfg.range, d = C.display(), H = d.bounds.height;
    const { w, src } = weaponFor(), sc = zoomFor(w);
    const maxPx = Math.min(360, H * 0.4);
    const lad = T.ladder(w, sc.z, H, { fov: r.fov, calib: r.calib, maxPx, minPx: 7, gap: 12 });
    return { theme: themeOf(), opacity: r.opacity, scale: r.scale, side: r.side, maxPx, screenH: H,
        weapon: w ? { id: w.id, name: w.name, cat: w.cat, hd: w.hd, bod: w.bod, fdr: w.fdr, mdr: w.mdr, vel: w.vel } : null, src,
        scope: { name: sc.name, z: sc.z }, ladder: lad, keys: { toggle: kl(cfg.hotkeys.range), zoom: kl(cfg.hotkeys.rangeZoom) } };
}
function placeRange() {
    if (!C || !index || !C.cfg()) return;
    if (!rangeShown()) { if (rangeWin) rangeWin.hide(); return; }
    if (!rangeWin) {
        rangeWin = overlayWin('range.html', false);
        const w = rangeWin;
        w.webContents.on('did-finish-load', () => { w.__ready = true; placeRange(); });
        w.on('closed', () => { if (rangeWin === w) rangeWin = null; });
        return;
    }
    if (!rangeWin.__ready) return;
    const data = rangeData(), r = C.cfg().range, k = r.scale;
    const n = Math.max(3, data.ladder.length);
    const W = Math.round(Math.max(250, (n * 34 + 26)) * k), Hh = Math.round(data.maxPx + 120 * k);
    const c = C.center();
    const x = r.side === 'left' ? Math.round(c.x - r.gap - W) : Math.round(c.x + r.gap);
    const y = Math.round(c.y - 50 * k - data.maxPx / 2);
    rangeWin.setBounds({ x, y, width: W, height: Hh });
    send(rangeWin, 'hud-range', data);
    if (!rangeWin.isVisible()) rangeWin.showInactive();
    rangeWin.setAlwaysOnTop(true, 'screen-saver');
}
function toggleRange(v) { const r = C.cfg().range; r.show = typeof v === 'boolean' ? v : !r.show; C.save(); placeRange(); C.broadcast(); C.refreshTray(); }
function setRangeWeapon(id, zoom) {
    const w = T.get(index, id) || T.best(index, String(id || ''), o => o.type === 'weapon');
    if (!w || w.type !== 'weapon') return null;
    const r = C.cfg().range;
    r.weapon = w.id; r.followSlot = false; r.show = true;
    if (zoom != null && isFinite(+zoom) && +zoom >= 1) r.zoomBy[w.id] = +zoom;
    C.save(); placeRange(); C.broadcast(); C.refreshTray();
    return w;
}

// ---------- Boussole ----------
function compassData() {
    const cfg = C.cfg(), k = cfg.compass, rt = k.route;
    const base = { theme: themeOf(), opacity: k.opacity, scale: k.scale, speed: k.speed, keys: { toggle: kl(cfg.hotkeys.compass), next: kl(cfg.hotkeys.compassNext), spot: kl(cfg.hotkeys.spotlight) } };
    if (!rt) return Object.assign(base, { empty: true });
    const i = Math.min(k.leg, rt.points.length - 2), r = T.route(index, rt.points);
    const L = r.legs[i], rest = r.legs.slice(i);
    return Object.assign(base, { title: rt.title, leg: i + 1, legs: r.legs.length, from: L.from.name, to: L.to.name, next: rt.points[i + 2] ? rt.points[i + 2].name : '',
        deg: L.deg, card: L.card, card16: L.card16, studs: L.studs, dist: T.fmtDist(L.studs), walk: L.walk, sprint: L.sprint, vehicle: L.vehicle,
        restTime: rest.reduce((s, l) => s + l[k.speed], 0), restDist: T.fmtDist(rest.reduce((s, l) => s + l.studs, 0)) });
}
function compassShown() { return C.cfg().compass.show && C.visible() && !C.wlHidden(); }
function placeCompass() {
    if (!C || !index || !C.cfg()) return;
    if (!compassShown()) { if (compWin) compWin.hide(); return; }
    if (!compWin) {
        compWin = overlayWin('compass.html', false);
        const w = compWin;
        w.webContents.on('did-finish-load', () => { w.__ready = true; placeCompass(); });
        w.on('closed', () => { if (compWin === w) compWin = null; });
        return;
    }
    if (!compWin.__ready) return;
    const k = C.cfg().compass, wa = C.display().workArea;
    const W = Math.round(620 * k.scale), H = Math.round(104 * k.scale);
    compWin.setBounds({ x: Math.round(wa.x + (wa.width - W) / 2), y: Math.round(wa.y + k.top), width: W, height: H });
    send(compWin, 'hud-compass', compassData());
    if (!compWin.isVisible()) compWin.showInactive();
    compWin.setAlwaysOnTop(true, 'screen-saver');
}
function toggleCompass(v) { const k = C.cfg().compass; k.show = typeof v === 'boolean' ? v : !k.show; C.save(); placeCompass(); C.broadcast(); C.refreshTray(); }
function setRoute(r) {
    const rt = cleanRoute(r); if (!rt) return false;
    const k = C.cfg().compass; k.route = rt; k.leg = 0; k.show = true;
    C.save(); placeCompass(); placeTmap(); C.broadcast(); C.refreshTray();
    return true;
}
function compassStep(d) {
    const k = C.cfg().compass; if (!k.route) return;
    k.leg = Math.max(0, Math.min(k.route.points.length - 2, k.leg + d)); k.show = true;
    C.save(); placeCompass(); placeTmap(); C.broadcast();
}

// ---------- Carte tactique en overlay (Ctrl+Alt+M) ----------
let tmapOn = false, tmapWorld = null, tmapLast = 0, tmapAt = 0;
function tmapWorldOf() {
    const m = C.cfg().tmap, rt = C.cfg().compass.route;
    if (tmapWorld) return tmapWorld;
    if (m.world !== 'auto') return m.world;
    return rt && rt.points[0] ? rt.points[0].world : m.last;
}
function tmapData() {
    const cfg = C.cfg(), m = cfg.tmap, w = tmapWorldOf(), k = cfg.compass, rt = k.route;
    const map = raw && raw.map ? raw.map : null;
    const pts = (raw && raw.locs ? raw.locs : []).filter(l => (l.world || 'halsey') === w).filter(l => {
        const kind = l.kind || 'loc';
        if (kind === 'loc') return (l.cat !== 'cache' && !l.hidden) || m.hidden;
        if (kind === 'custom') return m.custom;
        if (kind === 'veh') return m.bld;
        if (kind === 'bld') return false; // dessinés avec les icônes de la carte
        if (kind === 'event') return m.events;
        return false;
    }).map(l => ({ n: l.name, x: l.x, y: l.y, c: l.cat, k: l.kind || 'loc', h: !!l.hidden || l.cat === 'cache' }));
    const route = m.route && rt && rt.points.every(p => p.world === w) ? { pts: rt.points.map(p => ({ n: p.name, x: p.x, y: p.y })), leg: Math.min(k.leg, rt.points.length - 2), title: rt.title } : null;
    let cap = null;
    if (route) { const L = T.leg(index, rt.points[route.leg], rt.points[route.leg + 1]); cap = { deg: L.deg, card: L.card16, dist: T.fmtDist(L.studs), to: L.to.name, t: T.sec(L[k.speed] || L.sprint) }; }
    return { theme: themeOf(), opacity: m.opacity, world: w, map, pts, route, cap, bld: m.bld, labels: m.labels,
        keys: { toggle: kl(cfg.hotkeys.map), world: kl(cfg.hotkeys.mapWorld) }, routeOther: !!(rt && !route && m.route) };
}
function tmapBounds() {
    const wa = C.display().workArea, m = C.cfg().tmap;
    const h = Math.round(wa.height * m.size), w = Math.round(Math.min(wa.width * 0.95, h * 1045 / 947));
    return { x: Math.round(wa.x + (wa.width - w) / 2), y: Math.round(wa.y + (wa.height - h) / 2), width: w, height: h + 34 };
}
function placeTmap() {
    if (!C || !C.cfg()) return;
    if (!tmapOn || !C.visible()) { if (tmapWin && tmapWin.isVisible()) tmapWin.hide(); return; }
    if (!tmapWin) {
        tmapWin = overlayWin('tmap.html', false);
        const w = tmapWin;
        w.webContents.on('did-finish-load', () => { w.__ready = true; placeTmap(); });
        w.on('closed', () => { if (tmapWin === w) tmapWin = null; });
        return;
    }
    if (!tmapWin.__ready) return;
    tmapWin.setBounds(tmapBounds());
    send(tmapWin, 'hud-tmap', tmapData());
    if (!tmapWin.isVisible()) tmapWin.showInactive();
    tmapWin.setAlwaysOnTop(true, 'screen-saver');
}
function showMap(v) {
    tmapOn = !!v;
    if (tmapOn) tmapAt = Date.now(); else tmapWorld = null;
    placeTmap(); C.broadcast();
}
// Appui court = afficher / masquer. Touche maintenue = la carte disparaît dès qu'on la relâche.
// Le hook clavier (comme le push-to-talk de Discord) sait si la touche est encore enfoncée : les répétitions
// automatiques de Windows pendant l'appui long sont ignorées.
let keyDown = false, keyDownAt = 0;
function mapMainKey(keys) {
    const last = String(C.cfg().hotkeys.map || '').split('+').pop();
    return last && keys ? keys[last.length === 1 ? last.toUpperCase() : last] : null;
}
function mapKey() {
    const now = Date.now(), dt = now - tmapLast; tmapLast = now;
    if (tmapOn && keyDown && tmapAt >= keyDownAt - 80) return;   // même appui (répétition)
    if (tmapOn && dt < 150) return;                              // répétition sans hook clavier
    showMap(!tmapOn);
}
function onKeyDown(code, keys) {
    if (code !== mapMainKey(keys)) return;
    if (!keyDown) { keyDown = true; keyDownAt = Date.now(); }
}
function onKeyUp(code, keys) {
    const main = mapMainKey(keys);
    const mods = keys ? [keys.Ctrl, keys.CtrlRight, keys.Alt, keys.AltRight].filter(x => x != null) : [];
    if (code !== main && !mods.includes(code)) return;
    const wasHeld = keyDown && tmapOn && tmapAt >= keyDownAt - 80 && Date.now() - tmapAt > 380;
    if (code === main) keyDown = false;
    if (wasHeld) showMap(false);
}
function mapNextWorld() {
    const w = tmapWorldOf() === 'kf' ? 'halsey' : 'kf';
    tmapWorld = w; C.cfg().tmap.last = w; C.save();
    if (!tmapOn) showMap(true); else placeTmap();
}

// ---------- Thèmes ----------
function setTheme(id, from) {
    if (!T.THEMES[id]) return themeOf();
    C.cfg().theme = id; C.save();
    [spotWin, rangeWin, compWin, tmapWin].forEach(w => send(w, 'hud-theme', id));
    C.themeTargets().forEach(w => { if (w && !w.isDestroyed()) w.webContents.send('hud-theme', id); });
    const wiki = C.wikiWin();
    if (wiki && from !== 'wiki') wiki.webContents.executeJavaScript(`window.ar2SetTheme && window.ar2SetTheme(${JSON.stringify(id)}, true)`).catch(() => {});
    placeRange(); placeCompass(); C.broadcast(); C.refreshTray();
    return id;
}
function cycleTheme() { const o = T.THEME_ORDER; setTheme(o[(o.indexOf(themeOf()) + 1) % o.length]); }

// ---------- IPC ----------
function fromSite(e) { return C.fromWiki(e) || (refreshWin && e.sender === refreshWin.webContents); }
function registerIpc() {
    ipcMain.handle('hud-get', () => ({ theme: themeOf(), index: raw, origin: C.cfg().compass.origin, opacity: C.cfg().spotlight.opacity,
        hotkeys: Object.fromEntries(['spotlight', 'wiki', 'range', 'rangeZoom', 'compass', 'compassNext', 'map'].map(k => [k, kl(C.cfg().hotkeys[k])])) }));
    ipcMain.handle('hud-theme-get', () => themeOf());
    ipcMain.handle('hud-theme-set', (e, id) => setTheme(id));
    ipcMain.handle('hud-act', (e, { act, data } = {}) => {
        data = data || {};
        if (act === 'hide') { hideSpot(); return true; }
        if (act === 'wiki') {
            const hash = data.type === 'loc' ? '#lieu=' + encodeURIComponent(data.id) : '#q=' + encodeURIComponent(data.name || data.q || '');
            hideSpot(); C.openWikiHash(hash); return true;
        }
        if (act === 'range') { const w = setRangeWeapon(data.id, data.zoom); return w ? { ok: true, msg: `${w.name} équipée dans le télémètre (${kl(C.cfg().hotkeys.range)})` } : { ok: false }; }
        if (act === 'compass') { const ok = setRoute({ title: data.title, points: data.points }); if (ok) hideSpot(); return { ok }; }
        if (act === 'origin') { C.cfg().compass.origin = String(data.id || ''); C.save(); return true; }
        if (act === 'pin') { if (spotWin) spotWin.__noBlur = !!data.on; return true; }
        return false;
    });
    // pont avec le site (wiki dans l'appli)
    ipcMain.handle('wiki-route', (e, r) => { if (!C.fromWiki(e)) throw new Error('refusé'); return setRoute(r); });
    ipcMain.handle('wiki-range', (e, o = {}) => { if (!C.fromWiki(e)) throw new Error('refusé'); const w = setRangeWeapon(o.weapon, o.zoom); return w ? { ok: true, weapon: w.name } : { ok: false }; });
    ipcMain.handle('wiki-theme-get', () => themeOf());
    ipcMain.handle('wiki-theme-set', (e, id) => { if (!C.fromWiki(e)) throw new Error('refusé'); return setTheme(id, 'wiki'); });
    ipcMain.handle('wiki-index', (e, o) => {
        if (!fromSite(e)) throw new Error('refusé');
        const ok = validIndex(o);
        if (ok) setIndex(o, true);
        if (refreshWin && e.sender === refreshWin.webContents) setTimeout(() => refreshWin && refreshWin.__kill(), 500);
        return { ok, items: ok ? o.items.length : 0 };
    });
}

function init(ctx) { C = ctx; loadIndex(); registerIpc(); }
function onAds(down) { if (adsDown === down) return; adsDown = down; if (C.cfg().range.onlyAds) placeRange(); }
function onSlot() { if (C.cfg().range.followSlot) placeRange(); }
function refresh() { placeRange(); placeCompass(); placeTmap(); }
function stateInfo() {
    const { w, src } = index ? weaponFor() : {}, sc = w ? zoomFor(w) : null;
    return { indexItems: raw ? raw.items.length : 0, indexDate: raw ? raw.generated : null, range: w ? { weapon: w.name, src, scope: sc.name, z: sc.z, scopes: scopesUnique(w) } : null,
        compass: C.cfg().compass.route ? compassData() : null, tmap: { on: tmapOn, world: tmapWorldOf(), hasMap: !!(raw && raw.map) }, themes: T.THEME_ORDER.map(id => ({ id, name: T.THEMES[id].name, desc: T.THEMES[id].desc, acc: T.THEMES[id].acc, bg: T.THEMES[id].bg })) };
}
function weaponList() { return index ? index.items.filter(i => i.type === 'weapon').map(i => ({ id: i.id, name: i.name, cat: i.cat })) : []; }
const wins = () => ({ spotWin, rangeWin, compWin, refreshWin, tmapWin });

module.exports = { normalize, init, toggleSpot, showSpot, hideSpot, toggleRange, cycleZoom, toggleCompass, compassStep, setRoute, setRangeWeapon, setTheme, cycleTheme,
    onAds, onSlot, refresh, mapKey, showMap, onKeyUp, onKeyDown, mapNextWorld, tmapData, get tmapOn() { return tmapOn; }, refreshIndex, stateInfo, weaponList, wins, rangeData, compassData, get index() { return index; }, T };
