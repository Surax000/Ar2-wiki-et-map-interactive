/* AR2 Crosshair – couleur automatique (analyse du fond derrière le crosshair).
   Partagé entre le processus principal (Node) et la fenêtre de capture (navigateur). */
(function (root) {
    const DEFAULT_PALETTE = ['#00ff88', '#ff2d55', '#ffffff', '#000000', '#22d3ee', '#facc15', '#e879f9', '#3b82f6', '#fb923c'];
    const MAX_PALETTE = 256;
    const DEFAULTS = {
        enabled: false,
        interval: 400,        // ms entre deux analyses
        zone: 140,            // taille de la zone analysée autour du centre (px)
        mode: 'contrast',     // contrast | opposite | bw
        palette: DEFAULT_PALETTE.slice(),
        sensitivity: 15,      // % d'amélioration minimum avant de changer (anti-clignotement)
        fade: 180,            // durée du fondu de couleur (ms)
        outline: true,        // contour automatique (noir ou blanc selon la couleur)
        glow: true            // la lueur suit la couleur
    };

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function hexToRgb(hex) {
        const h = String(hex || '#000').replace('#', '');
        const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
        const n = parseInt(f.slice(0, 6), 16) || 0;
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
    function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function luminance([r, g, b]) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
    function contrastRatio(a, b) { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
    function rgbToLab([r, g, b]) {
        const R = lin(r), G = lin(g), B = lin(b);
        let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
        let y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
        let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
        const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
        x = f(x); y = f(y); z = f(z);
        return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    }
    function deltaE(a, b) { const A = rgbToLab(a), B = rgbToLab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); }
    function rgbToHsl([r, g, b]) {
        r /= 255; g /= 255; b /= 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
        if (mx === mn) return [0, 0, l];
        const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return [h * 60, s, l];
    }
    function hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360 / 360;
        if (!s) return [l * 255, l * 255, l * 255];
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
        const t = x => { x = (x + 1) % 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < 0.5 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
        return [t(h + 1 / 3) * 255, t(h) * 255, t(h - 1 / 3) * 255];
    }
    const colorCandidate = color => {
        const rgb = hexToRgb(color);
        return { color, rgb, lab: rgbToLab(rgb), luminance: luminance(rgb) };
    };
    const FULL_SPECTRUM = (() => {
        const colors = new Set(DEFAULT_PALETTE);
        for (let h = 0; h < 360; h += 3) {
            for (const s of [0.65, 0.85, 1]) {
                for (const l of [0.22, 0.38, 0.54, 0.7, 0.82]) colors.add(rgbToHex(...hslToRgb(h, s, l)));
            }
        }
        return Array.from(colors, colorCandidate);
    })();
    function normalizePalette(palette) {
        if (!Array.isArray(palette)) return [];
        return Array.from(new Set(palette
            .filter(color => typeof color === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color))
            .map(color => rgbToHex(...hexToRgb(color))))).slice(0, MAX_PALETTE);
    }

    // pixels : tableau RGBA (Uint8 / Uint8Clamped). skip(i) -> true pour ignorer le pixel i.
    // Renvoie { avg:[r,g,b], clusters:[{rgb,w}] } (k-means léger, 3 groupes)
    function analyze(pixels, count, skip, order) {
        const pts = [];
        const bgra = order === 'bgra';
        for (let i = 0; i < count; i++) {
            if (skip && skip(i)) continue;
            const o = i * 4;
            pts.push(bgra ? [pixels[o + 2], pixels[o + 1], pixels[o]] : [pixels[o], pixels[o + 1], pixels[o + 2]]);
        }
        if (!pts.length) return null;
        const avg = [0, 0, 0];
        pts.forEach(p => { avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2]; });
        avg[0] /= pts.length; avg[1] /= pts.length; avg[2] /= pts.length;
        // k-means : départ = plus sombre, moyen, plus clair
        const byL = pts.slice().sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
        let C = [byL[0], byL[Math.floor(byL.length / 2)], byL[byL.length - 1]].map(c => c.slice());
        let assign = new Array(pts.length).fill(0);
        for (let it = 0; it < 5; it++) {
            const sum = C.map(() => [0, 0, 0, 0]);
            pts.forEach((p, i) => {
                let bi = 0, bd = Infinity;
                C.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; bi = j; } });
                assign[i] = bi; const s = sum[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
            });
            C = C.map((c, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c);
        }
        const w = C.map(() => 0); assign.forEach(a => w[a]++);
        const clusters = C.map((c, j) => ({ rgb: c.map(Math.round), w: w[j] / pts.length })).filter(c => c.w > 0.02).sort((a, b) => b.w - a.w);
        return { avg: avg.map(Math.round), clusters, n: pts.length };
    }

    // Score de visibilité d'une couleur sur le fond analysé (0..~100)
    function scoreContext(a) {
        const cl = a.clusters && a.clusters.length ? a.clusters : [{ rgb: a.avg, w: 1 }];
        return cl.map(c => ({ rgb: c.rgb, lab: rgbToLab(c.rgb), luminance: luminance(c.rgb), w: c.w }));
    }
    function scoreCandidate(candidate, clusters) {
        let worst = Infinity, mean = 0;
        clusters.forEach(c => {
            const lab = candidate.lab || rgbToLab(candidate.rgb);
            const ratio = (Math.max(candidate.luminance, c.luminance) + 0.05) / (Math.min(candidate.luminance, c.luminance) + 0.05);
            const d = Math.hypot(lab[0] - c.lab[0], lab[1] - c.lab[1], lab[2] - c.lab[2]) + 6 * Math.log2(ratio);
            mean += d * c.w; if (c.w >= 0.12 && d < worst) worst = d;
        });
        if (!isFinite(worst)) worst = mean;
        return 0.6 * worst + 0.4 * mean;
    }
    function score(rgb, a) {
        const candidate = { rgb, luminance: luminance(rgb), lab: rgbToLab(rgb) };
        return scoreCandidate(candidate, scoreContext(a));
    }
    function refineColor(seed, clusters) {
        let best = seed, bestScore = scoreCandidate(seed, clusters);
        for (const step of [16, 4, 1]) {
            for (let pass = 0; pass < 2; pass++) {
                let next = best, nextScore = bestScore;
                for (const r of [-step, 0, step]) for (const g of [-step, 0, step]) for (const b of [-step, 0, step]) {
                    if (!r && !g && !b) continue;
                    const rgb = [clamp(best.rgb[0] + r, 0, 255), clamp(best.rgb[1] + g, 0, 255), clamp(best.rgb[2] + b, 0, 255)];
                    if (rgb.every((v, i) => v === best.rgb[i])) continue;
                    const candidate = { color: rgbToHex(...rgb), rgb, lab: rgbToLab(rgb), luminance: luminance(rgb) };
                    const candidateScore = scoreCandidate(candidate, clusters);
                    if (candidateScore > nextScore) { next = candidate; nextScore = candidateScore; }
                }
                if (next === best) break;
                best = next; bestScore = nextScore;
            }
        }
        return { candidate: best, score: bestScore };
    }
    function opposite(a) {
        const [h, s, l] = rgbToHsl(a.avg);
        if (s < 0.18 || l > 0.9 || l < 0.08) return null; // fond gris : pas de couleur « opposée » nette
        return rgbToHex(...hslToRgb(h + 180, 1, l > 0.55 ? 0.38 : 0.6));
    }
    // Choisit la couleur. prev = couleur actuelle (pour l'anti-clignotement)
    function pick(a, opts, prev) {
        const o = Object.assign({}, DEFAULTS, opts || {});
        const favorites = normalizePalette(o.palette).map(colorCandidate);
        let cands;
        if (o.mode === 'bw') cands = [colorCandidate('#ffffff'), colorCandidate('#000000')];
        else if (o.mode === 'opposite') { const op = opposite(a); cands = op ? [colorCandidate(op)] : FULL_SPECTRUM.concat(favorites); }
        else cands = FULL_SPECTRUM.concat(favorites);
        const clusters = scoreContext(a);
        let best = null, bs = -Infinity;
        cands.forEach(c => {
            const candidateScore = scoreCandidate(c, clusters);
            if (candidateScore > bs) { best = c; bs = candidateScore; }
        });
        if (o.mode !== 'bw' && !(o.mode === 'opposite' && opposite(a))) {
            const refined = refineColor(best, clusters);
            if (refined.score > bs) { best = refined.candidate; bs = refined.score; }
        }
        let color = best.color, sc = bs, kept = false;
        if (prev && prev !== color && o.mode !== 'opposite') {
            const ps = scoreCandidate(colorCandidate(prev), clusters);
            if (ps * (1 + (o.sensitivity || 0) / 100) >= bs && ps > 25) { color = prev; sc = ps; kept = true; }
        }
        const outline = luminance(hexToRgb(color)) > 0.35 ? '#000000' : '#ffffff';
        return { color, outline, score: Math.round(sc), bg: rgbToHex(...a.avg), kept };
    }

    const api = { DEFAULTS, DEFAULT_PALETTE, MAX_PALETTE, normalizePalette, analyze, pick, score, hexToRgb, rgbToHex, deltaE, contrastRatio, opposite };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.AR2AutoColor = api;
})(typeof window !== 'undefined' ? window : globalThis);
