/* AR2 Tools – code partagé entre le site AR2 Armory et l'appli AR2 Crosshair.
 * - Thèmes visuels (HUD skins) : Classique, Nocturne / NVG, Militaire / Olive, Minimaliste / E-Sport
 * - Recherche instantanée (Wiki en overlay, Ctrl+Alt+W dans l'appli, Ctrl+K sur le site)
 * - Duel Express : verdict tranché entre 2 objets
 * - Cap de navigation (boussole) entre 2 lieux de la carte
 * - Télémètre (taille d'un personnage dans la lunette -> distance + perte de dégâts)
 * Aucune dépendance : marche dans le navigateur (window.AR2Tools) et dans Node (module.exports).
 */
(function (root) {
    'use strict';

    // ============================================================
    // THÈMES
    // ============================================================
    // rgb = "r g b" (pour les opacités Tailwind : rgb(var(--t-acc) / .1))
    const THEMES = {
        classic: { id: 'classic', name: 'Classique', desc: 'Le design d\'origine : anthracite et vert tactique.',
            bg: '#0f1115', card: '#161920', border: '#2a2f3a', acc: '#00ff88', gold: '#e5c07b', red: '#ff4757', muted: '#8b949e', text: '#ffffff', ink: '#0b0f14', hud: 'rgba(10,13,18,.78)', scan: 0 },
        nvg: { id: 'nvg', name: 'Nocturne / NVG', desc: 'Noir profond et vert phosphore, façon lunettes de vision nocturne.',
            bg: '#020503', card: '#06100a', border: '#173a22', acc: '#5dff7a', gold: '#b8ff9e', red: '#ff5a4f', muted: '#6f9e78', text: '#d9ffe1', ink: '#011004', hud: 'rgba(1,8,3,.80)', scan: 1 },
        olive: { id: 'olive', name: 'Militaire / Olive', desc: 'Kaki sombre et ambre, comme un écran de char.',
            bg: '#14170e', card: '#1d2115', border: '#3b4228', acc: '#ffb020', gold: '#d9c77d', red: '#ff5c3a', muted: '#a09f7c', text: '#efeadb', ink: '#1a1405', hud: 'rgba(20,23,12,.82)', scan: 0 },
        esport: { id: 'esport', name: 'Minimaliste / E-Sport', desc: 'Gris anthracite et cyan électrique, épuré.',
            bg: '#15171b', card: '#1e2127', border: '#323743', acc: '#00e5ff', gold: '#c4b5fd', red: '#ff4d6d', muted: '#8a93a6', text: '#f4f7fb', ink: '#041216', hud: 'rgba(16,18,22,.80)', scan: 0 },
        ocean: { id: 'ocean', name: 'Océan', desc: 'Bleu profond et turquoise lumineux.',
            bg: '#08131d', card: '#102331', border: '#23485b', acc: '#38d6ff', gold: '#a7e8ff', red: '#ff6178', muted: '#8ba9b7', text: '#e9f8ff', ink: '#06131a', hud: 'rgba(4,14,22,.82)', scan: 0 },
        violet: { id: 'violet', name: 'Violet', desc: 'Indigo sombre et violet électrique.',
            bg: '#120e1c', card: '#1d172b', border: '#40305a', acc: '#b48aff', gold: '#f4c2ff', red: '#ff6685', muted: '#a99bbd', text: '#f7f0ff', ink: '#110a1b', hud: 'rgba(13,8,21,.82)', scan: 0 },
        crimson: { id: 'crimson', name: 'Rouge', desc: 'Noir graphite et rouge vif.',
            bg: '#171012', card: '#241719', border: '#503037', acc: '#ff5364', gold: '#ffc0a8', red: '#ff5364', muted: '#ae9296', text: '#fff0f1', ink: '#18090d', hud: 'rgba(20,8,11,.82)', scan: 0 },
        arctic: { id: 'arctic', name: 'Arctique', desc: 'Gris clair et bleu glacier.',
            bg: '#10171c', card: '#192329', border: '#354d59', acc: '#91e5ff', gold: '#ffe6ad', red: '#ff6b79', muted: '#9aabb3', text: '#f1fbff', ink: '#07151b', hud: 'rgba(8,16,21,.82)', scan: 0 },
        custom: { id: 'custom', name: 'Personnalisé', desc: 'Choisis ta propre couleur d’accent.',
            bg: '#12151a', card: '#1a1f26', border: '#343b46', acc: '#a78bfa', gold: '#e5c07b', red: '#ff5364', muted: '#929ba8', text: '#f4f7fb', ink: '#0b0f14', hud: 'rgba(10,13,18,.82)', scan: 0 }
    };
    const THEME_ORDER = ['classic', 'nvg', 'olive', 'esport', 'ocean', 'violet', 'crimson', 'arctic'];
    const validColor = h => /^#[0-9a-f]{6}$/i.test(String(h || ''));
    function mixHex(a, b, amount) {
        const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
        const mix = shift => Math.round(((x >> shift) & 255) * (1 - amount) + ((y >> shift) & 255) * amount);
        return '#' + [16, 8, 0].map(shift => mix(shift).toString(16).padStart(2, '0')).join('');
    }
    function resolveTheme(selection, color) {
        if (selection && typeof selection === 'object') {
            color = selection.color;
            selection = selection.id;
        }
        const id = THEMES[selection] ? selection : 'classic';
        const theme = THEMES[id];
        if (id !== 'custom' || !validColor(color)) return { id, theme };
        return { id, theme: Object.assign({}, theme, { acc: color, border: mixHex(theme.border, color, 0.45) }) };
    }
    const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '')); if (!m) return '0 0 0'; const n = parseInt(m[1], 16); return `${n >> 16 & 255} ${n >> 8 & 255} ${n & 255}`; };
    function themeVars(selection, color) {
        const t = resolveTheme(selection, color).theme;
        const v = {};
        ['bg', 'card', 'border', 'acc', 'gold', 'red', 'muted', 'text', 'ink'].forEach(k => { v['--t-' + k] = hexRgb(t[k]); v['--c-' + k] = t[k]; });
        v['--c-hud'] = t.hud;
        return v;
    }
    function applyTheme(selection, doc, color) {
        doc = doc || (typeof document !== 'undefined' ? document : null);
        if (!doc) return;
        const resolved = resolveTheme(selection, color), el = doc.documentElement;
        const v = themeVars(resolved.id, resolved.theme.acc);
        Object.keys(v).forEach(k => el.style.setProperty(k, v[k]));
        el.setAttribute('data-theme', resolved.id);
    }

    // ============================================================
    // OUTILS TEXTE
    // ============================================================
    const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const tight = s => norm(s).replace(/ /g, '');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fr = (x, n = 0) => (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toLocaleString('fr-FR');
    const sec = s => !isFinite(s) ? '—' : s < 10 ? fr(s, 2) + ' s' : s < 60 ? fr(s, 1) + ' s' : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`;

    // ============================================================
    // RECHERCHE
    // ============================================================
    const TYPE_LABEL = { weapon: 'Arme', attachment: 'Accessoire', heal: 'Soin', food: 'Nourriture', backpack: 'Sac à dos', mag: 'Chargeur', explosive: 'Explosif', cosmetic: 'Cosmétique', loc: 'Lieu', boss: 'Boss / infecté' };
    function prep(index) {
        if (!index || index._prep) return index;
        const all = [];
        (index.items || []).forEach(o => all.push(o));
        (index.locs || []).forEach(o => all.push(Object.assign(o, { type: 'loc' })));
        all.forEach(o => {
            o._n = norm(o.name); o._t = tight(o.name);
            o._w = o._n.split(' ');
            o._k = norm([o.cat, o.cal, o.island, o.slot, o.kind, (o.alias || []).join(' ')].filter(Boolean).join(' '));
            o._ini = o._w.map(w => w[0]).join('');
        });
        index._all = all; index._byId = {}; all.forEach(o => { index._byId[(o.type === 'loc' ? 'loc:' : '') + o.id] = o; });
        index._prep = true;
        return index;
    }
    function scoreOne(o, q, qt, qw) {
        if (!q) return 0;
        let s = 0;
        if (o._n === q || o._t === qt) s = 1000;
        else if (o._t.startsWith(qt)) s = 800 - Math.min(200, o._t.length - qt.length);
        else if (o._w.some(w => w.startsWith(q))) s = 650;
        else if (qw.length > 1 && qw.every(w => o._w.some(x => x.startsWith(w)))) s = 600;
        else if (o._t.includes(qt)) s = 500 - o._t.indexOf(qt);
        else if (qt.length >= 2 && o._ini.startsWith(qt)) s = 420;
        else if (o._k && qw.every(w => o._k.includes(w))) s = 260;
        else {
            // sous-séquence (fautes de frappe légères : « m4a » -> M4A1, « ashlnd » -> Ashland)
            let i = 0; for (const c of o._t) { if (c === qt[i]) i++; if (i === qt.length) break; }
            if (i === qt.length && qt.length >= 3) s = 150 - (o._t.length - qt.length);
        }
        if (!s) return 0;
        if (o.type === 'weapon') s += 6;
        if (o.type === 'loc' && o.cat === 'ville') s += 4;
        return s;
    }
    function search(index, query, limit = 8, filter) {
        prep(index);
        const q = norm(query), qt = q.replace(/ /g, ''), qw = q.split(' ').filter(Boolean);
        if (!qt) return [];
        const out = [];
        for (const o of index._all) { if (filter && !filter(o)) continue; const s = scoreOne(o, q, qt, qw); if (s > 0) out.push([s, o]); }
        out.sort((a, b) => b[0] - a[0] || a[1].name.length - b[1].name.length);
        return out.slice(0, limit).map(x => x[1]);
    }
    const best = (index, q, filter) => search(index, q, 1, filter)[0] || null;
    function get(index, id) { prep(index); return index._byId[id] || index._byId['loc:' + id] || null; }

    // Commandes de la barre rapide :  « A vs B »  -> duel ;  « A > B » / « A -> B » / « A vers B » -> cap
    function parseCommand(text) {
        const t = String(text || '').trim();
        let m = /^(.+?)\s+(?:vs\.?|contre|ou|\/)\s+(.+)$/i.exec(t);
        if (m && m[1].trim().length >= 2 && m[2].trim().length >= 2) return { kind: 'duel', a: m[1].trim(), b: m[2].trim() };
        // chaîne d'étapes : « Clinique de Kin > Pompiers de Kin > Commissariat de Kin »
        const parts = t.split(/\s*(?:->|=>|>|→)\s*|\s+vers\s+/i).map(x => x.trim());
        if (parts.length > 2 && parts.length <= 8 && parts.every(x => x.length >= 2)) return { kind: 'route', a: parts[0], b: parts[parts.length - 1], pts: parts };
        m = /^(.+?)\s*(?:->|=>|>|→|\svers\s)\s*(.+)$/i.exec(t);
        if (m && m[1].trim().length >= 2 && m[2].trim().length >= 2) return { kind: 'route', a: m[1].trim(), b: m[2].trim() };
        m = /^(?:cap|aller|go)\s+(.+)$/i.exec(t);
        if (m) return { kind: 'route', a: null, b: m[1].trim() };
        return { kind: 'search', q: t };
    }

    // ============================================================
    // BALISTIQUE / DÉGÂTS (mêmes formules que le comparateur du site)
    // ============================================================
    const STUD_M = 0.28, GRAV = 196.2, BODY_H = 5.2, HEAD_H = 1.2;
    function falloff(w, d) {
        const fdr = Math.max(0, +w.fdr || 0), mdr = Math.max(fdr + 1, +w.mdr || 0), mf = +w.mf || 0.5;
        if (d <= fdr) return 1;
        if (d >= mdr) return mf;
        return 1 - (1 - mf) * (d - fdr) / (mdr - fdr);
    }
    function ttk(w, d, hp = 100) {
        const f = falloff(w, d), dmg = (+w.bod || 0) * f;
        if (dmg <= 0) return { f, n: Infinity, t: Infinity, dmg: 0 };
        const n = Math.ceil((hp - 1e-9) / dmg), cap = Math.max(1, +w.cap || 1);
        const t = (n - 1) * 60 / Math.max(1, +w.rof || 1) + Math.floor((n - 1) / cap) * (+w.rel || 0);
        return { f, n, t, dmg };
    }
    function drop(w, d) { const v = +w.vel || 0; if (!v) return { t: 0, drop: 0, heads: 0 }; const t = d / v, dr = 0.5 * GRAV * t * t; return { t, drop: dr, heads: dr / HEAD_H }; }
    function aimCorrection(w, d, options) {
        const o = Object.assign({ zoom: 1, screenH: 1080, fov: 70, calib: 1, targetSpeed: 0, targetDirection: 'right' }, options || {});
        const distance = Math.max(0, +d || 0), velocity = w && (+w.vel || 0);
        if (!distance || !velocity) return { available: false, flightTime: 0, drop: 0, heads: 0, liftPx: 0, lead: 0, leadPx: 0 };
        const flightTime = distance / velocity;
        const dropDistance = 0.5 * GRAV * flightTime * flightTime;
        const halfFov = Math.tan((+o.fov / Math.max(1, +o.zoom || 1)) / 2 * Math.PI / 180);
        const pixelsPerStud = Math.max(1, +o.screenH || 1080) * (Math.max(0.1, +o.calib || 1)) / (2 * halfFov * distance);
        const leadDistance = Math.max(0, +o.targetSpeed || 0) * flightTime;
        const direction = o.targetDirection === 'left' ? -1 : 1;
        return {
            available: true,
            flightTime,
            drop: dropDistance,
            heads: dropDistance / HEAD_H,
            liftPx: dropDistance * pixelsPerStud,
            lead: leadDistance,
            leadPx: leadDistance * pixelsPerStud * direction
        };
    }

    // ============================================================
    // DUEL EXPRESS
    // ============================================================
    const cells = s => { const m = /(\d+)\s*x\s*(\d+)/i.exec(String(s || '')); return m ? (+m[1]) * (+m[2]) : (Array.isArray(s) ? s[0] * s[1] : 0); };
    const pct = (a, b) => b ? Math.round((a - b) / Math.abs(b) * 100) : 0;
    const sizeLine = (a, b) => { const ca = cells(a.size), cb = cells(b.size); if (!ca || !cb) return null; return ca === cb ? 'même encombrement' : ca < cb ? `${cb - ca} case${cb - ca > 1 ? 's' : ''} de moins dans le sac` : `${ca - cb} case${ca - cb > 1 ? 's' : ''} de plus dans le sac`; };
    function duelWeapons(a, b) {
        const D = [[30, 'de près (30 studs)', .35], [100, 'à moyenne portée (100 studs)', .4], [250, 'de loin (250 studs)', .25]];
        const rows = D.map(([d, lbl, wt]) => ({ d, lbl, wt, A: ttk(a, d), B: ttk(b, d) }));
        const avg = k => rows.reduce((s, r) => s + Math.min(5, r[k].t) * r.wt, 0);
        const sa = avg('A'), sb = avg('B');
        let win = sa <= sb ? a : b, lose = win === a ? b : a;
        const W = win === a ? 'A' : 'B', L = W === 'A' ? 'B' : 'A';
        const gap = Math.abs(sa - sb) / Math.max(sa, sb, 1e-6);
        const reasons = [];
        // la portée où l'écart est le plus net
        const r = rows.slice().sort((x, y) => (y[L].t - y[W].t) / Math.max(y[L].t, .01) - (x[L].t - x[W].t) / Math.max(x[L].t, .01))[0];
        if (r && r[L].t > r[W].t) reasons.push(`TTK corps −${Math.round((1 - r[W].t / r[L].t) * 100)} % ${r.lbl} : ${sec(r[W].t)} contre ${sec(r[L].t)}`);
        if (win.fdr - lose.fdr >= 20) reasons.push(`pleins dégâts jusqu'à ${win.fdr} studs (+${win.fdr - lose.fdr})`);
        if ((win.cap | 0) > (lose.cap | 0)) reasons.push(`chargeur ${win.cap} coups contre ${lose.cap}`);
        if ((win.rec | 0) - (lose.rec | 0) >= 3) reasons.push(`recul mieux tenu (+${win.rec - lose.rec} pts)`);
        if ((win.acc | 0) - (lose.acc | 0) >= 2) reasons.push(`+${win.acc - lose.acc} % précision en visée`);
        const sz = sizeLine(win, lose); if (sz) reasons.push(sz);
        // croisement : l'un meilleur de près, l'autre de loin
        const near = rows[0], far = rows[2];
        const nearW = near.A.t <= near.B.t ? a : b, farW = far.A.t <= far.B.t ? a : b;
        let headline = `Prends ${art(win)}`;
        let note = '';
        if (gap < 0.06 && nearW !== farW) {
            headline = `Prends ${art(nearW)} de près, ${art(farW)} de loin`;
            note = 'Les deux se valent : choisis selon la zone (ville = près, plaine = loin).';
        } else if (gap < 0.04) {
            const ammoTip = a.cal !== b.cal ? ` Munitions : ${a.cal} / ${b.cal} — prends celle dont tu as déjà les balles.` : '';
            headline = `Égalité : prends ${art(win)}`; note = 'Écart de TTK sous 4 %.' + ammoTip;
        } else if (nearW !== farW) note = `${lose.name} reste meilleur ${lose === nearW ? near.lbl : far.lbl}.`;
        if (!note && a.cal !== b.cal) note = `Munitions : ${win.name} en ${win.cal}.`;
        return { kind: 'weapon', winner: win.id, headline, reasons: reasons.slice(0, 3), note,
            table: rows.map(x => [x.lbl.replace(/ \(.*\)/, '') + ` (${x.d})`, sec(x.A.t), sec(x.B.t), x.A.t <= x.B.t ? 'A' : 'B']), cols: ['TTK corps', a.name, b.name] };
    }
    const art = o => o.name;  // « Prends le FAL » sonne faux pour certains objets : on garde le nom seul
    function attScore(x) { return (x.aimSpeed || 0) * 1 + (x.recoilCtrl || 0) * 1.2 + (x.hipfire || 0) * .6 + (x.aimAcc || 0) * 1.5 + (x.silent ? 1.5 : 0) + (x.zoomN > 1 ? Math.log2(x.zoomN) * 1.1 : 0); }
    function duelAtt(a, b) {
        if (a.slot !== b.slot) return { kind: 'mix', winner: null, headline: 'Garde les deux', reasons: [`${a.name} va sur l'emplacement ${a.slot}, ${b.name} sur ${b.slot}`, 'ils ne se remplacent pas : tu peux monter les deux'], note: '' };
        const sa = attScore(a), sb = attScore(b), win = sa >= sb ? a : b, lose = win === a ? b : a;
        const R = [];
        const d = k => (win[k] || 0) - (lose[k] || 0);
        const sg = v => (v > 0 ? '+' : '−') + Math.abs(v);
        const C = [];   // contreparties (affichées à part, jamais comme un « + »)
        const add = (v, txt) => { if (v) (v > 0 ? R : C).push(txt); };
        // Mêmes conversions que le comparateur du site (effWeapon) : précision +1 pt, recul/jugé +4 pts par niveau
        add(d('aimAcc'), `${sg(d('aimAcc'))} pt de précision en visée`);
        add(d('recoilCtrl'), `${sg(d('recoilCtrl') * 4)} pts de contrôle du recul`);
        add(d('aimSpeed'), `vitesse de visée ${sg(d('aimSpeed'))} niveau${Math.abs(d('aimSpeed')) > 1 ? 'x' : ''}`);
        add(d('hipfire'), `${sg(d('hipfire') * 4)} pts de précision au jugé`);
        if (win.zoomN !== lose.zoomN && (win.zoomN > 1 || lose.zoomN > 1)) R.push(`grossissement ${win.zoom} contre ${lose.zoom}`);
        if (win.silent && !lose.silent) R.push('silencieux : pas de traceur, n\'attire pas les infectés');
        else if (!win.silent && lose.silent) C.push('pas silencieux');
        R.push('même encombrement (monté sur l\'arme)');
        let headline = Math.abs(sa - sb) < .3 ? `Égalité : prends ${win.name}` : `Prends ${win.name}`;
        let note = C.length ? `En contrepartie : ${C.join(', ')}.` : '';
        if (a.slot === 'Optique' && a.zoomN !== b.zoomN) {
            const lo = a.zoomN < b.zoomN ? a : b, hi = lo === a ? b : a;
            note = (note ? note + ' ' : '') + `${lo.name} (${lo.zoom}) reste meilleur en ville / CQB, ${hi.name} (${hi.zoom}) au-delà de 150 studs.`;
        }
        return { kind: 'attachment', winner: win.id, headline, reasons: R.slice(0, 3), note };
    }
    function duelHeal(a, b) {
        const v = x => (x.heal || 0) + (x.temp || 0) * .6, spd = x => x.use ? v(x) / x.use : v(x);
        const sa = v(a) * (a.slows ? .9 : 1) + spd(a) * 2, sb = v(b) * (b.slows ? .9 : 1) + spd(b) * 2;
        const win = sa >= sb ? a : b, lose = win === a ? b : a, R = [];
        if ((win.heal || 0) !== (lose.heal || 0)) R.push(`${win.heal > lose.heal ? '+' : ''}${(win.heal || 0) - (lose.heal || 0)} PV soignés (${win.heal || 0} contre ${lose.heal || 0})`);
        if ((win.temp || 0) > (lose.temp || 0)) R.push(`+${win.temp} PV temporaires`);
        if (win.use !== lose.use && win.use && lose.use) R.push(`${win.use < lose.use ? fr(lose.use - win.use, 1) + ' s plus rapide' : fr(win.use - lose.use, 1) + ' s plus lent'} (${fr(win.use, 1)} s)`);
        if (!win.slows && lose.slows) R.push('ne te ralentit pas pendant le soin');
        const sz = sizeLine(win, lose); if (sz) R.push(sz);
        return { kind: 'heal', winner: win.id, headline: `Prends ${win.name}`, reasons: R.slice(0, 3), note: win.effect || '' };
    }
    function duelFood(a, b) {
        const v = x => Math.max(0, x.energy || 0) + Math.max(0, x.hydration || 0) + Math.min(0, x.energy || 0) * 1.2 + Math.min(0, x.hydration || 0) * 1.2;
        const per = x => v(x) / Math.max(1, cells(x.size));
        const sa = v(a) * .6 + per(a) * 4, sb = v(b) * .6 + per(b) * 4;
        const win = sa >= sb ? a : b, lose = win === a ? b : a, R = [];
        R.push(`énergie ${win.energy >= 0 ? '+' : ''}${win.energy || 0} / hydratation ${win.hydration >= 0 ? '+' : ''}${win.hydration || 0}`);
        R.push(`${fr(per(win), 0)} pts par case contre ${fr(per(lose), 0)}`);
        const sz = sizeLine(win, lose); if (sz) R.push(sz);
        return { kind: 'food', winner: win.id, headline: `Prends ${win.name}`, reasons: R, note: '' };
    }
    function duelBag(a, b) {
        const win = (a.slots || 0) >= (b.slots || 0) ? a : b, lose = win === a ? b : a;
        const R = [`${win.slots} cases contre ${lose.slots} (+${pct(win.slots, lose.slots)} %)`];
        if (win.grid && lose.grid) R.push(`grille ${win.grid.join('x')} contre ${lose.grid.join('x')}`);
        return { kind: 'backpack', winner: win.id, headline: win.slots === lose.slots ? `Égalité : prends ${win.name}` : `Prends ${win.name}`, reasons: R, note: '' };
    }
    function duelMag(a, b) {
        const per = x => x.cap / Math.max(1, x.w * x.h);
        const win = a.cap === b.cap ? (per(a) >= per(b) ? a : b) : (a.cap > b.cap ? a : b), lose = win === a ? b : a;
        const R = [];
        if (win.cap !== lose.cap) R.push(`+${win.cap - lose.cap} balles (${win.cap} contre ${lose.cap})`);
        const ca = win.w * win.h, cb = lose.w * lose.h;
        R.push(ca === cb ? 'même encombrement' : ca > cb ? `${ca - cb} case de plus` : `${cb - ca} case de moins`);
        const common = (win.ws || []).filter(x => (lose.ws || []).includes(x));
        if (!common.length && win.ws && lose.ws) R.push('attention : pas les mêmes armes compatibles');
        return { kind: 'mag', winner: win.id, headline: `Prends ${win.name}`, reasons: R, note: '' };
    }
    function duel(index, qa, qb) {
        prep(index);
        const pick = q => typeof q === 'object' && q ? q : best(index, q, o => o.type !== 'loc');
        const a = pick(qa), b = pick(qb ? qb : '');
        if (!a || !b) return { error: !a ? `Objet introuvable : « ${qa} »` : `Objet introuvable : « ${qb} »`, a, b };
        if (a.id === b.id) return { a, b, kind: 'same', winner: a.id, headline: 'C\'est le même objet', reasons: ['tape deux objets différents'], note: '' };
        let r;
        if (a.type !== b.type) r = { kind: 'mix', winner: null, headline: 'Pas comparables', reasons: [`${a.name} est ${(TYPE_LABEL[a.type] || '').toLowerCase()}, ${b.name} est ${(TYPE_LABEL[b.type] || '').toLowerCase()}`, 'prends les deux si tu as la place'], note: '' };
        else if (a.type === 'weapon') r = duelWeapons(a, b);
        else if (a.type === 'attachment') r = duelAtt(a, b);
        else if (a.type === 'heal') r = duelHeal(a, b);
        else if (a.type === 'food') r = duelFood(a, b);
        else if (a.type === 'backpack') r = duelBag(a, b);
        else if (a.type === 'mag') r = duelMag(a, b);
        else if (a.type === 'cosmetic') r = { kind: 'mix', winner: null, headline: 'Pas comparables', reasons: ['Les cosmétiques changent uniquement ton apparence et ne donnent aucun bonus.'], note: '' };
        else r = { kind: 'mix', winner: null, headline: 'Pas comparables', reasons: [], note: '' };
        // les inconvénients du gagnant ne s'affichent jamais comme un « + »
        const cons = (r.reasons || []).filter(x => /de plus dans le sac|plus lent|case de plus/.test(x));
        if (cons.length) { r.reasons = r.reasons.filter(x => !cons.includes(x)); r.note = [`En contrepartie : ${cons.join(', ')}.`, r.note].filter(Boolean).join(' '); }
        return Object.assign({ a, b }, r);
    }

    // ============================================================
    // CAP DE NAVIGATION (boussole)
    // ============================================================
    const CARD8 = ['N', 'N-E', 'E', 'S-E', 'S', 'S-O', 'O', 'N-O'];
    const CARD16 = ['N', 'N-N-E', 'N-E', 'E-N-E', 'E', 'E-S-E', 'S-E', 'S-S-E', 'S', 'S-S-O', 'S-O', 'O-S-O', 'O', 'O-N-O', 'N-O', 'N-N-O'];
    const SPEEDS = { walk: 16, sprint: 24, vehicle: 60 };
    function bearing(a, b) { return (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180 / Math.PI + 360) % 360; }
    const card8 = deg => CARD8[Math.round(deg / 45) % 8];
    function leg(index, a, b, speeds) {
        const sp = Object.assign({}, SPEEDS, (index && index.speeds) || {}, speeds || {});
        const scale = (index && index.scale && index.scale[b.world || 'halsey']) || 15.18;
        const units = Math.hypot(b.x - a.x, b.y - a.y), studs = units * scale;
        const deg = bearing(a, b);
        return { from: a, to: b, deg, card: card8(deg), card16: CARD16[Math.round(deg / 22.5) % 16], studs, meters: studs * STUD_M,
            walk: studs / sp.walk, sprint: studs / sp.sprint, vehicle: studs / sp.vehicle };
    }
    function route(index, points, speeds) {
        const legs = [];
        for (let i = 1; i < points.length; i++) legs.push(leg(index, points[i - 1], points[i], speeds));
        const tot = legs.reduce((s, l) => s + l.studs, 0);
        return { legs, studs: tot, meters: tot * STUD_M, walk: legs.reduce((s, l) => s + l.walk, 0), sprint: legs.reduce((s, l) => s + l.sprint, 0), vehicle: legs.reduce((s, l) => s + l.vehicle, 0) };
    }
    const fmtDist = st => st >= 1000 ? `${fr(st / 1000, 1)} k studs` : `${fr(st)} studs`;

    // ============================================================
    // TÉLÉMÈTRE (stadiamètre)
    // ============================================================
    // Hauteur (en pixels) d'un personnage Roblox debout (≈ 5,2 studs) vu à d studs,
    // avec le champ de vision vertical fov (70° par défaut sur Roblox) divisé par le zoom de la lunette.
    function charPx(d, zoom, screenH, fov = 70, calib = 1, bodyH = BODY_H) {
        const half = Math.tan((fov / Math.max(1, zoom)) / 2 * Math.PI / 180);
        return screenH * (bodyH / Math.max(1, d)) / (2 * half) * calib;
    }
    function distFromPx(px, zoom, screenH, fov = 70, calib = 1, bodyH = BODY_H) {
        const half = Math.tan((fov / Math.max(1, zoom)) / 2 * Math.PI / 180);
        return screenH * bodyH / (2 * half * Math.max(1, px)) * calib;
    }
    function ladder(w, zoom, screenH, o) {
        o = Object.assign({ fov: 70, calib: 1, maxPx: 360, minPx: 8, gap: 13, dists: [25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 1000] }, o || {});
        const out = []; let lastPx = Infinity;
        for (const d of o.dists) {
            const px = charPx(d, zoom, screenH, o.fov, o.calib);
            if (px > o.maxPx) continue;
            if (px < o.minPx) break;
            if (lastPx - px < o.gap) continue;
            lastPx = px;
            const f = w ? falloff(w, d) : 1;
            const correction = w ? aimCorrection(w, d, { zoom, screenH, fov: o.fov, calib: o.calib, targetSpeed: o.targetSpeed, targetDirection: o.targetDirection }) : null;
            out.push({ d, px, f, head: w ? Math.round(w.hd * f) : null, body: w ? Math.round(w.bod * f) : null,
                correctionAvailable: !!(correction && correction.available), heads: correction ? correction.heads : 0, holdPx: correction ? correction.liftPx : 0, lead: correction ? correction.lead : 0,
                leadPx: correction ? correction.leadPx : 0, flightTime: correction ? correction.flightTime : 0,
                zone: !w ? 'full' : d <= w.fdr ? 'full' : d >= w.mdr ? 'min' : 'drop' });
        }
        return out;
    }
    function scopesFor(index, w) {
        const out = [];
        if (!w) return [{ id: 'iron', name: 'Sans lunette', z: 1 }];
        if (w.builtin) out.push({ id: 'builtin', name: `Lunette intégrée ${w.builtin}x`, z: w.builtin });
        if (w.optic) (index.items || []).filter(i => i.type === 'attachment' && i.slot === 'Optique').forEach(a => out.push({ id: a.id, name: `${a.name} (${a.zoom})`, z: a.zoomN || 1 }));
        out.push({ id: 'iron', name: 'Visée mécanique (1x)', z: 1 });
        return out;
    }

    const API = { THEMES, THEME_ORDER, themeVars, applyTheme, hexRgb, norm, esc, fr, sec, TYPE_LABEL, prep, search, best, get, parseCommand,
        STUD_M, BODY_H, HEAD_H, falloff, ttk, drop, aimCorrection, duel, bearing, card8, leg, route, fmtDist, SPEEDS, charPx, distFromPx, ladder, scopesFor };
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
    if (root) root.AR2Tools = API;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
