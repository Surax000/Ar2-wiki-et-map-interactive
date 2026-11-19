/* AR2 Crosshair – fenêtre de réglages */
const C = window.AR2Crosshair;
// Mode démo (ouverture dans un navigateur, sans Electron)
if (!window.xh) {
    const st = { cfg: { active: 0, profiles: C.PRESETS.map((p, i) => ({ id: 'p' + i, name: p.name, settings: C.withDefaults(p.s) })), display: 0, autoUpdate: true, autoSwitch: { enabled: true, onlyRoblox: true, holsterHide: true, adsHide: false, adsMode: 'hold', slots: {}, labels: {} }, hotkeys: { toggle: 'Control+Alt+X', settings: 'Control+Alt+S', nextProfile: 'Control+Alt+P', center: 'Control+Alt+C', autoColor: 'Control+Alt+A', checklist: 'Control+Alt+O', checkNext: 'Control+Alt+N', timer: 'Control+Alt+T', timer1: 'Control+Alt+F1', timer2: 'Control+Alt+F2', timer3: 'Control+Alt+F3', timerStop: 'Control+Alt+R', spotlight: 'Control+Alt+W', wiki: 'Control+Alt+Shift+W', range: 'Control+Alt+D', rangeZoom: 'Control+Alt+Shift+D', compass: 'Control+Alt+K', compassNext: 'Control+Alt+J', compassPrev: 'Control+Alt+Shift+J', map: 'Control+Alt+M', mapWorld: 'Control+Alt+Shift+M', themeNext: '', up: 'Control+Alt+Up', down: 'Control+Alt+Down', left: 'Control+Alt+Left', right: 'Control+Alt+Right' }, theme: 'classic', range: { show: false, weapon: 'm4a1', followSlot: true, zoomBy: {}, fov: 70, calib: 1, side: 'right', gap: 70, onlyAds: false, opacity: 0.9, scale: 1 }, compass: { show: false, route: null, leg: 0, opacity: 0.92, scale: 1, speed: 'sprint', top: 10 }, spotlight: { opacity: 0.9, hideOnBlur: true }, tmap: { world: 'auto', last: 'halsey', opacity: 0.85, size: 0.72, bld: true, hidden: true, custom: true, route: true, events: false, labels: true }, startHidden: false, launchAtStartup: false, moveStep: 1, autoColor: JSON.parse(JSON.stringify(window.AR2AutoColor.DEFAULTS)), whitelist: { enabled: false, apps: [{ id: 'roblox', name: 'Roblox', match: 'Roblox', on: true }, { id: 'minecraft', name: 'Minecraft', match: 'Minecraft', on: false }] }, checklist: { title: 'Objectifs', overlay: false, corner: 'tr', scale: 1, opacity: 0.85, hideDone: false, items: [{ id: 'a', text: 'Trouver un sac à dos', done: true }, { id: 'b', text: 'Une arme à feu + 2 chargeurs', done: false }] }, timer: { overlay: true, corner: 'tl', scale: 1, opacity: 0.9, sound: true, volume: 0.5, warn: 30, warnBeep: false, keepDone: 45, presets: [{ id: 'caisses', name: 'Caisses militaires', min: 15 }, { id: 'helico', name: 'Hélico crashé', min: 10 }, { id: 'boost', name: 'Boost', min: 5 }], running: [] } }, autoColor: { samples: 0 }, fgTitle: null, presets: { debut: 'Début de partie', militaire: 'Run militaire', boss: 'Chasse au boss' }, visible: true, displays: [{ i: 0, label: 'Écran 1 – 1920×1080 (principal)' }], version: '1.8.2', update: { state: 'none', mode: 'auto', version: '1.8.2' }, hook: { started: true }, installed: true };
    const cur = () => st.cfg.profiles[st.cfg.active].settings;
    window.xh = {
        getState: async () => st, update: async p => { Object.assign(cur(), p); return st; },
        setConfig: async p => { if (p.autoSwitch) { const a = p.autoSwitch; st.cfg.autoSwitch = Object.assign({}, st.cfg.autoSwitch, a, { slots: Object.assign({}, st.cfg.autoSwitch.slots, a.slots || {}), labels: Object.assign({}, st.cfg.autoSwitch.labels, a.labels || {}) }); delete p.autoSwitch; } Object.assign(st.cfg, p); if (p.hotkeys) st.cfg.hotkeys = Object.assign({}, st.cfg.hotkeys, p.hotkeys); return { ...st, fails: [] }; },
        profile: async ({ action, name, index, code }) => {
            if (action === 'add') { st.cfg.profiles.push({ id: 'p' + Date.now(), name: String(name || 'Nouveau profil').trim().slice(0, 40), settings: C.withDefaults(JSON.parse(JSON.stringify(cur()))) }); st.cfg.active = st.cfg.profiles.length - 1; }
            if (action === 'rename' && st.cfg.profiles[index]) { const n = String(name || '').trim().slice(0, 40); if (n) st.cfg.profiles[index].name = n; }
            if (action === 'delete' && st.cfg.profiles.length > 1 && st.cfg.profiles[index]) { const active = st.cfg.active; st.cfg.profiles.splice(index, 1); st.cfg.active = index < active ? active - 1 : Math.min(active, st.cfg.profiles.length - 1); }
            if (action === 'reset') { st.cfg.profiles = C.PRESETS.map((p, i) => ({ id: 'p' + i, name: p.name, settings: C.withDefaults(p.s) })); st.cfg.active = 0; }
            if (action === 'import') { st.cfg.profiles.push({ id: 'p' + Date.now(), name: String(name || 'Profil importé').trim().slice(0, 40), settings: C.withDefaults(C.fromCode(code)) }); st.cfg.active = st.cfg.profiles.length - 1; }
            return st;
        },
        setVisible: async v => { st.visible = v; return st; },
        setExtras: async p => { ['autoColor', 'whitelist', 'checklist', 'timer'].forEach(k => { if (p[k]) st.cfg[k] = Object.assign({}, st.cfg[k], p[k]); }); return st; },
        checklistPreset: async k => { st.cfg.checklist.items = ['Objectif A', 'Objectif B', 'Objectif C'].map((t, i) => ({ id: k + i, text: t, done: false })); st.cfg.checklist.title = st.presets[k]; return st; },
        wlCapture: async () => ({ ok: true, title: 'Roblox' }),
        timerStart: async w => { const t = st.cfg.timer, p = typeof w === 'number' ? t.presets[w] : { id: null, name: w.name, min: w.sec ? w.sec / 60 : w.min }; const ex = p.id && t.running.find(r => r.preset === p.id); const dur = p.min * 60; if (ex) { ex.end = Date.now() + dur * 1000; ex.doneAt = null; } else t.running.push({ id: Math.random().toString(36).slice(2), preset: p.id, name: p.name, dur, end: Date.now() + dur * 1000, doneAt: null }); st.now = Date.now(); return st; },
        timerStop: async id => { st.cfg.timer.running = id === 'all' ? [] : st.cfg.timer.running.filter(r => r.id !== id); return st; },
        timerAdd: async ({ id, sec }) => { const r = st.cfg.timer.running.find(x => x.id === id); if (r) { r.end += sec * 1000; r.doneAt = null; } return st; },
        aimOpen: async () => { window.open('aim.html'); return true; },
        hudExtras: async p => { ['range', 'compass', 'spotlight', 'tmap'].forEach(k => { if (p[k]) st.cfg[k] = Object.assign({}, st.cfg[k], p[k]); }); if (p.theme) { st.cfg.theme = p.theme; window.AR2Tools.applyTheme(p.theme); } if ('clearRoute' in p) st.cfg.compass.route = null; return st; },
        getTheme: async () => st.cfg.theme, setTheme: async id => { st.cfg.theme = id; window.AR2Tools.applyTheme(id); return id; }, onTheme: () => {},
        wikiOpen: async () => { window.open('../../index.html'); return true; },
        backupExport: async o => { const b = { app: 'ar2-crosshair', format: 1, version: st.version, data: { profiles: st.cfg.profiles, autoColor: st.cfg.autoColor, whitelist: st.cfg.whitelist, checklist: st.cfg.checklist, hotkeys: st.cfg.hotkeys } }; return o && o.as === 'code' ? 'AR2CFG-' + btoa(unescape(encodeURIComponent(JSON.stringify(b)))) : JSON.stringify(b, null, 2); },
        backupSave: async () => ({ ok: true, file: 'ar2-crosshair-sauvegarde.json' }), backupOpen: async () => null,
        backupInspect: async t => { let x = String(t).trim(); if (/^AR2(CFG|SAVE)-/.test(x)) x = decodeURIComponent(escape(atob(x.replace(/^AR2(CFG|SAVE)-/, '')))); if (/^AR2X-/.test(x)) return { sections: ['profiles'] }; const o = JSON.parse(x); if (o.app === 'ar2-armory') return { sections: ['profiles'] }; if (o.app !== 'ar2-crosshair') throw new Error('format inconnu'); return { sections: Object.keys(o.data) }; },
        backupImport: async ({ text }) => { const r = await window.xh.backupInspect(text); return { ...st, done: r.sections, fails: [] }; }, openUrl: async () => {}, checkUpdate: async () => st, installUpdate: async () => false, onState: () => {}, onSettings: () => {}
    };
}

