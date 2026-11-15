/* AR2 Crosshair – fenêtre de réglages */
const C = window.AR2Crosshair;
// Mode démo (ouverture dans un navigateur, sans Electron)
if (!window.xh) {
    const st = { cfg: { active: 0, profiles: C.PRESETS.map((p, i) => ({ id: 'p' + i, name: p.name, settings: C.withDefaults(p.s) })), display: 0, autoUpdate: true, autoSwitch: { enabled: true, onlyRoblox: true, holsterHide: true, adsHide: false, adsMode: 'hold', slots: {}, labels: {} }, hotkeys: { toggle: 'Control+Alt+X', settings: 'Control+Alt+S', nextProfile: 'Control+Alt+P', center: 'Control+Alt+C', up: 'Control+Alt+Up', down: 'Control+Alt+Down', left: 'Control+Alt+Left', right: 'Control+Alt+Right' }, startHidden: false, launchAtStartup: false, moveStep: 1 }, visible: true, displays: [{ i: 0, label: 'Écran 1 – 1920×1080 (principal)' }], version: '1.1.0', update: { state: 'none', mode: 'auto', version: '1.1.0' }, hook: { started: true }, installed: true };
    const cur = () => st.cfg.profiles[st.cfg.active].settings;
    window.xh = {
        getState: async () => st, update: async p => { Object.assign(cur(), p); return st; },
        setConfig: async p => { if (p.autoSwitch) { const a = p.autoSwitch; st.cfg.autoSwitch = Object.assign({}, st.cfg.autoSwitch, a, { slots: Object.assign({}, st.cfg.autoSwitch.slots, a.slots || {}), labels: Object.assign({}, st.cfg.autoSwitch.labels, a.labels || {}) }); delete p.autoSwitch; } Object.assign(st.cfg, p); if (p.hotkeys) st.cfg.hotkeys = Object.assign({}, st.cfg.hotkeys, p.hotkeys); return { ...st, fails: [] }; },
        profile: async ({ action, name, index, code }) => {
            if (action === 'add') { st.cfg.profiles.push({ name, settings: { ...cur() } }); st.cfg.active = st.cfg.profiles.length - 1; }
            if (action === 'rename') st.cfg.profiles[index].name = name;
            if (action === 'delete' && st.cfg.profiles.length > 1) { st.cfg.profiles.splice(index, 1); st.cfg.active = 0; }
            if (action === 'import') { st.cfg.profiles.push({ name, settings: C.withDefaults(C.fromCode(code)) }); st.cfg.active = st.cfg.profiles.length - 1; }
            return st;
        },
        setVisible: async v => { st.visible = v; return st; }, openUrl: async () => {}, checkUpdate: async () => st, installUpdate: async () => false, onState: () => {}, onSettings: () => {}
    };
}

let S = null, bg = 'game', zoom = 1;
const $ = s => document.querySelector(s);
const cur = () => S.cfg.profiles[S.cfg.active].settings;
const SW = ['#00ff88', '#ff2d55', '#ffffff', '#22d3ee', '#facc15', '#fb923c', '#e879f9', '#a3e635', '#3b82f6', '#000000'];
const HK_LABELS = { toggle: 'Afficher / masquer', settings: 'Ouvrir les réglages', nextProfile: 'Profil suivant', center: 'Recentrer', up: 'Monter', down: 'Descendre', left: 'Gauche', right: 'Droite' };

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
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.imageSmoothingEnabled = false;
    C.draw(ctx, 0, 0, cur());
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
function renderStyles() {
    const s = cur();
    $('#styles').innerHTML = Object.entries(C.STYLES).map(([k, l]) => `<button class="style-btn ${s.style === k ? 'active' : ''}" data-style="${k}"><canvas></canvas>${l}</button>`).join('');
    document.querySelectorAll('.style-btn').forEach(b => mini(b.querySelector('canvas'), { ...s, style: b.dataset.style, offsetX: 0, offsetY: 0 }, 44));
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
    $('#hotkeys').innerHTML = Object.keys(HK_LABELS).map(k => `<div class="hk"><span>${HK_LABELS[k]}</span><input readonly data-hk="${k}" value="${(S.cfg.hotkeys[k] || '').replace(/Control/g, 'Ctrl')}"></div>`).join('');
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
    const txt = { checking: 'Recherche de mise à jour…', downloading: `Téléchargement de la v${u.version} (${u.percent || 0} %)…`, ready: `Mise à jour v${u.version} prête.`, available: `Nouvelle version v${u.version} disponible.`, none: `Tu as la dernière version (v${S.version}).`, error: `Erreur : ${u.error || ''}`, idle: '' }[u.state || 'idle'];
    $('#upd-status').textContent = txt; $('#upd-status').className = 'small ' + (u.state === 'error' ? 'err' : u.state === 'ready' || u.state === 'none' ? 'ok' : 'muted');
    $('#autoUpdate').checked = S.cfg.autoUpdate !== false;
    const show = u.state === 'ready' || u.state === 'available';
    b.classList.toggle('hidden', !show);
    if (show) { $('#upd-text').textContent = txt + (u.state === 'ready' ? " Elle s'installera aussi toute seule à la fermeture de l'appli." : u.mode === 'manual' ? ' (version portable : télécharge la nouvelle version)' : ''); $('#upd-btn').textContent = u.state === 'ready' ? 'Redémarrer et installer' : 'Télécharger'; }
}
function renderAll() { renderProfiles(); renderStyles(); renderControls(); renderHotkeys(); renderAuto(); renderUpdate(); renderPreview(); }

