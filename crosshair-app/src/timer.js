// Minuteur tactique : affichage des comptes à rebours + bip quand c'est fini
const box = document.getElementById('box');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let T = null, skew = 0;
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
function render() {
    if (!T) return;
    const c = T.cfg, now = Date.now() - skew;
    box.style.transform = `scale(${c.scale || 1})`;
    box.style.opacity = c.opacity || 0.9;
    if (!T.running.length) {
        box.innerHTML = `<div class="idle"><b>Minuteur</b>${c.presets.map((p, i) => `<span>${esc(T.keys[i].replace('Ctrl+Alt+', ''))} ${esc(p.min >= 1 ? p.min + 'm' : Math.round(p.min * 60) + 's')}</span>`).join('')}</div>`;
        return;
    }
    box.innerHTML = T.running.map(r => {
        const left = r.end - now, done = !!r.doneAt || left <= 0;
        const warn = !done && c.warn && left <= c.warn * 1000;
        const pct = done ? 100 : Math.max(0, Math.min(100, (1 - left / (r.dur * 1000)) * 100));
        const since = done ? now - (r.doneAt || r.end) : 0;
        return `<div class="r ${done ? 'd' : warn ? 'w' : ''} ${done && since < 8000 ? 'blink' : ''}"><div class="l"><span class="n">${esc(r.name)}</span><span class="t">${done ? 'PRÊT' + (since > 1000 ? ' <small style="font-size:11px">+' + fmt(since) + '</small>' : '') : fmt(left)}</span></div><div class="b"><i style="width:${pct}%"></i></div></div>`;
    }).join('');
}
window.xh.onTimer(t => { T = t; skew = Date.now() - t.now; render(); });
setInterval(render, 200);

// bip discret généré (pas de fichier son)
let ctx = null;
function beep(vol, kind) {
    try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        const seq = kind === 'warn' ? [[660, 0, 0.12]] : [[880, 0, 0.14], [880, 0.22, 0.14], [1175, 0.44, 0.22]];
        seq.forEach(([f, at, d]) => {
            const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + at;
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * 0.5), t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
            o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + d + 0.05);
        });
        return true;
    } catch (e) { return false; }
}
window.xh.onTimerAlarm(a => { if (a.sound && a.volume > 0 && beep(a.volume, a.kind)) window.xh.timerBeeped(); else if (!a.sound) window.xh.timerBeeped(); render(); });
