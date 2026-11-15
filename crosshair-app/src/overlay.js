const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let last = null;
function render(s) {
    last = s || last; if (!last) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    AR2Crosshair.draw(ctx, w / 2, h / 2, last);
}
window.xh.onSettings(render);
window.addEventListener('resize', () => render());
