// AR2 Crosshair – fenêtre cachée de capture : analyse la zone autour du crosshair
let cfg = null, stream = null, video = null, timer = null, srcKey = '';
const N = 56;
const cv = document.createElement('canvas'); cv.width = N; cv.height = N;
const ctx = cv.getContext('2d', { willReadFrequently: true });
function stop() {
    clearInterval(timer); timer = null;
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; video = null; srcKey = '';
}
async function start() {
    const key = cfg.sourceId + '|' + cfg.fps;
    if (stream && key === srcKey) return;
    stop(); srcKey = key;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: cfg.sourceId, maxWidth: cfg.w, maxHeight: cfg.h, maxFrameRate: cfg.fps } } });
        video = document.createElement('video'); video.muted = true; video.srcObject = stream;
        await video.play();
    } catch (e) { stop(); window.xh.samplerError(String(e && e.message || e)); return; }
    schedule();
}
function schedule() { clearInterval(timer); if (cfg && cfg.enabled) timer = setInterval(tick, Math.max(100, cfg.interval | 0)); }
function tick() {
    if (!video || !video.videoWidth || !cfg) return;
    const W = video.videoWidth, H = video.videoHeight;
    const sw = Math.max(4, cfg.zw * W), sh = Math.max(4, cfg.zh * H);
    const sx = Math.max(0, Math.min(W - sw, cfg.cx * W - sw / 2)), sy = Math.max(0, Math.min(H - sh, cfg.cy * H - sh / 2));
    try {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, N, N);
        const px = ctx.getImageData(0, 0, N, N).data, ex = cfg.exu;
        const a = AR2AutoColor.analyze(px, N * N, i => { const u = ((i % N) + .5) / N - .5, v = (Math.floor(i / N) + .5) / N - .5; return Math.abs(u) < ex && Math.abs(v) < ex; });
        if (a) window.xh.samplerSample(a);
    } catch (e) { window.xh.samplerError(String(e && e.message || e)); }
}
window.xh.onSamplerConfig(c => { cfg = c; if (!c || !c.enabled) return stop(); start(); schedule(); });
window.xh.onSamplerGeom(g => { if (!cfg) return; const ch = g.interval !== cfg.interval; Object.assign(cfg, g); if (ch) schedule(); });