async function upd(partial) {
    Object.assign(cur(), partial);
    S = await xh.update(partial);
    renderControls(); renderPreview(); renderStyles(); renderProfiles();
}

document.addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return;
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' || e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    upd({ [k]: v });
});
document.addEventListener('click', async e => {
    const t = e.target.closest('[data-style],[data-sw],[data-p],[data-bg],[data-zoom]'); if (!t) return;
    if (t.dataset.style) upd({ style: t.dataset.style });
    else if (t.dataset.sw) upd({ color: t.dataset.sw, glowColor: t.dataset.sw });
    else if (t.dataset.p !== undefined) { S = await xh.setConfig({ active: +t.dataset.p }); renderAll(); }
    else if (t.dataset.bg) { bg = t.dataset.bg; renderControls(); renderPreview(); }
    else if (t.dataset.zoom) { zoom = +t.dataset.zoom; renderControls(); renderPreview(); }
});
$('#vis-btn').onclick = async () => { S = await xh.setVisible(!S.visible); renderControls(); };
$('#p-add').onclick = async () => { S = await xh.profile({ action: 'add', name: `Mon profil ${S.cfg.profiles.length + 1}` }); renderAll(); };
$('#p-rename').onclick = async () => {
    const i = S.cfg.active, el = document.querySelector(`.pitem[data-p="${i}"] span`);
    const inp = document.createElement('input'); inp.value = S.cfg.profiles[i].name; inp.style.width = '100%';
    el.replaceWith(inp); inp.focus(); inp.select();
    const done = async () => { S = await xh.profile({ action: 'rename', index: i, name: inp.value.trim() }); renderProfiles(); };
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = S.cfg.profiles[i].name; inp.blur(); } });
    inp.addEventListener('blur', done, { once: true });
};
$('#p-del').onclick = async () => { if (S.cfg.profiles.length <= 1) return; if (!confirm(`Supprimer le profil « ${S.cfg.profiles[S.cfg.active].name} » ?`)) return; S = await xh.profile({ action: 'delete', index: S.cfg.active }); renderAll(); };
$('#p-reset').onclick = async () => { if (!confirm("Remettre les profils d'origine ? Tes profils perso seront effacés.")) return; S = await xh.profile({ action: 'reset' }); renderAll(); };
$('#code-copy').onclick = () => { const i = $('#code-out'); i.select(); navigator.clipboard.writeText(i.value).catch(() => document.execCommand('copy')); $('#code-msg').textContent = 'Code copié.'; $('#code-msg').className = 'small ok'; };
$('#code-import').onclick = async () => {
    try { S = await xh.profile({ action: 'import', code: $('#code-in').value, name: 'Profil importé' }); $('#code-in').value = ''; $('#code-msg').textContent = 'Profil importé.'; $('#code-msg').className = 'small ok'; renderAll(); }
    catch (err) { $('#code-msg').textContent = 'Code invalide.'; $('#code-msg').className = 'small err'; }
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
