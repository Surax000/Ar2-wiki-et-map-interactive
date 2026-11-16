const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let last = null, shownColor = null, anim = null;
const C = window.AR2Crosshair;
function hexToRgb(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => toHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));
function paint(s) {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    C.draw(ctx, w / 2, h / 2, s);
}
// Fondu doux quand la couleur automatique change
function render(s) {
    if (s) last = s; if (!last) return;
    const target = { color: last.color, outlineColor: last.outlineColor, glowColor: last.glowColor };
    const fade = +last._fade || 0;
    if (!shownColor || !fade) { shownColor = target; paint(last); return; }
    if (shownColor.color === target.color && shownColor.outlineColor === target.outlineColor) { paint(last); return; }
    const from = shownColor, t0 = performance.now();
    cancelAnimationFrame(anim);
    const step = now => {
        const t = Math.min(1, (now - t0) / fade);
        shownColor = { color: mix(from.color, target.color, t), outlineColor: mix(from.outlineColor, target.outlineColor, t), glowColor: mix(from.glowColor || from.color, target.glowColor || target.color, t) };
        paint(Object.assign({}, last, shownColor));
        if (t < 1) anim = requestAnimationFrame(step); else shownColor = target;
    };
    anim = requestAnimationFrame(step);
}
window.xh.onSettings(render);
window.addEventListener('resize', () => render());
