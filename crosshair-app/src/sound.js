// Indicateurs directionnels approximatifs bases sur l'audio du bureau.
(() => {
    const cv = document.getElementById('sound-c');
    const ctx = cv.getContext('2d');
    let context = null, stream = null, source = null, splitter = null;
    let left = null, right = null, enabled = false, sensitivity = 1.2;
    let events = [], frame = 0, lastLevel = 0;

    function sizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth, h = window.innerHeight;
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        cv.style.width = w + 'px'; cv.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function stop() {
        enabled = false;
        if (stream) stream.getTracks().forEach(track => track.stop());
        stream = null; source = null; splitter = null; left = null; right = null;
        if (context) context.close().catch(() => {});
        context = null; events = [];
        ctx.clearRect(0, 0, cv.width, cv.height);
        cancelAnimationFrame(frame);
    }

    async function start() {
        if (enabled) return;
        enabled = true;
        try {
            const sourceId = window.xh && window.xh.soundSource ? await window.xh.soundSource() : null;
            if (!sourceId) throw new Error('aucun écran capturable');
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                },
                video: false
            });
            context = new AudioContext();
            source = context.createMediaStreamSource(stream);
            splitter = context.createChannelSplitter(2);
            left = context.createAnalyser(); right = context.createAnalyser();
            left.fftSize = right.fftSize = 1024;
            left.smoothingTimeConstant = right.smoothingTimeConstant = 0.72;
            source.connect(splitter);
            splitter.connect(left, 0);
            splitter.connect(right, 1);
            frame = requestAnimationFrame(update);
        } catch (e) {
            stop();
            console.warn('Capture audio AR2 indisponible:', e.message || e);
        }
    }

    function rms(analyser) {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
        }
        return Math.sqrt(sum / data.length);
    }

    function drawIndicator(cx, cy, angle, level, kind) {
        const radius = 72;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        ctx.save();
        ctx.globalAlpha = Math.min(1, 0.45 + level * 3);
        ctx.strokeStyle = '#4f91ff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, 72, angle - 0.42, angle + 0.42);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.translate(x, y);
        ctx.globalAlpha = Math.min(1, 0.65 + level * 2);
        ctx.strokeStyle = kind === 'impact' ? '#ff6b57' : '#67e8f9';
        ctx.fillStyle = kind === 'impact' ? 'rgba(255,107,87,.75)' : 'rgba(103,232,249,.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, kind === 'impact' ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function update(now) {
        sizeCanvas();
        const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2, cy = h / 2;
        ctx.clearRect(0, 0, w, h);
        if (!enabled || !left || !right) { frame = requestAnimationFrame(update); return; }

        const l = rms(left), r = rms(right);
        const level = Math.max(l, r);
        const threshold = 0.018 / sensitivity;
        const pan = l + r > 0.001 ? (r - l) / (r + l) : 0;
        if (level > threshold && level > lastLevel * 1.12) {
            let angle;
            if (Math.abs(pan) > 0.12) angle = pan > 0 ? 0 : Math.PI;
            else angle = level > threshold * 2.2 ? -Math.PI / 2 : Math.PI / 2;
            events.push({ angle, level, kind: level > threshold * 2.2 ? 'impact' : 'sound', born: now });
            if (events.length > 5) events.shift();
        }
        lastLevel = level;

        events = events.filter(e => now - e.born < 900);
        ctx.save();
        ctx.strokeStyle = 'rgba(79,145,255,.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        events.forEach(e => drawIndicator(cx, cy, e.angle, e.level, e.kind));
        frame = requestAnimationFrame(update);
    }

    window.addEventListener('resize', sizeCanvas);
    sizeCanvas();
    window.xh.onSettings(settings => {
        const config = settings && settings._sound ? settings._sound : { enabled: false };
        sensitivity = Math.max(0.4, Math.min(3, +config.sensitivity || 1.2));
        if (config.enabled) start(); else stop();
    });
})();