let S = null, bg = 'game', zoom = 1, pvColor = null, pvPick = null;
const $ = s => document.querySelector(s);
const cur = () => S.cfg.profiles[S.cfg.active].settings;
const SW = ['#00ff88', '#ff2d55', '#ffffff', '#22d3ee', '#facc15', '#fb923c', '#e879f9', '#a3e635', '#3b82f6', '#000000'];
const HK_LABELS = { toggle: 'Afficher / masquer', settings: 'Ouvrir les réglages', nextProfile: 'Profil suivant', center: 'Recentrer', timer: 'Minuteur : afficher / masquer', timer1: 'Minuteur 1 (lancer / relancer)', timer2: 'Minuteur 2 (lancer / relancer)', timer3: 'Minuteur 3 (lancer / relancer)', timerStop: 'Arrêter les minuteurs', spotlight: 'Wiki instantané (par-dessus le jeu)', wiki: 'Ouvrir le wiki AR2 complet', range: 'Télémètre : afficher / masquer', rangeZoom: 'Télémètre : lunette suivante', compass: 'Boussole : afficher / masquer', compassNext: 'Boussole : étape suivante', compassPrev: 'Boussole : étape précédente', map: 'Carte tactique (appui court / maintenu)', mapWorld: 'Carte tactique : changer de carte', themeNext: 'Thème suivant', autoColor: 'Couleur auto on / off', checklist: 'Objectifs à l\'écran', checkNext: 'Cocher l\'objectif suivant', up: 'Déplacer vers le haut', down: 'Déplacer vers le bas', left: 'Déplacer vers la gauche', right: 'Déplacer vers la droite' };

