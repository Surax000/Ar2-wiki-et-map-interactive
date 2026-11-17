// Carte tactique en overlay (Ctrl+Alt+M) : la carte du site (archipel ou Kin Flats) par-dessus le jeu,
// avec les bâtiments utiles, les lieux cachés, tes lieux perso et le Loot Run de la boussole.
(function () {
    const T = window.AR2Tools, mapBox = document.getElementById('map'), bar = document.getElementById('bar');
    const esc = s => T.esc(String(s == null ? '' : s));
    const short = n => String(n).replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+–\s+près de.*$/, '').trim();
    function base(D) {
        const M = D.map, P = M.pal, W = M.W, H = M.H;
        if (D.world === 'kf' && M.kf) {
            const v = M.kf.vec, cw = W / 6, ch = H / 6, g = [], gl = [];
            for (let i = 1; i < 6; i++) { g.push(`<line x1="${i * cw}" y1="0" x2="${i * cw}" y2="${H}"/>`, `<line x1="0" y1="${i * ch}" x2="${W}" y2="${i * ch}"/>`); }
            for (let i = 0; i < 6; i++) { gl.push(`<text class="grid" x="${i * cw + cw / 2}" y="28" text-anchor="middle">${'ABCDEF'[i]}</text>`, `<text class="grid" x="16" y="${i * ch + ch / 2 + 8}" text-anchor="middle">${i + 1}</text>`); }
            return `<rect width="${W}" height="${H}" fill="${P.land}"/>
                <path d="${v.hillsDark}" fill="${P.forest}" fill-rule="evenodd" opacity=".9"/><path d="${v.hillsLight}" fill="#24432f" fill-rule="evenodd" opacity=".85"/>
                <g stroke="#fff" stroke-opacity=".06">${g.join('')}</g>
                <path d="${v.fields}" fill="${P.sand}" stroke="#7c7150" stroke-width="1.2" fill-rule="evenodd"/>
                <path d="${v.pathsL}" fill="none" stroke="#6e5838" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="${v.roadsL}" fill="none" stroke="#1a222b" stroke-width="5.4" stroke-linecap="round" opacity=".55"/><path d="${v.roadsL}" fill="none" stroke="#7b8794" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
                ${gl.join('')}`;
        }
        const p = M.halsey.paths, g = [];
        for (let i = 0; i <= 6; i++) { const x = 75 + i * 170; g.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${P.grid}"/><line x1="0" y1="${x}" x2="${W}" y2="${x}" stroke="${P.grid}"/>`); }
        const isl = (M.halsey.labels || []).map(([n, x, y]) => `<text class="isl" x="${x}" y="${y}" text-anchor="middle">${esc(n)}</text>`).join('');
        return `<rect width="${W}" height="${H}" fill="${P.ocean}"/>${g.join('')}
            <path d="${p.land}" fill="${P.land}" stroke="${P.coast}" stroke-width="2"/><path d="${p.sand}" fill="${P.sand}"/><path d="${p.forest}" fill="${P.forest}"/>
            <path d="${p.lakes}" fill="${P.lake}"/><path d="${p.roads}" fill="${P.road}"/>${isl}`;
    }
    function icons(D) {
        if (D.world !== 'kf' || !D.bld || !D.map.kf) return '';
        const def = D.map.kf.iconDef;
        return D.map.kf.icons.map(([t, x, y]) => { const d = def[t]; if (!d) return ''; return `<g transform="translate(${x},${y}) scale(1.05)"><rect x="-8" y="-8" width="16" height="16" rx="4.5" fill="${d[1]}" stroke="#0b0f14" stroke-width="1.5"/>${d[2]}</g>`; }).join('');
    }
    function points(D) {
        const cats = D.map.cats || {}, out = [], lbl = [];
        D.pts.forEach(p => {
            const c = (cats[p.c] || [])[1] || '#8b949e';
            if (p.k === 'custom') out.push(`<g transform="translate(${p.x},${p.y})"><path d="M0 -11 C6 -11 8 -6 8 -3 C8 3 0 9 0 9 C0 9 -8 3 -8 -3 C-8 -6 -6 -11 0 -11Z" fill="#fbbf24" stroke="#0b0f14" stroke-width="1.6"/><circle cy="-3" r="2.6" fill="#0b0f14"/></g>`);
            else if (p.k === 'veh') out.push(`<rect x="${p.x - 5}" y="${p.y - 5}" width="10" height="10" rx="2.5" fill="${c}" stroke="#0b0f14" stroke-width="1.5"/>`);
            else if (p.k === 'event') out.push(`<path d="M${p.x} ${p.y - 6}L${p.x + 6} ${p.y}L${p.x} ${p.y + 6}L${p.x - 6} ${p.y}Z" fill="${c}" stroke="#0b0f14" stroke-width="1.3" opacity=".9"/>`);
            else if (p.h) out.push(`<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${c}" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.5 2"/>`);
            else if (D.world === 'kf' && p.c === 'ville') { /* nom seul */ }
            else out.push(`<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${c}" stroke="#0b0f14" stroke-width="1.5"/>`);
            if (D.labels && p.k !== 'event' && p.k !== 'veh') {
                const big = p.c === 'ville';
                lbl.push(`<text class="lbl${big ? ' big' : ''}${p.h ? ' hid' : ''}" x="${p.x}" y="${p.y - (big ? (D.world === 'kf' ? 16 : 10) : p.k === 'custom' ? 15 : 9)}" text-anchor="middle">${esc(short(p.n))}</text>`);
            }
        });
        return out.join('') + lbl.join('');
    }
    function route(D) {
        const r = D.route; if (!r) return '';
        const d = r.pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');
        const a = r.pts[r.leg], b = r.pts[r.leg + 1];
        const marks = r.pts.map((p, i) => `<g transform="translate(${p.x},${p.y})"><circle r="${i === r.leg + 1 ? 14 : 11}" fill="${i <= r.leg ? '#6b7280' : i === r.leg + 1 ? 'rgb(var(--t-acc))' : '#f97316'}" stroke="#0b0f14" stroke-width="2.5"/><text y="4.5" text-anchor="middle" class="num">${i + 1}</text></g>`).join('');
        return `<path d="${d}" fill="none" stroke="#f97316" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/>
            <path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="rgb(var(--t-acc))" stroke-width="6" stroke-linecap="round"/>
            <path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="7 8" opacity=".9"/>
            <circle cx="${b.x}" cy="${b.y}" r="14" fill="none" stroke="rgb(var(--t-acc))" stroke-width="3" class="pulse"/>${marks}`;
    }
    function draw(D) {
        T.applyTheme(D.theme);
        document.getElementById('wrap').style.opacity = D.opacity;
        if (!D.map) { mapBox.innerHTML = ''; bar.innerHTML = `<span>Carte pas encore chargée : ouvre une fois le wiki AR2 dans l'appli pour la télécharger.</span>`; return; }
        const M = D.map;
        mapBox.innerHTML = `<svg viewBox="0 0 ${M.W} ${M.H}" preserveAspectRatio="xMidYMid meet" style="background:${D.world === 'kf' ? M.pal.land : M.pal.ocean}">${base(D)}${icons(D)}${points(D)}${route(D)}</svg>`;
        const name = D.world === 'kf' ? 'Kin Flats' : 'Archipel';
        const capTxt = D.cap ? `<span class="cap">${String(Math.round(D.cap.deg) % 360).padStart(3, '0')}° ${esc(D.cap.card)}</span><span>vers <b>${esc(D.cap.to)}</b> · ${esc(D.cap.dist)} · ${esc(D.cap.t)}</span>`
            : D.routeOther ? '<span>Ton Loot Run est sur l’autre carte.</span>' : '<span>Aucun Loot Run actif.</span>';
        bar.innerHTML = `<span class="w">${name}</span>${capTxt}<span class="k"><i>${esc(D.keys.toggle)}</i> masquer${D.keys.world ? ` · <i>${esc(D.keys.world)}</i> changer de carte` : ''}</span>`;
    }
    window.xh.onTheme(id => T.applyTheme(id));
    window.xh.onTmap(draw);
})();
