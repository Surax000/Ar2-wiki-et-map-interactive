// Indicateurs directionnels approximatifs bases sur l'audio du bureau.
(() => {
    const cv = document.getElementById('sound-c');
    const ctx = cv.getContext('2d');
    let context = null, stream = null, source = null, splitter = null, mute = null;
    let left = null, right = null, leftData = null, rightData = null;
    let enabled = false, starting = false, sensitivity = 1.2;
    let events = [], frame = null, retryTimer = null, lastLevel = 0, lastEvent = 0;
    let width = 0, height = 0, pixelRatio = 0;

    function sizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth, h = window.innerHeight;
        if (w !== width || h !== height || dpr !== pixelRatio) {
            width = w; height = h; pixelRatio = dpr;
            cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
            cv.style.width = w + 'px'; cv.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    function status(message) {
        if (window.xh && window.xh.soundStatus) window.xh.soundStatus(message);
    }

    function clearCapture() {
        if (stream) stream.getTracks().forEach(track => track.stop());
        stream = null; source = null; splitter = null; mute = null;
        left = null; right = null; leftData = null; rightData = null;
        if (context) context.close().catch(() => {});
        context = null;
    }

    function stop() {
        enabled = false;
        starting = false;
        clearTimeout(retryTimer);
        clearTimeout(frame);
        retryTimer = null; frame = null; events = []; lastLevel = 0; lastEvent = 0;
        clearCapture();
        ctx.clearRect(0, 0, width, height);
        status('Désactivé.');
    }

    async function capture() {
        if (!enabled || starting) return;
        starting = true;
        status('Connexion à la sortie audio du jeu…');
        try {
            const sourceId = window.xh && window.xh.soundSource ? await window.xh.soundSource() : null;
            if (!sourceId) throw new Error('Aucun écran capturable.');
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        maxWidth: 320,
                        maxHeight: 180,
                        maxFrameRate: 5
                    }
                }
            });
            context = new AudioContext({ latencyHint: 'interactive' });
            await context.resume();
            if (context.state !== 'running') throw new Error('Le moteur audio est suspendu.');
            source = context.createMediaStreamSource(stream);
            splitter = context.createChannelSplitter(2);
            left = context.createAnalyser(); right = context.createAnalyser();
            left.fftSize = right.fftSize = 1024;
            left.smoothingTimeConstant = right.smoothingTimeConstant = 0.55;
            leftData = new Uint8Array(left.fftSize);
            rightData = new Uint8Array(right.fftSize);
            mute = context.createGain();
            mute.gain.value = 0;
            source.connect(splitter);
            splitter.connect(left, 0);
            splitter.connect(right, 1);
            left.connect(mute);
            right.connect(mute);
            mute.connect(context.destination);
            status('Audio du bureau capté. Les autres overlays restent indépendants.');
        } catch (e) {
            clearCapture();
            const message = String(e && e.message || e);
            console.warn('Capture audio AR2 indisponible:', message);
            status('Capture audio indisponible : ' + message);
            if (enabled) retryTimer = setTimeout(capture, 10000);
        } finally {
            starting = false;
        }
    }

    function rms(analyser, data) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
        }
        return Math.sqrt(sum / data.length);
    }

    function drawIndicator(cx, cy, angle, level, kind, alpha) {
        const radius = 72;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#4f91ff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, angle - 0.42, angle + 0.42);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.translate(x, y);
        ctx.globalAlpha = alpha * Math.min(1, 0.65 + level * 2);
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
        frame = null;
        if (!enabled) return;
        sizeCanvas();
        const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2, cy = h / 2;
        ctx.clearRect(0, 0, w, h);
        const l = left ? rms(left, leftData) : 0;
        const r = right ? rms(right, rightData) : 0;
        const level = Math.max(l, r);
        const threshold = 0.018 / sensitivity;
        const pan = l + r > 0.001 ? (r - l) / (r + l) : 0;
        if (left && right && level > threshold && level > lastLevel * 1.12 && now - lastEvent > 180) {
            let angle;
            if (Math.abs(pan) > 0.12) angle = pan > 0 ? 0 : Math.PI;
            else angle = level > threshold * 2.2 ? -Math.PI / 2 : Math.PI / 2;
            events.push({ angle, level, kind: level > threshold * 2.2 ? 'impact' : 'sound', born: now });
            if (events.length > 5) events.shift();
            lastEvent = now;
        }
        lastLevel = level;

        events = events.filter(e => now - e.born < 900);
        ctx.save();
        ctx.strokeStyle = 'rgba(79,145,255,.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        events.forEach(e => drawIndicator(cx, cy, e.angle, e.level, e.kind, Math.max(0, 1 - (now - e.born) / 900)));
        frame = setTimeout(() => update(performance.now()), 33);
    }

    function start() {
        if (enabled) return;
        enabled = true;
        sizeCanvas();
        update(performance.now());
        capture();
    }

    window.addEventListener('resize', sizeCanvas);
    sizeCanvas();
    window.xh.onSettings(settings => {
        const config = settings && settings._sound ? settings._sound : { enabled: false };
        sensitivity = Math.max(0.4, Math.min(3, +config.sensitivity || 1.2));
        if (config.enabled) start(); else stop();
    });
})();