function drawBg(ctx, w, h) {
    if (bg === 'dark') { ctx.fillStyle = '#14171c'; ctx.fillRect(0, 0, w, h); return; }
    if (bg === 'light') { ctx.fillStyle = '#e8ecef'; ctx.fillRect(0, 0, w, h); return; }
    if (bg === 'sky') { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7cc4f5'); g.addColorStop(1, '#d6eefc'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); return; }
    // « Jeu » : paysage stylisé (ciel, collines, forêt, route)
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8fb7cf'); g.addColorStop(.55, '#c9d6d0'); g.addColorStop(.56, '#4f6b3a'); g.addColorStop(1, '#2f4423');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5d7550'; ctx.beginPath(); ctx.moveTo(0, h * .58); for (let x = 0; x <= w; x += 40) ctx.lineTo(x, h * .5 + Math.sin(x / 90) * 18 + Math.cos(x / 37) * 6); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = '#26381e'; for (let x = 10; x < w; x += 26) { const y = h * .55 + Math.sin(x / 60) * 10; ctx.beginPath(); ctx.moveTo(x, y - 30 - (x % 3) * 6); ctx.lineTo(x - 11, y + 4); ctx.lineTo(x + 11, y + 4); ctx.fill(); }
    ctx.fillStyle = '#6b6b66'; ctx.beginPath(); ctx.moveTo(w * .46, h * .6); ctx.lineTo(w * .54, h * .6); ctx.lineTo(w * .8, h); ctx.lineTo(w * .2, h); ctx.fill();
    ctx.fillStyle = '#7d5a3c'; ctx.fillRect(w * .62, h * .44, 70, 46); ctx.fillStyle = '#5b3f29'; ctx.beginPath(); ctx.moveTo(w * .62 - 6, h * .44); ctx.lineTo(w * .62 + 35, h * .44 - 24); ctx.lineTo(w * .62 + 76, h * .44); ctx.fill();
}
function renderPreview() {
    const cv = $('#pv'), box = cv.parentElement, dpr = window.devicePixelRatio || 1;
    const w = box.clientWidth, h = box.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBg(ctx, w, h);
    let s = cur();
    const a = S.cfg.autoColor;
    if (a && a.enabled && window.AR2AutoColor) {
        // simulation dans l'aperçu : même calcul que dans le jeu, sur le fond de l'aperçu
        const z = Math.max(20, Math.min(Math.min(w, h) - 4, a.zone / zoom)) * dpr;
        const img = ctx.getImageData(Math.round(w * dpr / 2 - z / 2), Math.round(h * dpr / 2 - z / 2), Math.round(z), Math.round(z));
        const an = AR2AutoColor.analyze(img.data, img.width * img.height);
        if (an) { const r = AR2AutoColor.pick(an, a, pvColor); pvColor = r.color; s = Object.assign({}, s, { color: r.color }, a.outline ? { outlineColor: r.outline } : {}, a.glow ? { glowColor: r.color } : {}); pvPick = r; }
    } else pvPick = null;
    if (S.cfg.autoColor) renderACLive();
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.imageSmoothingEnabled = false;
    C.draw(ctx, 0, 0, s);
    ctx.restore();
}
function mini(cv, s, size) {
    const dpr = window.devicePixelRatio || 1; cv.width = size * dpr; cv.height = size * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ext = C.extent(s); const k = Math.min(1.4, (size / 2 - 2) / Math.max(ext / 1.5, 1));
    ctx.translate(size / 2, size / 2); ctx.scale(k, k); C.draw(ctx, 0, 0, s);
}
function renderProfiles() {
    $('#profile-list').innerHTML = S.cfg.profiles.map((p, i) => `<div class="pitem ${i === S.cfg.active ? 'active' : ''}" data-p="${i}"><canvas width="28" height="28"></canvas><span></span></div>`).join('');
    document.querySelectorAll('.pitem').forEach((el, i) => { el.querySelector('span').textContent = S.cfg.profiles[i].name; mini(el.querySelector('canvas'), S.cfg.profiles[i].settings, 28); });
}
function profileMessage(text, ok = false) {
    const el = $('#profile-msg');
    el.textContent = text;
    el.className = 'small ' + (ok ? 'ok' : 'err');
}
function renderStyles() {
    const s = cur();
    $('#styles').innerHTML = Object.entries(C.STYLES).map(([k, l]) => `<button class="style-btn ${s.style === k ? 'active' : ''}" data-style="${k}"><canvas></canvas>${l}</button>`).join('');
    document.querySelectorAll('.style-btn').forEach(b => mini(b.querySelector('canvas'), { ...s, style: b.dataset.style, offsetX: 0, offsetY: 0 }, 44));
}
function renderCustomEditor() {
    const s = cur(), box = $('#custom-editor');
    if (!box) return;
    box.classList.toggle('hidden', s.style !== 'custom');
    const options = Object.entries(C.STYLES).filter(([key]) => key !== 'custom').map(([key, label]) => `<option value="${key}">${label}</option>`).join('');
    $('#custom-add-type').innerHTML = options;
    const parts = Array.isArray(s.customParts) ? s.customParts.slice(0, 24) : [];
    $('#custom-parts').innerHTML = parts.length ? parts.map((p, i) => `
        <div class="custom-part" data-part="${i}">
            <div class="custom-part-title"><b>Élément ${i + 1}</b><button class="ib" type="button" title="Supprimer cet élément" data-custom-remove="${i}">×</button></div>
            <div class="custom-part-grid">
                <label>Forme<select data-part-key="style">${Object.entries(C.STYLES).filter(([key]) => key !== 'custom').map(([key,label]) => `<option value="${key}" ${p.style === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
                <label>Taille<input type="number" min="0.5" max="80" step="0.5" data-part-key="size" value="${Number(p.size) || 8}"></label>
                <label>Épaisseur<input type="number" min="0.5" max="12" step="0.5" data-part-key="thickness" value="${Number(p.thickness) || 2}"></label>
                <label>Rotation<input type="number" min="-360" max="360" step="1" data-part-key="rotation" value="${Number(p.rotation) || 0}"></label>
                <label>Horizontal<input type="number" min="-100" max="100" step="1" data-part-key="x" value="${Number(p.x) || 0}"></label>
                <label>Vertical<input type="number" min="-100" max="100" step="1" data-part-key="y" value="${Number(p.y) || 0}"></label>
                <label>Couleur<input type="color" data-part-key="color" value="${/^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color : s.color}"></label>
            </div>
        </div>`).join('') : '<p class="muted small custom-empty">Aucun élément. Ajoute une forme pour commencer à créer ton viseur.</p>';
}
function renderControls() {
    const s = cur();
    document.querySelectorAll('[data-k]').forEach(el => {
        const k = el.dataset.k;
        if (el.type === 'checkbox') el.checked = !!s[k]; else el.value = s[k];
    });
    document.querySelectorAll('[data-v]').forEach(el => { const k = el.dataset.v, v = s[k]; el.textContent = k === 'opacity' ? Math.round(v * 100) + ' %' : k === 'rotation' ? v + '°' : k === 'scale' ? 'x' + v : v + ' px'; });
    $('#swatches').innerHTML = SW.map(c => `<div class="sw" data-sw="${c}" style="background:${c}"></div>`).join('');
    $('#display').innerHTML = S.displays.map(d => `<option value="${d.i}" ${d.i === S.cfg.display ? 'selected' : ''}>${d.label}</option>`).join('');
    $('#step').value = S.cfg.moveStep || 1;
    $('#startHidden').checked = !!S.cfg.startHidden; $('#launchAtStartup').checked = !!S.cfg.launchAtStartup;
    $('#code-out').value = C.toCode(s);
    const vb = $('#vis-btn'); vb.textContent = S.visible ? 'Crosshair affiché' : 'Crosshair masqué'; vb.classList.toggle('off', !S.visible);
    $('#ver').textContent = 'v' + (S.version || '1.0.0');
    document.querySelectorAll('[data-bg]').forEach(b => b.classList.toggle('active', b.dataset.bg === bg));
    document.querySelectorAll('[data-zoom]').forEach(b => b.classList.toggle('active', +b.dataset.zoom === zoom));
}
function renderHotkeys() {
    const HK_GROUPS = [['Mon viseur', ['toggle', 'nextProfile', 'center', 'autoColor', 'up', 'down', 'left', 'right']], ['Aides en jeu', ['spotlight', 'range', 'rangeZoom', 'compass', 'compassNext', 'compassPrev', 'map', 'mapWorld', 'checklist', 'checkNext']], ['Minuteur', ['timer', 'timer1', 'timer2', 'timer3', 'timerStop']], ["L'appli", ['settings', 'wiki', 'themeNext']]];
    const seen = new Set(HK_GROUPS.flatMap(g => g[1])); const rest = Object.keys(HK_LABELS).filter(k => !seen.has(k)); if (rest.length) HK_GROUPS.push(['Autres', rest]);
    const hkRow = k => `<div class="hk"><span>${HK_LABELS[k]}</span><input readonly data-hk="${k}" value="${(S.cfg.hotkeys[k] || '').replace(/Control/g, 'Ctrl')}" placeholder="aucun"></div>`;
    $('#hotkeys').innerHTML = HK_GROUPS.map(([t, ks]) => `<div class="hk-group"><h4>${t}</h4>${ks.filter(k => HK_LABELS[k]).map(hkRow).join('')}</div>`).join('');
    { const wk = document.getElementById('wiki-key'); if (wk) wk.textContent = (S.cfg.hotkeys.wiki || 'aucun').replace(/Control/g, 'Ctrl'); }
}
// ---------- Changement d'arme automatique ----------
const W = window.AR2_WEAPONS || [];
function suggestPreset(weapon) {
    const w = W.find(x => x.n.toLowerCase() === String(weapon).trim().toLowerCase()); if (!w) return null;
    const c = w.c;
    const name = /Sniper|Précision/.test(c) ? 'Sniper' : /Pompe/.test(c) ? 'Cercle cyan' : /^Pistolets$|Revolvers/.test(c) ? 'Point rouge' : /PM|SMG|Mitrailleurs/.test(c) ? 'X magenta' : /Mitrailleuses/.test(c) ? 'Croix fine blanche' : 'AR2 vert (défaut)';
    const p = S.cfg.profiles.find(x => x.name === name);
    return p ? p.id : null;
}
function renderAuto() {
    const a = S.cfg.autoSwitch || { slots: {}, labels: {} };
    $('#as-enabled').checked = !!a.enabled; $('#as-roblox').checked = !!a.onlyRoblox;
    $('#as-holster').checked = !!a.holsterHide; $('#as-ads').checked = !!a.adsHide; $('#as-adsmode').value = a.adsMode || 'hold';
    if (!$('#weapon-list').children.length) $('#weapon-list').innerHTML = W.map(w => `<option value="${w.n}">${w.c}</option>`).join('');
    const opts = (sel) => `<option value="">Ne rien changer</option>` + S.cfg.profiles.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}></option>`).join('') + `<option value="__hide" ${sel === '__hide' ? 'selected' : ''}>Masquer le crosshair</option>`;
    const box = $('#slots');
    if (document.activeElement && box.contains(document.activeElement)) { box.querySelectorAll('.slot').forEach(el => el.classList.toggle('hit', +el.dataset.slot === S.lastSlot)); return; }
    box.innerHTML = '<div class="slot muted small"><span></span><span>Arme (facultatif)</span><span>Crosshair</span></div>' + [1, 2, 3, 4, 5, 6, 7, 8].map(n => `<div class="slot ${S.lastSlot === n ? 'hit' : ''}" data-slot="${n}"><span class="k">${n}</span><input list="weapon-list" data-wl="${n}" placeholder="ex : M4A1"><select data-ws="${n}">${opts(a.slots[n])}</select></div>`).join('');
    box.querySelectorAll('[data-wl]').forEach(el => el.value = (a.labels || {})[el.dataset.wl] || '');
    box.querySelectorAll('select[data-ws] option').forEach(o => { const p = S.cfg.profiles.find(x => x.id === o.value); if (p) o.textContent = p.name; });
    const h = S.hook || {};
    $('#as-status').innerHTML = h.started ? `Détection active${S.lastSlot ? ` • dernier emplacement : <b>${S.lastSlot}</b>` : ''}${S.shown === false && S.visible ? ' • crosshair masqué automatiquement' : ''}` : `<span class="err">Détection indisponible${h.error ? ' : ' + h.error : ''}</span>`;
}
function renderUpdate() {
    const u = S.update || {}; const b = $('#upd-banner');
    const txt = { checking: 'Recherche de mise à jour…', downloading: `Téléchargement de la v${u.version} (${u.percent || 0} %)…`, ready: `Téléchargement terminé : la mise à jour v${u.version} est prête. Redémarre pour l’installer.`, available: `Nouvelle version v${u.version} disponible.`, none: `Tu as la dernière version (v${S.version}).`, error: `Erreur : ${u.error || ''}`, idle: '' }[u.state || 'idle'];
    $('#upd-status').textContent = txt; $('#upd-status').className = 'small ' + (u.state === 'error' ? 'err' : u.state === 'ready' || u.state === 'none' ? 'ok' : 'muted');
    $('#autoUpdate').checked = S.cfg.autoUpdate !== false;
    const show = u.state === 'ready' || u.state === 'available';
    b.classList.toggle('hidden', !show);
    if (show) { $('#upd-text').textContent = u.state === 'ready' ? txt : txt + (u.mode === 'manual' ? ' (version portable : télécharge la nouvelle version)' : ''); $('#upd-btn').textContent = u.state === 'ready' ? 'Redémarrer et installer' : 'Télécharger'; }
}
function renderAll() { renderHUD(); renderProfiles(); renderStyles(); renderCustomEditor(); renderControls(); renderHotkeys(); renderAuto(); renderUpdate(); renderPreview(); renderAC(); renderWL(); renderCK(); renderTM(); renderBK(); }

async function upd(partial) {
    Object.assign(cur(), partial);
    S = await xh.update(partial);
    renderControls(); renderPreview(); renderStyles(); renderCustomEditor(); renderProfiles();
}

document.addEventListener('input', e => {
    if (e.target.dataset.partKey) return;
    const k = e.target.dataset.k; if (!k) return;
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' || e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    upd({ [k]: v });
});
document.addEventListener('change', e => {
    const key = e.target.dataset.partKey;
    if (!key) return;
    const row = e.target.closest('[data-part]');
    if (!row) return;
    const index = Number(row.dataset.part), parts = (cur().customParts || []).map(p => ({ ...p }));
    if (!parts[index]) return;
    let value = e.target.value;
    if (e.target.type === 'number') value = Number(value);
    if (key === 'x' || key === 'y') value = Math.max(-100, Math.min(100, Number(value) || 0));
    if (key === 'size') value = Math.max(0.5, Math.min(80, Number(value) || 8));
    if (key === 'thickness') value = Math.max(0.5, Math.min(12, Number(value) || 2));
    if (key === 'rotation') value = Math.max(-360, Math.min(360, Number(value) || 0));
    parts[index][key] = value;
    upd({ customParts: parts });
});
document.addEventListener('click', async e => {
    const t = e.target.closest('[data-style],[data-sw],[data-p],[data-bg],[data-zoom],[data-custom-add],[data-custom-remove]'); if (!t) return;
    if (t.dataset.customAdd !== undefined) {
        const parts = Array.isArray(cur().customParts) ? cur().customParts.slice(0, 24) : [];
        if (parts.length >= 24) return;
        parts.push({ style: $('#custom-add-type').value || 'cross', x: 0, y: 0, size: 8, thickness: 2, rotation: 0, color: cur().color });
        await upd({ style: 'custom', customParts: parts });
    }
    else if (t.dataset.customRemove !== undefined) {
        const parts = (cur().customParts || []).filter((_, i) => i !== Number(t.dataset.customRemove));
        await upd({ customParts: parts });
    }
    else if (t.dataset.style) {
        if (t.dataset.style === 'custom' && !(cur().customParts || []).length) upd({ style: 'custom', customParts: [{ style: 'cross', x: 0, y: 0, size: 8, thickness: 2, rotation: 0, color: cur().color }] });
        else upd({ style: t.dataset.style });
    }
    else if (t.dataset.sw) upd({ color: t.dataset.sw, glowColor: t.dataset.sw });
    else if (t.dataset.p !== undefined) { S = await xh.setConfig({ active: +t.dataset.p }); renderAll(); }
    else if (t.dataset.bg) { bg = t.dataset.bg; renderControls(); renderPreview(); }
    else if (t.dataset.zoom) { zoom = +t.dataset.zoom; renderControls(); renderPreview(); }
});
$('#vis-btn').onclick = async () => { S = await xh.setVisible(!S.visible); renderControls(); };
$('#p-add').onclick = async () => {
    try { S = await xh.profile({ action: 'add', name: `Mon profil ${S.cfg.profiles.length + 1}` }); renderAll(); profileMessage('Profil créé avec une copie indépendante des réglages.', true); }
    catch (err) { profileMessage(err.message || String(err)); }
};
$('#p-rename').onclick = async () => {
    const i = S.cfg.active, el = document.querySelector(`.pitem[data-p="${i}"] span`);
    const inp = document.createElement('input'); inp.value = S.cfg.profiles[i].name; inp.style.width = '100%';
    el.replaceWith(inp); inp.focus(); inp.select();
    let cancelled = false;
    const done = async () => {
        if (cancelled) { renderProfiles(); return; }
        try { S = await xh.profile({ action: 'rename', index: i, name: inp.value }); renderProfiles(); profileMessage('Profil renommé.', true); }
        catch (err) { renderProfiles(); profileMessage(err.message || String(err)); }
    };
    inp.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') inp.blur();
        if (ev.key === 'Escape') { cancelled = true; inp.blur(); }
    });
    inp.addEventListener('blur', done, { once: true });
};
$('#p-del').onclick = async () => {
    if (S.cfg.profiles.length <= 1) return profileMessage('Le dernier profil ne peut pas être supprimé.');
    if (!confirm(`Supprimer le profil « ${S.cfg.profiles[S.cfg.active].name} » ?`)) return;
    try { S = await xh.profile({ action: 'delete', index: S.cfg.active }); renderAll(); profileMessage('Profil supprimé.', true); }
    catch (err) { profileMessage(err.message || String(err)); }
};
$('#p-reset').onclick = async () => { if (!confirm("Remettre les profils d'origine ? Tes profils perso seront effacés.")) return; S = await xh.profile({ action: 'reset' }); renderAll(); };
$('#code-copy').onclick = () => { const i = $('#code-out'); i.select(); navigator.clipboard.writeText(i.value).catch(() => document.execCommand('copy')); $('#code-msg').textContent = 'Code copié.'; $('#code-msg').className = 'small ok'; };
$('#code-import').onclick = async () => {
    try { S = await xh.profile({ action: 'import', code: $('#code-in').value, name: 'Profil importé' }); $('#code-in').value = ''; $('#code-msg').textContent = 'Profil importé.'; $('#code-msg').className = 'small ok'; renderAll(); }
    catch (err) { $('#code-msg').textContent = err.message || 'Code invalide.'; $('#code-msg').className = 'small err'; }
};
$('#center').onclick = () => upd({ offsetX: 0, offsetY: 0 });
$('#step').onchange = async e => { S = await xh.setConfig({ moveStep: parseInt(e.target.value) || 1 }); };
$('#display').onchange = async e => { S = await xh.setConfig({ display: +e.target.value }); };
$('#startHidden').onchange = async e => { S = await xh.setConfig({ startHidden: e.target.checked }); };
$('#launchAtStartup').onchange = async e => { S = await xh.setConfig({ launchAtStartup: e.target.checked }); };

