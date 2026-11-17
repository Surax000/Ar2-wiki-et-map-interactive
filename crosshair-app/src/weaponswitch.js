// AR2 Crosshair – changement de profil automatique selon l'arme équipée.
// Écoute (sans les bloquer) les touches de la barre rapide d'AR2 : 1 à 8 équipent un emplacement,
// V range l'arme, clic droit = visée. Rien n'est lu dans le jeu : seulement le clavier et la souris,
// comme le push-to-talk de Discord.
let hook = null, keys = null, user32 = null, getFg = null, getTitle = null, getPid = null;
let handlers = {};
let chatOpen = false;
const state = { started: false, error: null, fgOk: null };

function loadForeground() {
    if (process.platform !== 'win32' || user32 !== null) return;
    try {
        const koffi = require('koffi');
        user32 = koffi.load('user32.dll');
        getFg = user32.func('void* __stdcall GetForegroundWindow()');
        getTitle = user32.func('int __stdcall GetWindowTextW(void* hWnd, _Out_ uint16_t* lpString, int nMaxCount)');
        state.fgOk = true;
    } catch (e) { user32 = false; state.fgOk = false; }
}
function foregroundTitle() {
    if (!getFg) return null;
    try {
        const h = getFg(); if (!h) return '';
        const buf = new Uint16Array(256);
        const n = getTitle(h, buf, 256);
        return String.fromCharCode.apply(null, Array.from(buf.slice(0, Math.max(0, n))));
    } catch (e) { return null; }
}
function robloxFocused() {
    const t = foregroundTitle();
    if (t === null) return true; // impossible de savoir : on ne bloque pas
    return /roblox/i.test(t);
}

function start(h) {
    handlers = h || {};
    if (state.started) return state;
    try {
        const u = require('uiohook-napi');
        hook = u.uIOhook; keys = u.UiohookKey;
        loadForeground();
        const digit = {}; for (let i = 1; i <= 9; i++) digit[keys[String(i)]] = i;
        hook.on('keydown', e => {
            const c = handlers.config && handlers.config(); if (!c || !c.enabled) return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (c.onlyRoblox && !robloxFocused()) return;
            // chat Roblox : « / » ouvre, Entrée ou Échap ferme
            if (e.keycode === keys.Slash) { chatOpen = true; return; }
            if (chatOpen) { if (e.keycode === keys.Enter || e.keycode === keys.Escape) chatOpen = false; return; }
            if (digit[e.keycode]) return handlers.slot && handlers.slot(digit[e.keycode]);
            if (e.keycode === keys.V) return handlers.holster && handlers.holster();
        });
        // touches brutes (carte tactique « maintenir pour afficher ») : aucune touche n'est bloquée
        hook.on('keydown', e => { try { handlers.rawDown && handlers.rawDown(e.keycode, keys); } catch (err) {} });
        hook.on('keyup', e => { try { handlers.rawUp && handlers.rawUp(e.keycode, keys); } catch (err) {} });
        hook.on('mousedown', e => {
            const c = handlers.config && handlers.config(); if (!c || !c.enabled || e.button !== 2) return;
            if (c.onlyRoblox && !robloxFocused()) return;
            handlers.ads && handlers.ads(true);
        });
        hook.on('mouseup', e => {
            const c = handlers.config && handlers.config(); if (!c || !c.enabled || e.button !== 2) return;
            handlers.ads && handlers.ads(false);
        });
        hook.start();
        state.started = true; state.error = null;
    } catch (e) { state.error = String(e.message || e); }
    return state;
}
function stop() { try { if (hook && state.started) hook.stop(); } catch (e) {} state.started = false; }
function tap(key) { if (hook && keys) hook.keyTap(keys[key]); }
module.exports = { start, stop, state, foregroundTitle, tap, loadForeground };
