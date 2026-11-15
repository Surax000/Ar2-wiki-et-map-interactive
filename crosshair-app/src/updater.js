// AR2 Crosshair – mises à jour automatiques
// Version installée (installeur .exe) : téléchargement + installation automatiques via GitHub Releases.
// Version portable ou .zip : on vérifie GitHub et on propose le lien de téléchargement.
const { app, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const OWNER = 'Surax000', REPO = 'Ar2-wiki-et-map-interactive';
const RELEASES = `https://github.com/${OWNER}/${REPO}/releases/latest`;

let autoUpdater = null;
let status = { state: 'idle', mode: 'auto', version: null, percent: 0, error: null, url: RELEASES, checkedAt: null };
let onChange = () => {};
let timer = null;

function isInstalled() {
    if (process.platform !== 'win32') return app.isPackaged; // Linux AppImage / dev
    if (process.env.PORTABLE_EXECUTABLE_DIR) return false;
    const dir = path.dirname(process.execPath);
    try { return fs.readdirSync(dir).some(f => /^Uninstall .*\.exe$/i.test(f)); } catch (e) { return false; }
}
function set(p) { status = Object.assign({}, status, p); onChange(status); }
const cmp = (a, b) => { const x = String(a).split('.').map(n => parseInt(n) || 0), y = String(b).split('.').map(n => parseInt(n) || 0); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };

async function manualCheck() {
    set({ state: 'checking', error: null });
    try {
        const r = await net.fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, { headers: { 'User-Agent': 'AR2-Crosshair', Accept: 'application/vnd.github+json' } });
        if (!r.ok) throw new Error('GitHub a répondu ' + r.status);
        const j = await r.json();
        const v = String(j.tag_name || '').replace(/^.*?v/, '');
        if (v && cmp(v, app.getVersion()) > 0) set({ state: 'available', version: v, url: j.html_url || RELEASES, checkedAt: Date.now() });
        else set({ state: 'none', version: v || null, checkedAt: Date.now() });
    } catch (e) { set({ state: 'error', error: String(e.message || e), checkedAt: Date.now() }); }
    return status;
}

function init(opts) {
    onChange = opts.onChange || onChange;
    const installed = isInstalled();
    status.mode = installed ? 'auto' : 'manual';
    if (installed) {
        try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) { autoUpdater = null; status.mode = 'manual'; }
    }
    if (autoUpdater) {
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.allowPrerelease = false;
        if (opts.logger) autoUpdater.logger = opts.logger;
        autoUpdater.on('checking-for-update', () => set({ state: 'checking', error: null }));
        autoUpdater.on('update-available', i => set({ state: 'downloading', version: i.version, percent: 0 }));
        autoUpdater.on('update-not-available', i => set({ state: 'none', version: i && i.version, checkedAt: Date.now() }));
        autoUpdater.on('download-progress', p => set({ state: 'downloading', percent: Math.round(p.percent || 0) }));
        autoUpdater.on('update-downloaded', i => set({ state: 'ready', version: i.version, percent: 100, checkedAt: Date.now() }));
        autoUpdater.on('error', e => set({ state: 'error', error: String((e && e.message) || e).split('\n')[0], checkedAt: Date.now() }));
    }
    return status;
}
async function check() {
    if (autoUpdater) { try { await autoUpdater.checkForUpdates(); } catch (e) { set({ state: 'error', error: String(e.message || e).split('\n')[0] }); } return status; }
    return manualCheck();
}
function schedule(enabled) {
    clearInterval(timer); timer = null;
    if (!enabled) return;
    setTimeout(() => check(), 8000);
    timer = setInterval(() => check(), 4 * 60 * 60 * 1000);
}
function install() {
    if (status.state === 'ready' && autoUpdater) { setImmediate(() => autoUpdater.quitAndInstall(true, true)); return true; }
    if (status.state === 'available') { shell.openExternal(status.url || RELEASES); return true; }
    return false;
}
module.exports = { init, check, schedule, install, get status() { return status; }, get autoUpdater() { return autoUpdater; }, isInstalled };