// Capture des raccourcis
document.addEventListener('focusin', e => { if (e.target.dataset.hk) e.target.classList.add('rec'); });
document.addEventListener('focusout', e => { if (e.target.dataset.hk) { e.target.classList.remove('rec'); renderHotkeys(); } });
document.addEventListener('keydown', async e => {
    const el = e.target; if (!el.dataset || !el.dataset.hk) return;
    e.preventDefault();
    if (e.key === 'Escape') { el.blur(); return; }
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
    const mods = []; if (e.ctrlKey) mods.push('Control'); if (e.altKey) mods.push('Alt'); if (e.shiftKey) mods.push('Shift');
    let key = e.key.length === 1 ? e.key.toUpperCase() : ({ ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ' ': 'Space' }[e.key] || e.key);
    if (!mods.length && !/^F\d{1,2}$/.test(key)) { $('#hk-msg').textContent = 'Ajoute au moins Ctrl, Alt ou Shift (sauf touches F1–F24).'; $('#hk-msg').className = 'small err'; return; }
    const acc = [...mods, key].join('+');
    S = await xh.setConfig({ hotkeys: { [el.dataset.hk]: acc } });
    const fails = S.fails || [];
    $('#hk-msg').textContent = fails.length ? `Raccourci déjà utilisé par Windows ou une autre appli : ${fails.join(', ')}` : `Raccourci enregistré : ${acc.replace(/Control/g, 'Ctrl')}`;
    $('#hk-msg').className = 'small ' + (fails.length ? 'err' : 'ok');
    el.blur();
});

xh.onState(s => { S = s; renderAll(); });
window.addEventListener('resize', renderPreview);
xh.getState().then(s => { S = s; renderAll(); });

// Changement d'arme : événements
const setAuto = async a => { S = await xh.setConfig({ autoSwitch: a }); renderAuto(); };
$('#as-enabled').onchange = e => setAuto({ enabled: e.target.checked });
$('#as-roblox').onchange = e => setAuto({ onlyRoblox: e.target.checked });
$('#as-holster').onchange = e => setAuto({ holsterHide: e.target.checked });
$('#as-ads').onchange = e => setAuto({ adsHide: e.target.checked });
$('#as-adsmode').onchange = e => setAuto({ adsMode: e.target.value });
$('#slots').addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.ws) return setAuto({ slots: { [t.dataset.ws]: t.value || null } });
    if (t.dataset.wl) {
        const n = t.dataset.wl, a = { labels: { [n]: t.value.trim() } };
        const sel = document.querySelector(`select[data-ws="${n}"]`);
        if (sel && !sel.value) { const id = suggestPreset(t.value); if (id) { a.slots = { [n]: id }; sel.value = id; } }
        t.blur(); setAuto(a);
    }
});
// Mises à jour
$('#autoUpdate').onchange = async e => { S = await xh.setConfig({ autoUpdate: e.target.checked }); renderUpdate(); };
$('#upd-check').onclick = async () => { $('#upd-status').textContent = 'Recherche de mise à jour…'; S = await xh.checkUpdate(); renderUpdate(); };
$('#upd-btn').onclick = () => xh.installUpdate();

