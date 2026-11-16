// Fenêtre d'entraînement de visée de l'appli : utilise les profils et la couleur auto de l'appli
let S = null, pick = null, aim = null;
const sel = document.getElementById('prof');
function profile() { const P = S.cfg.profiles; const i = pick !== null && P[pick] ? pick : S.cfg.active; return P[i] || P[0]; }
function renderSel() {
    sel.innerHTML = S.cfg.profiles.map((p, i) => `<option value="${i}" ${i === (pick !== null ? pick : S.cfg.active) ? 'selected' : ''}>${p.name.replace(/[<&]/g, '')}${i === S.cfg.active ? ' (actif)' : ''}</option>`).join('');
    document.getElementById('info').textContent = S.cfg.autoColor && S.cfg.autoColor.enabled ? 'Couleur auto activée dans l\'appli : coche « Couleur auto » pour la simuler.' : '';
}
sel.onchange = () => { pick = +sel.value; aim && aim.refresh(); };
window.xh.getState().then(s => {
    S = s; renderSel();
    aim = AR2Aim.mount(document.getElementById('aim'), { getSettings: () => profile().settings, autoColor: () => S.cfg.autoColor, storeKey: 'ar2_aim_app_v1' });
    window.__aimReady = !!aim;
});
window.xh.onState(s => { S = s; renderSel(); aim && aim.refresh(); });
