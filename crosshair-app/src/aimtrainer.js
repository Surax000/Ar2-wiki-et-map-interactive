/* AR2 – mini entraînement de visée (aim trainer) partagé entre le site et l'appli.
   Le crosshair est dessiné à la place du curseur, sur des fonds qui ressemblent au jeu.
   Utilise window.AR2Crosshair (dessin) et, si présent, window.AR2AutoColor (couleur auto + visibilité). */
(function (root) {
    'use strict';
    const BGS = {
        game: 'Plaine', foret: 'Forêt', neige: 'Neige', ciel: 'Ciel', nuit: 'Nuit', ville: 'Ville', desert: 'Sable'
    };
    const BG_IDS = Object.keys(BGS);
    const MODES = {
        flick: { name: 'Réflexes', desc: '25 cibles à toucher le plus vite possible.', n: 25, r: 24 },
        micro: { name: 'Précision', desc: '20 petites cibles : vise bien avant de cliquer.', n: 20, r: 10 },
        track: { name: 'Suivi', desc: 'Garde le crosshair sur la cible qui bouge pendant 20 s (pas besoin de cliquer).', dur: 20, r: 22 },
        visi: { name: 'Visibilité', desc: 'Vérifie si ton crosshair se voit bien sur chaque fond du jeu.' }
    };
    const RANKS = [[8500, 'Excellent', '#4ade80'], [6000, 'Bon', '#a3e635'], [3500, 'Correct', '#facc15'], [0, 'À travailler', '#fb923c']];
    const rankOf = s => RANKS.find(r => s >= r[0]);

    // ---------- fonds (dessinés, pas d'images) ----------
    function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
    function drawBg(ctx, w, h, id) {
        const lin = (stops) => { const g = ctx.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => g.addColorStop(p, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); };
        const R = rnd(7 + BG_IDS.indexOf(id) * 31);
        const trees = (col, y0, n, hmin, hmax) => { ctx.fillStyle = col; for (let i = 0; i < n; i++) { const x = R() * w, hh = hmin + R() * (hmax - hmin), y = y0 + R() * h * 0.05; ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x - hh * 0.32, y); ctx.lineTo(x + hh * 0.32, y); ctx.fill(); } };
        if (id === 'game') {
            lin([[0, '#8fb7cf'], [0.5, '#c9d6d0'], [0.51, '#4f6b3a'], [1, '#2f4423']]);
            trees('#26381e', h * 0.53, 40, h * 0.06, h * 0.12);
            ctx.fillStyle = '#6b6b66'; ctx.beginPath(); ctx.moveTo(w * 0.47, h * 0.55); ctx.lineTo(w * 0.53, h * 0.55); ctx.lineTo(w * 0.75, h); ctx.lineTo(w * 0.25, h); ctx.fill();
            ctx.fillStyle = '#7d5a3c'; ctx.fillRect(w * 0.66, h * 0.42, w * 0.07, h * 0.1);
        } else if (id === 'foret') {
            lin([[0, '#3c5a3a'], [1, '#18240f']]);
            trees('#22331a', h * 0.45, 50, h * 0.2, h * 0.4); trees('#0f1a0b', h * 0.8, 40, h * 0.3, h * 0.55);
            ctx.fillStyle = 'rgba(90,70,40,.35)'; ctx.fillRect(0, h * 0.85, w, h * 0.15);
        } else if (id === 'neige') {
            lin([[0, '#dfe8ee'], [0.45, '#f5f8fa'], [1, '#e7edf1']]);
            trees('#c7d3da', h * 0.5, 30, h * 0.05, h * 0.1);
            ctx.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(R() * w, h * (0.6 + R() * 0.35), w * 0.12, h * 0.04, 0, 0, Math.PI * 2); ctx.fill(); }
        } else if (id === 'ciel') {
            lin([[0, '#5eaee8'], [1, '#cfe9fb']]);
            ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 7; i++) { const x = R() * w, y = R() * h * 0.8; ctx.beginPath(); ctx.ellipse(x, y, w * 0.07, h * 0.035, 0, 0, Math.PI * 2); ctx.ellipse(x + w * 0.04, y - h * 0.02, w * 0.05, h * 0.03, 0, 0, Math.PI * 2); ctx.fill(); }
        } else if (id === 'nuit') {
            lin([[0, '#0b1020'], [0.55, '#141b2c'], [0.56, '#0d130c'], [1, '#070a06']]);
            ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 60; i++) ctx.fillRect(R() * w, R() * h * 0.5, 1.5, 1.5);
            trees('#05080a', h * 0.58, 35, h * 0.06, h * 0.14);
        } else if (id === 'ville') {
            lin([[0, '#9aa5ad'], [1, '#5d6468']]);
            for (let i = 0; i < 14; i++) { const bw = w * (0.05 + R() * 0.08), bh = h * (0.25 + R() * 0.5), x = R() * w; ctx.fillStyle = ['#4a4f54', '#6b6259', '#7f8a92', '#3d4246'][i % 4]; ctx.fillRect(x, h - bh, bw, bh); ctx.fillStyle = 'rgba(20,24,28,.55)'; for (let y = h - bh + 8; y < h - 10; y += 18) for (let xx = x + 5; xx < x + bw - 8; xx += 14) ctx.fillRect(xx, y, 7, 9); }
            ctx.fillStyle = '#3a3d40'; ctx.fillRect(0, h * 0.9, w, h * 0.1);
        } else { // desert
            lin([[0, '#e9d8a6'], [0.4, '#f3e3b9'], [0.41, '#d6b97c'], [1, '#b8955a']]);
            ctx.fillStyle = '#c7a568'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(R() * w, h * (0.55 + R() * 0.4), w * 0.2, h * 0.05, 0, 0, Math.PI * 2); ctx.fill(); }
        }
    }

    function css() {
        if (document.getElementById('aim-css')) return;
        const st = document.createElement('style'); st.id = 'aim-css';
        st.textContent = `
.aim{font-family:inherit;color:#e6edf3}
.aim-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}
.aim-chip{font:inherit;font-size:11px;font-weight:700;padding:5px 10px;border-radius:8px;border:1px solid #2a313b;background:#14181e;color:#9aa4ae;cursor:pointer}
.aim-chip:hover{color:#fff;border-color:#3d4653}
.aim-chip.on{background:#00ff88;color:#06120b;border-color:#00ff88}
.aim-lbl{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7d8590;margin-right:2px}
.aim-stage{position:relative;border-radius:12px;overflow:hidden;border:1px solid #2a313b;background:#0b0e12;user-select:none}
.aim-stage canvas{display:block;width:100%;height:auto;cursor:none}
.aim-hud{position:absolute;left:10px;top:8px;font:700 12px ui-monospace,Consolas,monospace;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none}
.aim-over{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(8,10,14,.62);text-align:center;padding:16px}
.aim-over.hide{display:none}
.aim-go{font:inherit;font-size:14px;font-weight:800;padding:10px 22px;border-radius:10px;border:0;background:#00ff88;color:#06120b;cursor:pointer}
.aim-big{font-size:42px;font-weight:900;font-family:ui-monospace,Consolas,monospace}
.aim-res{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:min(560px,100%)}
.aim-res div{background:rgba(20,24,30,.9);border:1px solid #2a313b;border-radius:10px;padding:6px}
.aim-res b{display:block;font-size:18px;font-family:ui-monospace,Consolas,monospace;color:#fff}
.aim-res span{font-size:10px;color:#9aa4ae;text-transform:uppercase;letter-spacing:.08em}
.aim-small{font-size:11px;color:#9aa4ae;max-width:560px;line-height:1.45}
.aim-vis{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:10px}
.aim-vis .v{border:1px solid #2a313b;border-radius:10px;overflow:hidden;background:#14181e}
.aim-vis canvas{display:block;width:100%;height:70px;cursor:default}
.aim-vis .t{display:flex;justify-content:space-between;font-size:11px;padding:4px 7px}
.aim-hist{font-size:11px;color:#9aa4ae;margin-top:8px;display:flex;flex-wrap:wrap;gap:10px}
.aim-hist b{color:#fff}
@media (max-width:640px){.aim-res{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
        document.head.appendChild(st);
    }

    function mount(el, opts) {
        opts = opts || {};
        const C = root.AR2Crosshair, AC = root.AR2AutoColor;
        if (!C || !el) return null;
        css();
        const KEY = opts.storeKey || 'ar2_aim_v1';
        let store = { best: {}, hist: [] };
        try { store = Object.assign(store, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
        const saveStore = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
        let mode = store.mode && MODES[store.mode] ? store.mode : 'flick', bgSel = store.bg || 'mix', useAuto = !!store.auto;
        const getS = () => C.withDefaults(opts.getSettings ? opts.getSettings() : {});
        const acOpts = () => Object.assign({}, AC ? AC.DEFAULTS : {}, opts.autoColor ? opts.autoColor() || {} : {}, { enabled: true });

        el.classList.add('aim');
        el.innerHTML = `
            <div class="aim-bar"><span class="aim-lbl">Mode</span>${Object.entries(MODES).map(([k, m]) => `<button type="button" class="aim-chip" data-aim-mode="${k}">${m.name}</button>`).join('')}</div>
            <div class="aim-bar"><span class="aim-lbl">Fond</span><button type="button" class="aim-chip" data-aim-bg="mix">Tous (change à chaque cible)</button>${BG_IDS.map(k => `<button type="button" class="aim-chip" data-aim-bg="${k}">${BGS[k]}</button>`).join('')}
                ${AC ? '<label class="aim-small" style="display:flex;align-items:center;gap:5px;margin-left:6px"><input type="checkbox" data-aim-auto> Couleur auto</label>' : ''}</div>
            <div class="aim-stage"><canvas></canvas><div class="aim-hud"></div><div class="aim-over"></div></div>
            <div class="aim-hist"></div>
            <div class="aim-visbox"></div>`;
        const cv = el.querySelector('canvas'), hud = el.querySelector('.aim-hud'), over = el.querySelector('.aim-over'), hist = el.querySelector('.aim-hist'), visbox = el.querySelector('.aim-visbox');
        const ctx = cv.getContext('2d');
        let W = 960, H = 540, dpr = 1;
        let mouse = { x: W / 2, y: H / 2, in: false };
        let run = null, raf = 0, acColor = null, acLast = 0, prevPick = null, bgNow = bgSel === 'mix' ? 'game' : bgSel;
        const bgCache = {};
        function bgCanvas(id) {
            const k = id + W + 'x' + H + '@' + dpr;
            if (bgCache[k]) return bgCache[k];
            const c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
            const x = c.getContext('2d'); x.scale(dpr, dpr); drawBg(x, W, H, id);
            return (bgCache[k] = c);
        }
        function resize() {
            const w = Math.max(320, el.querySelector('.aim-stage').clientWidth || 960);
            dpr = Math.min(2, root.devicePixelRatio || 1);
            W = w; H = Math.round(w * 9 / 16);
            cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
        }
        const ro = root.ResizeObserver ? new ResizeObserver(() => { resize(); if (!run) frame(); }) : null;
        if (ro) ro.observe(el.querySelector('.aim-stage')); else resize();
        resize();

        function syncBar() {
            el.querySelectorAll('[data-aim-mode]').forEach(b => b.classList.toggle('on', b.dataset.aimMode === mode));
            el.querySelectorAll('[data-aim-bg]').forEach(b => b.classList.toggle('on', b.dataset.aimBg === bgSel));
            const a = el.querySelector('[data-aim-auto]'); if (a) a.checked = useAuto;
            const b = store.best[mode];
            const last = store.hist.filter(x => x.mode === mode).slice(-5).reverse();
            hist.innerHTML = MODES[mode].n || MODES[mode].dur ? `<span>Record ${MODES[mode].name} : <b>${b ? b.score : '—'}</b>${b ? ` (${new Date(b.date).toLocaleDateString('fr-FR')})` : ''}</span>${last.length ? '<span>Dernières : ' + last.map(x => `<b>${x.score}</b>`).join(' • ') + '</span>' : ''}` : '';
        }
        function idle() {
            const m = MODES[mode];
            if (mode === 'visi') { over.classList.add('hide'); renderVis(); return; }
            visbox.innerHTML = '';
            over.classList.remove('hide');
            over.innerHTML = `<div class="aim-big" style="font-size:22px">${m.name}</div><div class="aim-small">${m.desc} Ton crosshair remplace le curseur. Échap pour arrêter.</div><button type="button" class="aim-go" data-aim-start>Démarrer</button>`;
        }
        function setMode(m) { stop(); mode = m; store.mode = m; saveStore(); syncBar(); idle(); frame(); }
        el.addEventListener('click', e => {
            const m = e.target.closest('[data-aim-mode]'); if (m) return setMode(m.dataset.aimMode);
            const b = e.target.closest('[data-aim-bg]'); if (b) { bgSel = b.dataset.aimBg; store.bg = bgSel; saveStore(); if (!run) bgNow = bgSel === 'mix' ? 'game' : bgSel; syncBar(); frame(); if (mode === 'visi') renderVis(); return; }
            if (e.target.closest('[data-aim-start]')) start();
        });
        el.addEventListener('change', e => { if (e.target.matches('[data-aim-auto]')) { useAuto = e.target.checked; store.auto = useAuto; saveStore(); acColor = null; prevPick = null; frame(); if (mode === 'visi') renderVis(); } });

        const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
        cv.addEventListener('mousemove', e => { const p = pos(e); mouse.x = p.x; mouse.y = p.y; mouse.in = true; if (!run) frame(); });
        cv.addEventListener('mouseleave', () => { mouse.in = false; if (!run) frame(); });
        cv.addEventListener('mousedown', e => {
            if (!run || run.cd > 0 || mode === 'track' || e.button !== 0) return;
            e.preventDefault();
            const p = pos(e), t = run.t;
            if (!t) return;
            if (Math.hypot(p.x - t.x, p.y - t.y) <= t.r) {
                const dt = performance.now() - t.at;
                run.times.push(dt); (run.byBg[bgNow] = run.byBg[bgNow] || []).push(dt); run.hits++;
                run.fx.push({ x: t.x, y: t.y, at: performance.now(), ok: true });
                if (run.hits >= MODES[mode].n) return finish();
                nextTarget();
            } else { run.miss++; run.fx.push({ x: p.x, y: p.y, at: performance.now(), ok: false }); }
        });
        const onKey = e => { if (e.key === 'Escape' && run) { stop(); idle(); frame(); } };
        root.addEventListener('keydown', onKey);

        function nextTarget() {
            const m = MODES[mode], k = Math.max(0.6, W / 960), r = m.r * k, pad = r + 20;
            if (bgSel === 'mix') { let n; do n = BG_IDS[Math.floor(Math.random() * BG_IDS.length)]; while (n === bgNow && BG_IDS.length > 1); bgNow = n; acColor = null; }
            let x, y, tries = 0;
            const prev = run.t;
            do { x = pad + Math.random() * (W - 2 * pad); y = pad + Math.random() * (H - 2 * pad); tries++; } while (prev && Math.hypot(x - prev.x, y - prev.y) < W * 0.18 && tries < 20);
            run.t = { x, y, r, at: performance.now(), vx: 0, vy: 0 };
        }
        function start() {
            stop();
            if (mode === 'visi') return;
            bgNow = bgSel === 'mix' ? BG_IDS[0] : bgSel;
            run = { cd: 3, cdAt: performance.now(), hits: 0, miss: 0, times: [], byBg: {}, fx: [], on: 0, total: 0, t: null, begin: 0 };
            over.classList.add('hide'); visbox.innerHTML = '';
            loop();
        }
        function stop() { cancelAnimationFrame(raf); raf = 0; run = null; }
        function finish() {
            const m = MODES[mode], r = run; stop();
            let score, cells;
            if (mode === 'track') {
                const ratio = r.total ? r.on / r.total : 0; score = Math.round(ratio * 10000);
                cells = [['Sur la cible', Math.round(ratio * 100) + ' %'], ['Durée', m.dur + ' s'], ['Score', score], ['Niveau', rankOf(score)[1]]];
            } else {
                const avg = r.times.reduce((a, b) => a + b, 0) / Math.max(1, r.times.length);
                const acc = r.hits / Math.max(1, r.hits + r.miss);
                score = Math.round(Math.min(12000, acc * acc * (mode === 'micro' ? 8e6 : 6e6) / Math.max(150, avg)));
                cells = [['Temps moyen', Math.round(avg) + ' ms'], ['Précision', Math.round(acc * 100) + ' %'], ['Ratés', r.miss], ['Score', score]];
            }
            const rk = rankOf(score);
            const rec = { mode, score, date: Date.now(), bg: bgSel };
            const best = store.best[mode], isBest = !best || score > best.score;
            if (isBest) store.best[mode] = rec;
            store.hist.push(rec); store.hist = store.hist.slice(-40); saveStore(); syncBar();
            let perBg = '';
            if (mode !== 'track' && bgSel === 'mix') {
                const rows = Object.entries(r.byBg).map(([b, a]) => [b, a.reduce((x, y) => x + y, 0) / a.length]).sort((a, b) => b[1] - a[1]);
                if (rows.length > 1) perBg = `<div class="aim-small">Temps moyen par fond : ${rows.map(([b, t], i) => `<b style="color:${i === 0 ? '#fb923c' : '#fff'}">${BGS[b]} ${Math.round(t)} ms</b>`).join(' • ')}<br>Le fond le plus lent est souvent celui où ton crosshair se voit le moins.</div>`;
            }
            over.classList.remove('hide');
            over.innerHTML = `<div class="aim-big" style="color:${rk[2]}">${score}</div><div style="font-weight:800;color:${rk[2]}">${rk[1]}${isBest ? ' • nouveau record' : ''}</div>
                <div class="aim-res">${cells.map(([a, b]) => `<div><b>${b}</b><span>${a}</span></div>`).join('')}</div>${perBg}
                <button type="button" class="aim-go" data-aim-start>Rejouer</button>`;
            frame();
            if (opts.onResult) try { opts.onResult(rec); } catch (e) {}
        }

        // couleur réellement affichée (profil ou couleur auto calculée sur le fond sous le crosshair)
        function displayed(s) {
            if (!(useAuto && AC)) return s;
            const now = performance.now(), a = acOpts();
            if (!acColor || now - acLast > (a.interval || 400)) {
                acLast = now;
                const z = Math.max(20, Math.min(200, a.zone || 140)) * dpr, cx = mouse.x * dpr, cy = mouse.y * dpr;
                const x0 = Math.max(0, Math.round(cx - z / 2)), y0 = Math.max(0, Math.round(cy - z / 2));
                const wz = Math.min(cv.width - x0, Math.round(z)), hz = Math.min(cv.height - y0, Math.round(z));
                if (wz > 4 && hz > 4) {
                    const img = ctx.getImageData(x0, y0, wz, hz), an = AC.analyze(img.data, wz * hz);
                    if (an) { const r = AC.pick(an, a, prevPick); prevPick = r.color; acColor = r; }
                }
            }
            if (!acColor) return s;
            const o = Object.assign({}, s, { color: acColor.color });
            if (a.outline) o.outlineColor = acColor.outline; if (a.glow) o.glowColor = acColor.color;
            return o;
        }
        function drawTarget(t) {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(t.x + 2, t.y + 3, t.r, t.r, 0, 0, Math.PI * 2); ctx.fill();
            [[1, '#e11d48'], [0.68, '#f8fafc'], [0.36, '#e11d48']].forEach(([k, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, Math.PI * 2); ctx.fill(); });
            ctx.restore();
        }
        function frame() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(bgCanvas(run || bgSel !== 'mix' ? bgNow : 'game'), 0, 0);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const now = performance.now();
            if (run && run.cd <= 0) {
                if (run.t) drawTarget(run.t);
                run.fx = run.fx.filter(f => now - f.at < 350);
                run.fx.forEach(f => { const k = (now - f.at) / 350; ctx.strokeStyle = f.ok ? `rgba(74,222,128,${1 - k})` : `rgba(248,113,113,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + k * 18, 0, Math.PI * 2); ctx.stroke(); });
            }
            let s = getS();
            if (mouse.in || run) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                s = displayed(s);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.imageSmoothingEnabled = false;
                C.draw(ctx, Math.round(mouse.x), Math.round(mouse.y), Object.assign({}, s, { offsetX: 0, offsetY: 0 }));
            }
            if (run && run.cd > 0) {
                ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(H / 5)}px ui-monospace,Consolas,monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(String(Math.ceil(run.cd)), W / 2, H / 2); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
            }
            if (run && run.cd <= 0) {
                const m = MODES[mode];
                hud.textContent = mode === 'track' ? `${Math.max(0, m.dur - (now - run.begin) / 1000).toFixed(1)} s • sur la cible ${run.total ? Math.round(run.on / run.total * 100) : 0} %` : `${run.hits}/${m.n} • ratés ${run.miss}${bgSel === 'mix' ? ' • ' + BGS[bgNow] : ''}`;
            } else hud.textContent = !run && mouse.in ? (useAuto && acColor ? 'Couleur auto : ' + acColor.color : '') : '';
        }
        let lastT = 0;
        function loop() {
            if (!run) return;
            const now = performance.now(), dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
            if (run.cd > 0) {
                run.cd = 3 - (now - run.cdAt) / 1000;
                if (run.cd <= 0) { run.begin = now; nextTarget(); if (mode === 'track') { run.t.x = W / 2; run.t.y = H / 2; } }
            } else if (mode === 'track') {
                const t = run.t, sp = W * 0.32;
                if (!t.chg || now > t.chg) { const a = Math.random() * Math.PI * 2, v = sp * (0.45 + Math.random() * 0.75); t.tx = Math.cos(a) * v; t.ty = Math.sin(a) * v; t.chg = now + 450 + Math.random() * 900; if (bgSel === 'mix' && Math.random() < 0.18) { bgNow = BG_IDS[Math.floor(Math.random() * BG_IDS.length)]; acColor = null; } }
                t.vx += (t.tx - t.vx) * Math.min(1, dt * 4); t.vy += (t.ty - t.vy) * Math.min(1, dt * 4);
                t.x += t.vx * dt; t.y += t.vy * dt;
                if (t.x < t.r + 10 || t.x > W - t.r - 10) { t.vx = -t.vx; t.tx = -t.tx; t.x = Math.max(t.r + 10, Math.min(W - t.r - 10, t.x)); }
                if (t.y < t.r + 10 || t.y > H - t.r - 10) { t.vy = -t.vy; t.ty = -t.ty; t.y = Math.max(t.r + 10, Math.min(H - t.r - 10, t.y)); }
                run.total += dt; if (mouse.in && Math.hypot(mouse.x - t.x, mouse.y - t.y) <= t.r) run.on += dt;
                if ((now - run.begin) / 1000 >= MODES.track.dur) { frame(); return finish(); }
            }
            frame();
            raf = requestAnimationFrame(loop);
        }

        // ---------- test de visibilité ----------
        function visScore(s, id) {
            if (!AC) return null;
            const c = document.createElement('canvas'); c.width = 160; c.height = 90;
            const x = c.getContext('2d'); drawBg(x, 160, 90, id);
            const img = x.getImageData(50, 15, 60, 60), an = AC.analyze(img.data, 3600);
            let col = s.color, out = s.outline ? s.outlineColor : null;
            if (useAuto) { const r = AC.pick(an, acOpts(), null); col = r.color; if (acOpts().outline) out = r.outline; }
            const main = AC.score(AC.hexToRgb(col), an), ol = out ? AC.score(AC.hexToRgb(out), an) * 0.75 : 0;
            return { v: Math.max(main, ol), col, an };
        }
        function renderVis() {
            const s = getS();
            if (!AC) { visbox.innerHTML = '<p class="aim-small">Test indisponible.</p>'; return; }
            const R = BG_IDS.map(id => [id, visScore(s, id)]);
            const lvl = v => v >= 45 ? ['Très visible', '#4ade80'] : v >= 28 ? ['Visible', '#a3e635'] : v >= 16 ? ['Moyen', '#facc15'] : ['Peu visible', '#f87171'];
            const worst = R.slice().sort((a, b) => a[1].v - b[1].v)[0];
            const avg = R.reduce((t, r) => t + r[1].v, 0) / R.length;
            visbox.innerHTML = `<div class="aim-small" style="margin-top:10px">Visibilité moyenne : <b style="color:${lvl(avg)[1]}">${lvl(avg)[0]}</b>. Fond le plus difficile : <b>${BGS[worst[0]]}</b>${useAuto ? ' (avec la couleur auto)' : ''}.
                ${lvl(worst[1].v)[0] === 'Peu visible' ? ' Conseil : active un contour noir, change de couleur ou active la couleur auto dans l\'appli.' : ''}</div>
                <div class="aim-vis">${R.map(([id, r]) => `<div class="v"><canvas data-vis="${id}" width="240" height="140"></canvas><div class="t"><span>${BGS[id]}</span><b style="color:${lvl(r.v)[1]}">${lvl(r.v)[0]}</b></div></div>`).join('')}</div>`;
            visbox.querySelectorAll('[data-vis]').forEach(c => {
                const x = c.getContext('2d'), id = c.dataset.vis; drawBg(x, 240, 140, id);
                const r = R.find(z => z[0] === id)[1];
                x.imageSmoothingEnabled = false;
                C.draw(x, 120, 70, Object.assign({}, s, { color: r.col, offsetX: 0, offsetY: 0 }, useAuto && acOpts().outline ? { outlineColor: visScore(s, id) && AC.pick(r.an, acOpts(), null).outline } : {}));
            });
        }

        syncBar(); idle(); frame();
        return {
            refresh() { if (!run) frame(); if (mode === 'visi') renderVis(); },
            stop() { stop(); idle(); frame(); },
            destroy() { stop(); root.removeEventListener('keydown', onKey); if (ro) ro.disconnect(); el.innerHTML = ''; },
            get running() { return !!run; },
            _test: { visScore: id => visScore(getS(), id), start, finish, mode: m => setMode(m), state: () => run }
        };
    }

    const api = { mount, drawBg, BGS, MODES };
    root.AR2Aim = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