// ================= Couleur automatique =================
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const focused = id => document.activeElement && document.activeElement.id === id;
const setX = async p => { S = await xh.setExtras(p); };
function renderAC() {
    const a = S.cfg.autoColor; if (!a) return;
    $('#ac-enabled').checked = !!a.enabled; $('#ac-mode').value = a.mode;
    if (!focused('ac-interval')) $('#ac-interval').value = a.interval;
    $('#ac-interval-v').textContent = `${a.interval} ms (${(1000 / a.interval).toFixed(a.interval >= 1000 ? 1 : 0)} / s)`;
    if (!focused('ac-zone')) $('#ac-zone').value = a.zone; $('#ac-zone-v').textContent = a.zone + ' px';
    if (!focused('ac-sens')) $('#ac-sens').value = a.sensitivity; $('#ac-sens-v').textContent = a.sensitivity + ' %';
    if (!focused('ac-fade')) $('#ac-fade').value = a.fade; $('#ac-fade-v').textContent = a.fade ? a.fade + ' ms' : 'aucun';
    $('#ac-outline').checked = !!a.outline; $('#ac-glow').checked = !!a.glow;
    document.querySelectorAll('[data-aci]').forEach(b => b.classList.toggle('active', +b.dataset.aci === a.interval));
    $('#ac-palette').innerHTML = (a.palette || []).map((c, i) => `<div class="psw" data-pi="${i}" title="${c}" style="background:${c}"></div>`).join('');
    $('#ac-palette').parentElement.style.opacity = a.mode === 'contrast' ? 1 : .5;
    renderACLive();
}
function renderACLive() {
    const a = S.cfg.autoColor, st = S.autoColor || {}; if (!a) return;
    const box = $('#ac-live');
    if (!a.enabled) { box.innerHTML = '<span class="muted">Désactivée : le crosshair garde la couleur du profil.</span>'; return; }
    const m = { stream: 'flux vidéo de l\'écran', thumbnail: 'capture d\'écran (mode secours)' }[st.method] || 'démarrage…';
    const pv = pvPick ? `<span>Aperçu : fond <span class="sq" style="background:${pvPick.bg}"></span> → <span class="sq" style="background:${pvPick.color}"></span></span>` : '';
    box.innerHTML = (st.color ? `<span>Jeu : fond <span class="sq" style="background:${st.bg}"></span> → <span class="sq" style="background:${st.color}"></span> <b>${st.color}</b></span><span class="muted">visibilité ${st.score} • ${m} • ${st.rate || 0} analyses/s</span>` : `<span class="muted">${S.shown === false ? 'Crosshair masqué : analyse en pause.' : 'En attente de la première analyse… (' + m + ')'}</span>`)
        + pv + (st.error ? `<span class="err">${esc(st.error)}</span>` : '');
}
$('#ac-enabled').onchange = async e => { await setX({ autoColor: { enabled: e.target.checked } }); renderAC(); renderPreview(); };
$('#ac-mode').onchange = async e => { pvColor = null; await setX({ autoColor: { mode: e.target.value } }); renderAC(); renderPreview(); };
[['ac-interval', 'interval'], ['ac-zone', 'zone'], ['ac-sens', 'sensitivity'], ['ac-fade', 'fade']].forEach(([id, k]) => {
    $('#' + id).addEventListener('input', e => { S.cfg.autoColor[k] = +e.target.value; renderAC(); if (k === 'zone') renderPreview(); });
    $('#' + id).addEventListener('change', async e => { await setX({ autoColor: { [k]: +e.target.value } }); renderAC(); });
});
$('#ac-outline').onchange = async e => { await setX({ autoColor: { outline: e.target.checked } }); renderPreview(); };
$('#ac-glow').onchange = async e => { await setX({ autoColor: { glow: e.target.checked } }); renderPreview(); };
$('#ac-int-presets').addEventListener('click', async e => { const b = e.target.closest('[data-aci]'); if (!b) return; await setX({ autoColor: { interval: +b.dataset.aci } }); renderAC(); });
$('#ac-palette').addEventListener('click', async e => { const b = e.target.closest('[data-pi]'); if (!b) return; const p = S.cfg.autoColor.palette.slice(); if (p.length <= 2) return; p.splice(+b.dataset.pi, 1); pvColor = null; await setX({ autoColor: { palette: p } }); renderAC(); renderPreview(); });
$('#ac-add').onclick = async () => { const c = $('#ac-add-color').value.toLowerCase(), p = S.cfg.autoColor.palette.slice(); if (p.includes(c) || p.length >= 16) return; p.push(c); await setX({ autoColor: { palette: p } }); renderAC(); renderPreview(); };
$('#ac-pal-reset').onclick = async () => { pvColor = null; await setX({ autoColor: { palette: AR2AutoColor.DEFAULT_PALETTE.slice() } }); renderAC(); renderPreview(); };

// ================= Liste blanche =================
function renderWL() {
    const w = S.cfg.whitelist; if (!w) return;
    $('#wl-enabled').checked = !!w.enabled;
    const box = $('#wl-list');
    if (!(document.activeElement && box.contains(document.activeElement))) {
        box.innerHTML = '<div class="lrow muted small"><span></span><span>Appli</span><span>Le titre de la fenêtre contient</span><span></span></div>' + w.apps.map((a, i) => `<div class="lrow"><input type="checkbox" data-wlon="${i}" ${a.on ? 'checked' : ''}><input type="text" data-wlname="${i}" value="${esc(a.name)}"><input type="text" data-wlmatch="${i}" value="${esc(a.match)}"><button class="ib" data-wldel="${i}" title="Retirer">×</button></div>`).join('');
    }
    const t = S.fgTitle;
    $('#wl-status').innerHTML = !w.enabled ? 'Désactivée : le crosshair s\'affiche partout.' : t === null || t === undefined ? 'Fenêtre active inconnue (Windows seulement) : rien n\'est masqué.' : `Fenêtre active : <b>${esc(t || '(sans titre)')}</b> • ${S.autoHidden && S.autoHidden.wl ? '<span class="err">crosshair masqué</span>' : '<span class="ok">crosshair autorisé</span>'}`;
}
const wlSet = async apps => { await setX({ whitelist: { apps } }); renderWL(); };
$('#wl-enabled').onchange = async e => { await setX({ whitelist: { enabled: e.target.checked } }); renderWL(); };
$('#wl-list').addEventListener('change', e => {
    const t = e.target, apps = JSON.parse(JSON.stringify(S.cfg.whitelist.apps));
    if (t.dataset.wlon !== undefined) apps[+t.dataset.wlon].on = t.checked;
    else if (t.dataset.wlname !== undefined) apps[+t.dataset.wlname].name = t.value.trim() || apps[+t.dataset.wlname].name;
    else if (t.dataset.wlmatch !== undefined) { if (!t.value.trim()) return renderWL(); apps[+t.dataset.wlmatch].match = t.value.trim(); }
    else return;
    t.blur(); wlSet(apps);
});
$('#wl-list').addEventListener('click', e => { const b = e.target.closest('[data-wldel]'); if (!b) return; const apps = S.cfg.whitelist.apps.slice(); apps.splice(+b.dataset.wldel, 1); wlSet(apps); });
$('#wl-add').onclick = () => {
    const m = $('#wl-match').value.trim() || $('#wl-name').value.trim(); if (!m) return;
    const apps = S.cfg.whitelist.apps.concat([{ name: $('#wl-name').value.trim() || m, match: m, on: true }]);
    $('#wl-name').value = ''; $('#wl-match').value = ''; wlSet(apps);
};
$('#wl-cap').onclick = async () => {
    const msg = $('#wl-msg'); let n = 3;
    msg.textContent = `Clique sur la fenêtre du jeu… ${n}`; msg.className = 'small';
    const iv = setInterval(() => { n--; if (n > 0) msg.textContent = `Clique sur la fenêtre du jeu… ${n}`; }, 1000);
    const r = await xh.wlCapture(3000); clearInterval(iv);
    if (!r.ok) { msg.textContent = r.error; msg.className = 'small err'; return; }
    const title = (r.title || '').trim();
    if (!title) { msg.textContent = 'Fenêtre sans titre.'; msg.className = 'small err'; return; }
    if (S.cfg.whitelist.apps.some(a => a.match.toLowerCase() === title.toLowerCase())) { msg.textContent = `« ${title} » est déjà dans la liste.`; msg.className = 'small muted'; return; }
    await wlSet(S.cfg.whitelist.apps.concat([{ name: title.slice(0, 40), match: title, on: true }]));
    msg.textContent = `Ajouté : « ${title} »`; msg.className = 'small ok';
};

