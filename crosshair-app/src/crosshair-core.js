/* AR2 Crosshair – moteur de dessin partagé (appli + site web) */
(function (root) {
    const DEFAULTS = {
        style: 'crossdot',      // cross | crossdot | dot | circle | circlecross | circledot | tshape | x | chevron | square | triangle
        color: '#00ff88',
        opacity: 1,
        length: 8,              // longueur des branches (px)
        thickness: 2,           // épaisseur (px)
        gap: 4,                 // écart au centre (px)
        dotSize: 2,             // rayon du point central (px)
        circleRadius: 10,       // rayon du cercle (px)
        outline: true,
        outlineColor: '#000000',
        outlineWidth: 1,
        glow: false,
        glowColor: '#00ff88',
        glowSize: 6,
        rotation: 0,            // degrés
        scale: 1,
        armTop: true, armBottom: true, armLeft: true, armRight: true,
        offsetX: 0, offsetY: 0  // décalage depuis le centre de l'écran (px)
    };
    const STYLES = {
        cross: 'Croix', crossdot: 'Croix + point', dot: 'Point', circle: 'Cercle', circlecross: 'Cercle + croix',
        circledot: 'Cercle + point', tshape: 'T (sans haut)', x: 'Croix en X', chevron: 'Chevron', square: 'Carré', triangle: 'Triangle'
    };
    const PRESETS = [
        { name: 'AR2 vert (défaut)', s: {} },
        { name: 'Point rouge', s: { style: 'dot', color: '#ff2d55', dotSize: 3, glow: true, glowColor: '#ff2d55' } },
        { name: 'Croix fine blanche', s: { style: 'cross', color: '#ffffff', length: 6, thickness: 1, gap: 3 } },
        { name: 'Cercle cyan', s: { style: 'circledot', color: '#22d3ee', circleRadius: 12, thickness: 2, dotSize: 1.5 } },
        { name: 'Sniper', s: { style: 'circlecross', color: '#facc15', circleRadius: 22, length: 14, gap: 6, thickness: 1.5 } },
        { name: 'T compétitif', s: { style: 'tshape', color: '#a3e635', length: 7, thickness: 2, gap: 3 } },
        { name: 'Chevron orange', s: { style: 'chevron', color: '#fb923c', length: 10, thickness: 2.5 } },
        { name: 'X magenta', s: { style: 'x', color: '#e879f9', length: 7, gap: 2, thickness: 2 } }
    ];

    function withDefaults(s) { return Object.assign({}, DEFAULTS, s || {}); }

    function hexA(hex, a) {
        const h = String(hex || '#000').replace('#', '');
        const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
        const n = parseInt(f.slice(0, 6), 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }

    // Dessine le crosshair centré en (cx, cy)
    function draw(ctx, cx, cy, settings) {
        const s = withDefaults(settings);
        const k = Math.max(0.1, Number(s.scale) || 1);
        const L = s.length * k, T = s.thickness * k, G = s.gap * k, D = s.dotSize * k, R = s.circleRadius * k, O = s.outline ? s.outlineWidth * k : 0;
        const shapes = []; // {type:'rect'|'circle'|'ring'|'poly', ...}
        const rect = (x, y, w, h) => shapes.push({ type: 'rect', x, y, w, h });
        const arms = (diag) => {
            const h = T / 2;
            if (s.armRight) rect(G, -h, L, T);
            if (s.armLeft) rect(-G - L, -h, L, T);
            if (s.armBottom) rect(-h, G, T, L);
            if (s.armTop && !diag) rect(-h, -G - L, T, L);
        };
        const dot = () => shapes.push({ type: 'circle', r: D });
        const ring = () => shapes.push({ type: 'ring', r: R, w: T });
        let rot = s.rotation || 0;
        switch (s.style) {
            case 'cross': arms(); break;
            case 'crossdot': arms(); dot(); break;
            case 'dot': dot(); break;
            case 'circle': ring(); break;
            case 'circlecross': ring(); arms(); break;
            case 'circledot': ring(); dot(); break;
            case 'tshape': { const h = T / 2; rect(G, -h, L, T); rect(-G - L, -h, L, T); rect(-h, G, T, L); dot(); break; }
            case 'x': arms(); rot += 45; break;
            case 'chevron': shapes.push({ type: 'poly', pts: [[-L, L * 0.8], [0, 0], [L, L * 0.8]], w: T }); break;
            case 'square': shapes.push({ type: 'sq', r: R * 0.7, w: T }); dot(); break;
            case 'triangle': shapes.push({ type: 'poly', pts: [[0, -R], [R * 0.87, R * 0.5], [-R * 0.87, R * 0.5], [0, -R]], w: T }); break;
            default: arms(); dot();
        }
        ctx.save();
        const snap = (Math.round(T) % 2 === 1 && Math.abs(T - Math.round(T)) < .01) ? .5 : 0;
        ctx.translate(Math.round(cx) + snap, Math.round(cy) + snap);
        ctx.rotate(rot * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, Math.min(1, Number(s.opacity)));
        const paint = (pass) => {
            // pass 0 = contour, 1 = couleur
            const grow = pass === 0 ? O : 0;
            const col = pass === 0 ? s.outlineColor : s.color;
            ctx.fillStyle = col; ctx.strokeStyle = col;
            ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
            for (const sh of shapes) {
                if (sh.type === 'rect') ctx.fillRect(sh.x - grow, sh.y - grow, sh.w + grow * 2, sh.h + grow * 2);
                else if (sh.type === 'circle') { ctx.beginPath(); ctx.arc(0, 0, sh.r + grow, 0, Math.PI * 2); ctx.fill(); }
                else if (sh.type === 'ring') { ctx.beginPath(); ctx.lineWidth = sh.w + grow * 2; ctx.arc(0, 0, sh.r, 0, Math.PI * 2); ctx.stroke(); }
                else if (sh.type === 'sq') { ctx.lineWidth = sh.w + grow * 2; ctx.strokeRect(-sh.r, -sh.r, sh.r * 2, sh.r * 2); }
                else if (sh.type === 'poly') {
                    ctx.beginPath(); ctx.lineWidth = sh.w + grow * 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                    sh.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
                }
            }
        };
        if (s.glow) { ctx.shadowColor = hexA(s.glowColor, 0.95); ctx.shadowBlur = s.glowSize * k; }
        if (O > 0) paint(0);
        ctx.shadowBlur = 0;
        paint(1);
        ctx.restore();
    }

    // Taille utile du dessin (pour dimensionner la fenêtre)
    function extent(settings) {
        const s = withDefaults(settings);
        const k = Math.max(0.1, Number(s.scale) || 1);
        return Math.ceil((Math.max(s.gap + s.length, s.circleRadius + s.thickness, s.dotSize) + s.outlineWidth + (s.glow ? s.glowSize : 0)) * k * 1.5 + 8);
    }

    // Codes de partage : AR2X-<base64 json>
    const SHARE_KEYS = Object.keys(DEFAULTS).filter(k => k !== 'offsetX' && k !== 'offsetY');
    function toCode(settings) {
        const s = withDefaults(settings), o = {};
        SHARE_KEYS.forEach(k => { if (s[k] !== DEFAULTS[k]) o[k] = s[k]; });
        const json = JSON.stringify(o);
        const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
        return 'AR2X-' + b64;
    }
    function fromCode(code) {
        const c = String(code || '').trim().replace(/^AR2X-/, '');
        const json = typeof atob === 'function' ? decodeURIComponent(escape(atob(c))) : Buffer.from(c, 'base64').toString('utf8');
        const o = JSON.parse(json);
        if (!o || typeof o !== 'object') throw new Error('code invalide');
        const out = {};
        SHARE_KEYS.forEach(k => { if (k in o) out[k] = o[k]; });
        return out;
    }

    const api = { DEFAULTS, STYLES, PRESETS, withDefaults, draw, extent, toCode, fromCode };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.AR2Crosshair = api;
})(typeof window !== 'undefined' ? window : globalThis);