// ================= Objectifs =================
const uidc = () => Math.random().toString(36).slice(2, 10);
function renderCK() {
    const c = S.cfg.checklist; if (!c) return;
    if (!focused('ck-title')) $('#ck-title').value = c.title || '';
    const box = $('#ck-list');
    if (!(document.activeElement && box.contains(document.activeElement) && document.activeElement.type === 'text')) {
        box.innerHTML = c.items.length ? c.items.map((it, i) => `<div class="ckrow ${it.done ? 'done' : ''}"><input type="checkbox" data-ckdone="${i}" ${it.done ? 'checked' : ''}><input type="text" data-cktext="${i}" value="${esc(it.text)}" maxlength="120"><button class="ib mv" data-ckup="${i}" title="Monter">↑</button><button class="ib mv" data-ckdown="${i}" title="Descendre">↓</button><button class="ib" data-ckdel="${i}" title="Supprimer">×</button></div>`).join('') : '<p class="muted small">Aucun objectif. Ajoute-en un ou prends une liste toute prête.</p>';
    }
    const done = c.items.filter(i => i.done).length;
    $('#ck-box summary').textContent = `Objectifs (liste à cocher) • ${done}/${c.items.length}`;
    $('#ck-presets').innerHTML = '<span class="muted small">Listes prêtes :</span>' + Object.entries(S.presets || {}).map(([k, n]) => `<button class="chip" data-ckp="${k}">${esc(n)}</button>`).join('');
    $('#ck-overlay').checked = !!c.overlay; $('#ck-corner').value = c.corner || 'tr'; $('#ck-hidedone').checked = !!c.hideDone;
    if (!focused('ck-scale')) $('#ck-scale').value = c.scale; $('#ck-scale-v').textContent = 'x' + (+c.scale).toFixed(1);
    if (!focused('ck-op')) $('#ck-op').value = c.opacity; $('#ck-op-v').textContent = Math.round(c.opacity * 100) + ' %';
}
const ckSet = async p => { await setX({ checklist: p }); renderCK(); };
const ckItems = () => JSON.parse(JSON.stringify(S.cfg.checklist.items));
$('#ck-list').addEventListener('change', e => {
    const t = e.target, it = ckItems();
    if (t.dataset.ckdone !== undefined) it[+t.dataset.ckdone].done = t.checked;
    else if (t.dataset.cktext !== undefined) { const v = t.value.trim(); if (v) it[+t.dataset.cktext].text = v; t.blur(); }
    else return;
    ckSet({ items: it });
});
$('#ck-list').addEventListener('click', e => {
    const b = e.target.closest('[data-ckup],[data-ckdown],[data-ckdel]'); if (!b) return;
    const it = ckItems();
    if (b.dataset.ckdel !== undefined) it.splice(+b.dataset.ckdel, 1);
    else { const i = +(b.dataset.ckup ?? b.dataset.ckdown), j = b.dataset.ckup !== undefined ? i - 1 : i + 1; if (j < 0 || j >= it.length) return; [it[i], it[j]] = [it[j], it[i]]; }
    ckSet({ items: it });
});
const ckAdd = () => { const v = $('#ck-new').value.trim(); if (!v) return; $('#ck-new').value = ''; ckSet({ items: ckItems().concat([{ id: uidc(), text: v, done: false }]) }); };
$('#ck-add').onclick = ckAdd;
$('#ck-new').addEventListener('keydown', e => { if (e.key === 'Enter') ckAdd(); });
$('#ck-title').addEventListener('change', e => ckSet({ title: e.target.value.trim() || 'Objectifs' }));
$('#ck-presets').addEventListener('click', async e => { const b = e.target.closest('[data-ckp]'); if (!b) return; if (S.cfg.checklist.items.length && !confirm('Remplacer ta liste actuelle par « ' + b.textContent + ' » ?')) return; S = await xh.checklistPreset(b.dataset.ckp); renderCK(); });
$('#ck-uncheck').onclick = () => ckSet({ items: ckItems().map(i => ({ ...i, done: false })) });
$('#ck-clean').onclick = () => ckSet({ items: ckItems().filter(i => !i.done) });
$('#ck-paste-btn').onclick = () => $('#ck-paste-box').classList.toggle('hidden');
// Une ligne = un objectif. Nettoie les puces, le gras et les lignes de la fiche Défi (« > Contrainte : … »)
function parseLines(txt) {
    return String(txt || '').split(/\r?\n/).map(l => l.replace(/\*\*/g, '').replace(/^\s*(>|-|\*|•|\d+[.)]|\[[ xX]?\])\s*/, '').trim())
        .filter(l => l && !/^(lien|link)\s*:/i.test(l) && !/^https?:\/\//.test(l) && !/^DÉFI AR2/i.test(l))
        .map(l => l.replace(/^(Contrainte|Objectif|Spawn|Arme imposée)\s*:\s*/i, (m, k) => /contrainte/i.test(k) ? '' : k + ' : '))
        .map(l => l.slice(0, 120));
}
$('#ck-paste-go').onclick = () => { const L = parseLines($('#ck-paste').value); if (!L.length) return; $('#ck-paste').value = ''; $('#ck-paste-box').classList.add('hidden'); ckSet({ items: ckItems().concat(L.map(t => ({ id: uidc(), text: t, done: false }))) }); };
$('#ck-overlay').onchange = e => ckSet({ overlay: e.target.checked });
$('#ck-corner').onchange = e => ckSet({ corner: e.target.value, x: null, y: null });
$('#ck-hidedone').onchange = e => ckSet({ hideDone: e.target.checked });
[['ck-scale', 'scale'], ['ck-op', 'opacity']].forEach(([id, k]) => {
    $('#' + id).addEventListener('input', e => { S.cfg.checklist[k] = +e.target.value; renderCK(); });
    $('#' + id).addEventListener('change', e => ckSet({ [k]: +e.target.value }));
});

// ================= Sauvegarde =================
const BK = { profiles: 'Profils', autoSwitch: "Changement d'arme", autoColor: 'Couleur auto', whitelist: 'Liste blanche', checklist: 'Objectifs', timer: 'Minuteur', hud: 'Thème, télémètre, boussole', hotkeys: 'Raccourcis', general: 'Réglages généraux' };
let bkSel = Object.keys(BK);
function renderBK() {
    $('#bk-sections').innerHTML = Object.entries(BK).map(([k, l]) => `<label class="tog small"><input type="checkbox" data-bks="${k}" ${bkSel.includes(k) ? 'checked' : ''}> ${l}</label>`).join('');
}
const bkMsg = (t, ok = true) => { $('#bk-msg').textContent = t; $('#bk-msg').className = 'small mt-s ' + (ok ? 'ok' : 'err'); };
$('#bk-sections').addEventListener('change', e => { const k = e.target.dataset.bks; if (!k) return; bkSel = e.target.checked ? [...new Set(bkSel.concat(k))] : bkSel.filter(x => x !== k); });
$('#bk-save').onclick = async () => { if (!bkSel.length) return bkMsg('Coche au moins une partie à exporter.', false); const r = await xh.backupSave({ sections: bkSel }); if (r && r.ok) bkMsg('Sauvegarde enregistrée : ' + r.file); };
$('#bk-copy').onclick = async () => {
    if (!bkSel.length) return bkMsg('Coche au moins une partie à exporter.', false);
    const code = await xh.backupExport({ sections: bkSel, as: 'code' });
    try { await navigator.clipboard.writeText(code); } catch (e) { $('#bk-in').value = code; $('#bk-in').select(); document.execCommand('copy'); }
    bkMsg(`Code copié (${Math.round(code.length / 1024 * 10) / 10} Ko). Colle-le dans l'appli sur un autre PC ou envoie-le à un ami.`);
};
$('#bk-open').onclick = async () => { const t = await xh.backupOpen(); if (t) { $('#bk-in').value = t; inspect(); } };
async function inspect() {
    const t = $('#bk-in').value.trim(); if (!t) return null;
    try { const r = await xh.backupInspect(t); bkMsg('Sauvegarde reconnue : ' + r.sections.map(k => BK[k] || k).join(', ') + (r.exported ? ` (du ${new Date(r.exported).toLocaleDateString('fr-FR')})` : '')); return r; }
    catch (e) { bkMsg('Code ou fichier non reconnu : ' + String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), false); return null; }
}
$('#bk-in').addEventListener('change', inspect);
$('#bk-import').onclick = async () => {
    const r = await inspect(); if (!r) return;
    const mode = document.querySelector('input[name=bk-mode]:checked').value;
    if (mode === 'replace' && !confirm('Remplacer tes réglages par ceux de la sauvegarde ? (seulement les parties cochées)')) return;
    try {
        const res = await xh.backupImport({ text: $('#bk-in').value, mode, sections: bkSel });
        S = res; renderAll();
        bkMsg('Importé : ' + (res.done || []).map(k => BK[k] || k).join(', ') + ((res.fails || []).length ? ` • raccourcis déjà pris : ${res.fails.join(', ')}` : ''));
        $('#bk-in').value = '';
    } catch (e) { bkMsg('Import impossible : ' + String(e.message || e), false); }
};

// ================= Minuteur tactique =================
const hkTxt = a => (a || '—').replace('Control', 'Ctrl');
const tmFmt = ms => { const x = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(x / 3600), m = Math.floor(x % 3600 / 60), sc = x % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sc).padStart(2, '0'); };
let tmSkew = 0;
function renderTM() {
    const t = S.cfg.timer; if (!t) return;
    if (S.now) tmSkew = Date.now() - S.now;
    const h = S.cfg.hotkeys;
    $('#tm-keys').innerHTML = `<b>${hkTxt(h.timer)}</b> afficher / masquer • <b>${hkTxt(h.timer1)}</b>, <b>${hkTxt(h.timer2)}</b>, <b>${hkTxt(h.timer3)}</b> lancer (rappuie pour relancer) • <b>${hkTxt(h.timerStop)}</b> tout arrêter`;
    const box = $('#tm-presets');
    if (!(document.activeElement && box.contains(document.activeElement))) {
        box.innerHTML = t.presets.map((p, i) => `<div class="tmrow"><span class="k">${hkTxt(h['timer' + (i + 1)]).replace('Ctrl+Alt+', 'C+A+')}</span><input type="text" data-tmname="${i}" value="${esc(p.name)}" maxlength="30"><input type="number" data-tmmin="${i}" value="${p.min}" min="0.1" max="240" step="0.5" title="minutes"><button class="btn sm" data-tmgo="${i}">Lancer</button></div>`).join('');
    }
    $('#tm-overlay').checked = !!t.overlay; $('#tm-corner').value = t.corner; $('#tm-sound').checked = !!t.sound; $('#tm-warnbeep').checked = !!t.warnBeep;
    [['tm-vol', 'volume', v => Math.round(v * 100) + ' %'], ['tm-warn', 'warn', v => v ? v + ' s' : 'jamais'], ['tm-keep', 'keepDone', v => v + ' s'], ['tm-scale', 'scale', v => 'x' + (+v).toFixed(1)], ['tm-op', 'opacity', v => Math.round(v * 100) + ' %']].forEach(([id, k, f]) => { if (!focused(id)) $('#' + id).value = t[k]; $('#' + id + '-v').textContent = f(t[k]); });
    renderTMRun();
}
function renderTMRun() {
    const t = S.cfg.timer, box = $('#tm-run'); if (!t || !box) return;
    const now = Date.now() - tmSkew;
    box.innerHTML = t.running.length ? t.running.map(r => { const left = r.end - now, done = !!r.doneAt || left <= 0, warn = !done && t.warn && left <= t.warn * 1000; return `<div class="tmrun ${done ? 'd' : warn ? 'w' : ''}"><span>${esc(r.name)}</span><b>${done ? 'PRÊT' : tmFmt(left)}</b><button class="ib" data-tmadd="${r.id}" title="+1 minute">+1</button><button class="ib" data-tmstop="${r.id}" title="Arrêter">×</button></div>`; }).join('') + '<button class="btn sm ghost" data-tmstop="all">Tout arrêter</button>' : '<p class="muted small">Aucun minuteur en cours.</p>';
}
setInterval(() => { if (S && S.cfg.timer && S.cfg.timer.running.length) renderTMRun(); }, 250);
const tmSet = async p => { await setX({ timer: p }); renderTM(); };
$('#tm-presets').addEventListener('change', e => {
    const t = e.target, P = JSON.parse(JSON.stringify(S.cfg.timer.presets));
    if (t.dataset.tmname !== undefined) P[+t.dataset.tmname].name = t.value.trim() || P[+t.dataset.tmname].name;
    else if (t.dataset.tmmin !== undefined) P[+t.dataset.tmmin].min = Math.max(0.1, Math.min(240, +t.value || 5));
    else return;
    t.blur(); tmSet({ presets: P });
});
$('#tm-presets').addEventListener('click', async e => { const b = e.target.closest('[data-tmgo]'); if (!b) return; S = await xh.timerStart(+b.dataset.tmgo); renderTM(); });
$('#tm-run').addEventListener('click', async e => {
    const a = e.target.closest('[data-tmadd]'), b = e.target.closest('[data-tmstop]');
    if (a) S = await xh.timerAdd({ id: a.dataset.tmadd, sec: 60 }); else if (b) S = await xh.timerStop(b.dataset.tmstop); else return;
    renderTM();
});
$('#tm-cgo').onclick = async () => { const n = $('#tm-cname').value.trim() || 'Minuteur', m = Math.max(0.1, Math.min(240, +$('#tm-cmin').value || 3)); S = await xh.timerStart({ name: n, min: m }); $('#tm-cname').value = ''; renderTM(); };
$('#tm-overlay').onchange = e => tmSet({ overlay: e.target.checked });
$('#tm-corner').onchange = e => tmSet({ corner: e.target.value });
$('#tm-sound').onchange = e => tmSet({ sound: e.target.checked });
$('#tm-warnbeep').onchange = e => tmSet({ warnBeep: e.target.checked });
[['tm-vol', 'volume'], ['tm-warn', 'warn'], ['tm-keep', 'keepDone'], ['tm-scale', 'scale'], ['tm-op', 'opacity']].forEach(([id, k]) => {
    $('#' + id).addEventListener('input', e => { S.cfg.timer[k] = +e.target.value; renderTM(); });
    $('#' + id).addEventListener('change', e => tmSet({ [k]: +e.target.value }));
});
let tmCtx = null;
$('#tm-test').onclick = () => {
    try {
        tmCtx = tmCtx || new AudioContext(); const v = S.cfg.timer.volume;
        [[880, 0, 0.14], [880, 0.22, 0.14], [1175, 0.44, 0.22]].forEach(([f, at, d]) => { const o = tmCtx.createOscillator(), g = tmCtx.createGain(), t0 = tmCtx.currentTime + at; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.5), t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(tmCtx.destination); o.start(t0); o.stop(t0 + d + 0.05); });
    } catch (e) {}
};
$('#aim-open').onclick = () => xh.aimOpen();
$('#wiki-open').onclick = () => xh.wikiOpen();
document.querySelectorAll('[data-wiki-tab]').forEach(b => { b.onclick = () => xh.wikiOpen(b.dataset.wikiTab); });

// ================= v1.5 : thème, wiki instantané, télémètre, boussole =================
const TT = window.AR2Tools;
function hudInfo() {
    if (S.hud) return S.hud;
    // mode démo : calcul local
    const th = TT.THEME_ORDER.map(id => ({ id, name: TT.THEMES[id].name, desc: TT.THEMES[id].desc, acc: TT.THEMES[id].acc, bg: TT.THEMES[id].bg }));
    return { themes: th, indexItems: 0, range: { weapon: 'M4A1', src: 'manuel', scope: 'Visée mécanique (1x)', z: 1, scopes: [{ id: 'iron', name: 'Visée mécanique (1x)', z: 1 }, { id: 'ocr', name: 'OCR Sight (4x)', z: 4 }] }, compass: null };
}
const hk = k => hkTxt(S.cfg.hotkeys[k]).replace(/Shift/g, 'Maj');
const hudSet = async p => { S = await xh.hudExtras(p); renderHUD(); };
function slider(id, val, fmt) { const el = $('#' + id); if (!el) return; if (document.activeElement !== el) el.value = val; const v = $('#' + id + '-v'); if (v) v.textContent = fmt(+el.value); }
function renderHUD() {
    if (!S || !S.cfg.range) return;
    const H = hudInfo(), r = S.cfg.range, k = S.cfg.compass, sp = S.cfg.spotlight, cur = S.cfg.theme || 'classic';
    TT.applyTheme(cur);
    $('#th-list').innerHTML = H.themes.map(t => { const T0 = TT.THEMES[t.id]; return `<button class="theme-card ${t.id === cur ? 'on' : ''}" data-theme="${t.id}" style="--th-bg:${T0.card};--th-bd:${T0.border};--th-acc:${T0.acc};--th-tx:${T0.text}"><b><i></i>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`; }).join('');
    $('#sp-key').textContent = hk('spotlight'); $('#rg-key').textContent = hk('range'); $('#rg-zkey').textContent = hk('rangeZoom'); $('#cp-key').textContent = hk('compass'); $('#cp-nkey').textContent = hk('compassNext');
    slider('sp-op', sp.opacity, v => Math.round(v * 100) + ' %'); $('#sp-blur').checked = !!sp.hideOnBlur;
    $('#sp-info').textContent = H.indexItems ? `Données du wiki : ${H.indexItems} fiches${H.indexDate ? ' (mises à jour le ' + new Date(H.indexDate).toLocaleDateString('fr-FR') + ')' : ''}. Elles se mettent à jour toutes seules quand tu ouvres le wiki complet.` : '';
    // télémètre
    $('#rg-show').checked = !!r.show; $('#rg-follow').checked = !!r.followSlot; $('#rg-ads').checked = !!r.onlyAds; $('#rg-side').value = r.side;
    const ws = S.weapons || [];
    const weaponSearch = $('#rg-weapon-search'), weaponResults = $('#rg-weapon-results');
    const selectedWeapon = ws.find(w => w.id === r.weapon);
    if (document.activeElement !== weaponSearch) {
        weaponSearch.value = selectedWeapon ? selectedWeapon.name : (r.weapon || 'M4A1');
        weaponResults.classList.add('hidden');
        weaponResults.innerHTML = '';
    }
    const sc = $('#rg-scope'), R = H.range;
    if (R && document.activeElement !== sc) { sc.innerHTML = R.scopes.map(s => `<option value="${s.z}">${esc(s.name)}</option>`).join(''); sc.value = String(R.z); }
    slider('rg-gap', r.gap, v => v + ' px'); slider('rg-fov', r.fov, v => v + '°'); slider('rg-cal', r.calib, v => 'x' + v.toFixed(2)); slider('rg-scale', r.scale, v => 'x' + v.toFixed(1)); slider('rg-op', r.opacity, v => Math.round(v * 100) + ' %');
    $('#rg-info').innerHTML = R ? `Arme mesurée : <b>${esc(R.weapon)}</b> · ${esc(R.scope)} <span class="muted">(${esc(R.src)})</span>` : 'Aucune arme.';
    // boussole
    $('#cp-show').checked = !!k.show; $('#cp-speed').value = k.speed;
    slider('cp-top', k.top, v => v + ' px'); slider('cp-scale', k.scale, v => 'x' + v.toFixed(1)); slider('cp-op', k.opacity, v => Math.round(v * 100) + ' %');
    const D = H.compass;
    $('#cp-info').innerHTML = D && !D.empty ? `Cap actuel : <b>${Math.round(D.deg) % 360}° ${esc(D.card16)}</b> vers <b>${esc(D.to)}</b> depuis ${esc(D.from)} · ${esc(D.dist)}${D.legs > 1 ? ` · étape ${D.leg}/${D.legs}` : ''}` : 'Pas encore de destination.';
    ['cp-prev', 'cp-next', 'cp-clear'].forEach(id => { $('#' + id).disabled = !(D && !D.empty); });
    // carte tactique
    const m = S.cfg.tmap || {};
    $('#tmap-key').textContent = hk('map'); $('#tmap-wkey').textContent = hk('mapWorld');
    if (document.activeElement !== $('#tmap-world')) $('#tmap-world').value = m.world || 'auto';
    ['bld', 'hidden', 'custom', 'route', 'events', 'labels'].forEach(x => { $('#tmap-' + x).checked = !!m[x]; });
    slider('tmap-size', m.size, v => Math.round(v * 100) + ' % de l’écran'); slider('tmap-op', m.opacity, v => Math.round(v * 100) + ' %');
    const tm = H.tmap || {};
    $('#tmap-info').innerHTML = (tm.hasMap === false ? 'La carte se télécharge la première fois que tu ouvres le wiki dans l’appli. ' : '') + (k.route ? `Loot Run actif : <b>${esc(k.route.title || k.route.points.map(p => p.name).join(' → '))}</b> (${k.route.points[0].world === 'kf' ? 'Kin Flats' : 'archipel'}).` : 'Aucun Loot Run actif : envoie-en un depuis le wiki (onglet Loot Run) ou tape « Clinique de Kin > Commissariat de Kin » dans le wiki instantané.');
}
$('#th-list').addEventListener('click', e => { const b = e.target.closest('[data-theme]'); if (b) hudSet({ theme: b.dataset.theme }); });
$('#sp-open').onclick = () => hudSet({ openSpot: true });
$('#sp-refresh').onclick = async () => { await hudSet({ refreshIndex: true }); $('#sp-info').textContent = 'Mise à jour en cours (le site est chargé en arrière-plan)…'; };
$('#sp-blur').onchange = e => hudSet({ spotlight: { hideOnBlur: e.target.checked } });
$('#rg-show').onchange = e => hudSet({ range: { show: e.target.checked } });
$('#rg-follow').onchange = e => hudSet({ range: { followSlot: e.target.checked } });
$('#rg-ads').onchange = e => hudSet({ range: { onlyAds: e.target.checked } });
$('#rg-side').onchange = e => hudSet({ range: { side: e.target.value } });
const rgWeaponSearch = $('#rg-weapon-search'), rgWeaponResults = $('#rg-weapon-results');
function showRangeWeaponResults(query) {
    const all = S.weapons || [], q = String(query || '').trim().toLocaleLowerCase('fr');
    const matches = (q ? all.filter(w => (w.name + ' ' + (w.cat || '') + ' ' + (w.id || '')).toLocaleLowerCase('fr').includes(q)) : []).slice(0, 14);
    rgWeaponResults.innerHTML = matches.length
        ? matches.map(w => `<button type="button" class="rg-weapon-option" data-weapon-id="${esc(w.id)}"><span>${esc(w.name)}</span><small>${esc(w.cat || 'Arme')}</small></button>`).join('')
        : '<div class="rg-weapon-empty">' + (q ? 'Aucune arme trouvée.' : 'Commence à taper le nom d’une arme.') + '</div>';
    rgWeaponResults.classList.remove('hidden');
}
rgWeaponSearch.addEventListener('focus', () => { if (rgWeaponSearch.value.trim()) showRangeWeaponResults(rgWeaponSearch.value); });
rgWeaponSearch.addEventListener('input', () => showRangeWeaponResults(rgWeaponSearch.value));
rgWeaponResults.addEventListener('click', e => {
    const option = e.target.closest('[data-weapon-id]');
    if (!option) return;
    const weapon = (S.weapons || []).find(w => w.id === option.dataset.weaponId);
    if (!weapon) return;
    rgWeaponSearch.value = weapon.name;
    rgWeaponResults.classList.add('hidden');
    rgWeaponSearch.blur();
    hudSet({ range: { weapon: weapon.id, followSlot: false } });
});
rgWeaponSearch.addEventListener('keydown', e => {
    if (e.key === 'Escape') { rgWeaponResults.classList.add('hidden'); rgWeaponSearch.blur(); }
    if (e.key === 'Enter') {
        const first = rgWeaponResults.querySelector('[data-weapon-id]');
        if (first) first.click();
    }
});
document.addEventListener('click', e => {
    if (!e.target.closest('.rg-weapon-field')) rgWeaponResults.classList.add('hidden');
});
$('#rg-scope').onchange = e => { e.target.blur(); const R = hudInfo().range; const id = (S.weapons || []).some(w => w.name === R.weapon) ? S.weapons.find(w => w.name === R.weapon).id : S.cfg.range.weapon; hudSet({ range: { zoomBy: { [id]: +e.target.value } } }); };
$('#cp-show').onchange = e => hudSet({ compass: { show: e.target.checked } });
$('#cp-speed').onchange = e => hudSet({ compass: { speed: e.target.value } });
$('#cp-pick').onclick = () => hudSet({ openSpot: 'Ashland > ' });
$('#cp-clear').onclick = () => hudSet({ clearRoute: true });
$('#cp-prev').onclick = () => hudSet({ compass: { leg: Math.max(0, (S.cfg.compass.leg | 0) - 1) } });
$('#tmap-world').onchange = e => hudSet({ tmap: { world: e.target.value } });
['bld', 'hidden', 'custom', 'route', 'events', 'labels'].forEach(x => { $('#tmap-' + x).onchange = e => hudSet({ tmap: { [x]: e.target.checked } }); });
$('#tmap-test').onclick = async () => { await hudSet({ showMap: true }); clearTimeout($('#tmap-test').__t); $('#tmap-test').__t = setTimeout(() => hudSet({ showMap: false }), 5000); };
$('#cp-next').onclick = () => hudSet({ compass: { leg: (S.cfg.compass.leg | 0) + 1 } });
[['sp-op', 'spotlight', 'opacity'], ['rg-gap', 'range', 'gap'], ['rg-fov', 'range', 'fov'], ['rg-cal', 'range', 'calib'], ['rg-scale', 'range', 'scale'], ['rg-op', 'range', 'opacity'], ['cp-top', 'compass', 'top'], ['cp-scale', 'compass', 'scale'], ['cp-op', 'compass', 'opacity'], ['tmap-size', 'tmap', 'size'], ['tmap-op', 'tmap', 'opacity']].forEach(([id, sec, key]) => {
    const el = $('#' + id);
    el.addEventListener('input', () => { renderHUD(); clearTimeout(el.__t); el.__t = setTimeout(() => xh.hudExtras({ [sec]: { [key]: +el.value } }).then(s => { S = s; }), 80); });
    el.addEventListener('change', () => hudSet({ [sec]: { [key]: +el.value } }));
});
if (xh.onTheme) xh.onTheme(id => { if (S) { S.cfg.theme = id; renderHUD(); } });
