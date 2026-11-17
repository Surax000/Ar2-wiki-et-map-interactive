/* AR2 Quick – panneau de recherche instantanée (Wiki en overlay)
 * Partagé par la fenêtre « Wiki instantané » de l'appli (Ctrl+Alt+W) et la palette Ctrl+K du site.
 * AR2Quick.mount(el, { index, host:'app'|'site', actions:{...}, getOrigin, setOrigin })
 * Commandes :  « M4A1 » (stats + spawns)  •  « Holo vs OCR » (Duel Express)  •  « Ashland > Regional Airport » (cap)
 */
(function (root) {
    'use strict';
    const T = root.AR2Tools;
    const esc = T.esc, fr = T.fr;
    const ICON = { weapon: 'ARM', attachment: 'ACC', heal: 'SOIN', food: 'FOOD', backpack: 'SAC', mag: 'CHG', loc: 'LIEU', boss: 'BOSS' };
    // Images des objets (wiki Apocalypse Rising, Fandom) : dossier fixé par le site ou fourni par l'index
    let IMG_BASE = root.AR2_IMG_BASE || null, IMG_FIXED = !!root.AR2_IMG_BASE;
    function setImgBase(b) { IMG_BASE = b || null; IMG_FIXED = !!b; }
    const pic = (o, cls) => o && o.img && IMG_BASE && /^[a-z0-9._-]+$/i.test(o.img) ? `<img class="${cls || 'aq-pic'}" src="${esc(IMG_BASE + o.img)}.webp" alt="" loading="lazy" decoding="async" draggable="false">` : '';
    const CAT_COLOR = { weapon: 'var(--aq-acc)', attachment: '#22d3ee', heal: '#fb7185', food: '#fb923c', backpack: '#fbbf24', mag: '#e5c07b', loc: '#a78bfa', boss: '#f87171' };

    const CSS = `
.aq{--aq-acc:rgb(var(--t-acc,0 255 136));--aq-bg:rgb(var(--t-bg,15 17 21));--aq-card:rgb(var(--t-card,22 25 32));--aq-bd:rgb(var(--t-border,42 47 58));--aq-mut:rgb(var(--t-muted,139 148 158));--aq-tx:rgb(var(--t-text,255 255 255));--aq-ink:rgb(var(--t-ink,11 15 20));--aq-gold:rgb(var(--t-gold,229 192 123));--aq-red:rgb(var(--t-red,255 71 87));
  font:13px/1.4 "Segoe UI",Inter,system-ui,sans-serif;color:var(--aq-tx);background:rgb(var(--t-bg,15 17 21) / var(--aq-alpha,.86));border:1px solid rgb(var(--t-acc,0 255 136) / .45);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.4);overflow:hidden;display:flex;flex-direction:column;height:100%;box-sizing:border-box}
.aq *{box-sizing:border-box}
.aq-top{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--aq-bd)}
.aq-top svg{flex:none;color:var(--aq-acc)}
.aq-in{flex:1;min-width:0;background:transparent;border:0;outline:0;color:var(--aq-tx);font:600 20px/1.2 "Segoe UI",Inter,system-ui,sans-serif}
.aq-in::placeholder{color:var(--aq-mut);font-weight:500}
.aq-mode{flex:none;font:800 10px/1 ui-monospace,Consolas,monospace;letter-spacing:.1em;text-transform:uppercase;padding:5px 8px;border-radius:999px;border:1px solid var(--aq-bd);color:var(--aq-mut)}
.aq-mode.on{background:var(--aq-acc);border-color:var(--aq-acc);color:var(--aq-ink)}
.aq-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(200px,40%) 1fr}
.aq-body.full{grid-template-columns:1fr}
.aq-list{overflow-y:auto;border-right:1px solid var(--aq-bd);padding:6px}
.aq-it{display:flex;align-items:center;gap:8px;width:100%;padding:7px 9px;border-radius:10px;border:1px solid transparent;background:none;color:var(--aq-tx);text-align:left;cursor:pointer;font:600 13px/1.25 "Segoe UI",Inter,system-ui,sans-serif}
.aq-it:hover{background:rgb(var(--t-card,22 25 32) / .9)}
.aq-it.sel{background:rgb(var(--t-acc,0 255 136) / .12);border-color:rgb(var(--t-acc,0 255 136) / .6)}
.aq-ic{flex:none;width:46px;text-align:center;font:800 9px/1 ui-monospace,Consolas,monospace;letter-spacing:.06em;padding:4px 0;border-radius:6px;border:1px solid currentColor;opacity:.9}
.aq-it b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.aq-it small{flex:none;color:var(--aq-mut);font:600 10px ui-monospace,Consolas,monospace;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.aq-det{overflow-y:auto;padding:12px 14px}
.aq-h{font:800 20px/1.15 "Segoe UI",Inter,system-ui,sans-serif;margin:0 0 2px}
.aq-sub{color:var(--aq-mut);font:600 11px ui-monospace,Consolas,monospace;margin-bottom:10px}
.aq-g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
.aq-s{background:rgb(var(--t-card,22 25 32) / .85);border:1px solid var(--aq-bd);border-radius:9px;padding:5px 8px;min-width:0}
.aq-s i{display:block;font:700 9px ui-monospace,Consolas,monospace;font-style:normal;text-transform:uppercase;letter-spacing:.08em;color:var(--aq-mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aq-s b{display:block;font:800 15px/1.2 ui-monospace,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aq-s b.a{color:var(--aq-acc)}
.aq-sec{font:800 10px ui-monospace,Consolas,monospace;text-transform:uppercase;letter-spacing:.12em;color:var(--aq-mut);margin:8px 0 5px}
.aq-sp{display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0}
.aq-sp span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.aq-sp em{font-style:normal;color:var(--aq-mut);font:600 10px ui-monospace,Consolas,monospace}
.aq-bar{flex:none;width:60px;height:5px;border-radius:3px;background:var(--aq-bd);overflow:hidden}
.aq-bar i{display:block;height:100%;background:var(--aq-acc)}
.aq-p{color:rgb(var(--t-text,255 255 255) / .78);font-size:12px;margin:6px 0}
.aq-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.aq-btn{font:800 11px/1 "Segoe UI",Inter,system-ui,sans-serif;letter-spacing:.04em;padding:8px 10px;border-radius:9px;border:1px solid var(--aq-bd);background:var(--aq-card);color:var(--aq-tx);cursor:pointer}
.aq-btn:hover{border-color:var(--aq-acc);color:var(--aq-acc)}
.aq-btn.pri{background:var(--aq-acc);border-color:var(--aq-acc);color:var(--aq-ink)}
.aq-btn.pri:hover{filter:brightness(1.1);color:var(--aq-ink)}
.aq-btn kbd{font:700 9px ui-monospace,Consolas,monospace;opacity:.7;margin-left:6px}
.aq-foot{display:flex;flex-wrap:wrap;gap:4px 12px;padding:7px 14px;border-top:1px solid var(--aq-bd);color:var(--aq-mut);font:600 10px ui-monospace,Consolas,monospace}
.aq-foot b{color:var(--aq-tx)}
@media (max-width:560px){.aq-body{grid-template-columns:1fr;grid-template-rows:auto 1fr}.aq-list{max-height:150px;border-right:0;border-bottom:1px solid var(--aq-bd)}.aq-big{font-size:24px}.aq-g{grid-template-columns:repeat(2,1fr)}}
.aq-empty{padding:16px 18px;color:var(--aq-mut);font-size:12px}
.aq-ex{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.aq-ex button{font:700 11px "Segoe UI",Inter,system-ui,sans-serif;padding:6px 9px;border-radius:999px;border:1px solid var(--aq-bd);background:none;color:var(--aq-tx);cursor:pointer}
.aq-ex button:hover{border-color:var(--aq-acc);color:var(--aq-acc)}
.aq-verd{padding:16px 18px;overflow-y:auto}
.aq-th{flex:none;width:46px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:rgb(var(--t-card,22 25 32) / .9);border:1px solid var(--aq-bd);overflow:hidden}
.aq-th img{max-width:100%;max-height:100%;object-fit:contain}
.aq-hero{display:flex;align-items:center;justify-content:center;height:96px;margin:0 0 10px;border-radius:12px;border:1px solid var(--aq-bd);background:radial-gradient(ellipse at center,rgb(var(--t-acc,0 255 136) / .12),rgb(var(--t-card,22 25 32) / .9) 70%);overflow:hidden}
.aq-hero img{max-width:92%;max-height:84px;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
.aq-vs .aq-th{width:40px;height:22px;margin-right:6px;vertical-align:middle;display:inline-flex}
.aq-vs span{display:inline-flex;align-items:center}
.aq-vs{display:flex;align-items:center;gap:10px;font:700 12px ui-monospace,Consolas,monospace;color:var(--aq-mut);margin-bottom:10px}
.aq-vs span{padding:4px 8px;border-radius:7px;border:1px solid var(--aq-bd);color:var(--aq-tx)}
.aq-vs span.w{border-color:var(--aq-acc);color:var(--aq-acc);background:rgb(var(--t-acc,0 255 136) / .1)}
.aq-big{font:900 30px/1.08 "Segoe UI",Inter,system-ui,sans-serif;letter-spacing:-.01em;color:var(--aq-acc);margin:4px 0 10px;text-wrap:balance}
.aq-big.mix{color:var(--aq-gold)}
.aq-rs{margin:0;padding:0;list-style:none}
.aq-rs li{display:flex;gap:8px;align-items:baseline;font-size:15px;font-weight:600;margin:5px 0}
.aq-rs li:before{content:'+';flex:none;font:900 14px ui-monospace,Consolas,monospace;color:var(--aq-acc)}
.aq-note{margin-top:10px;font-size:12px;color:var(--aq-mut)}
.aq-tb{width:100%;border-collapse:collapse;margin-top:12px;font:600 11px ui-monospace,Consolas,monospace}
.aq-tb td,.aq-tb th{padding:4px 6px;border-bottom:1px solid var(--aq-bd);text-align:left}
.aq-tb th{color:var(--aq-mut);font-weight:700}
.aq-tb td.w{color:var(--aq-acc)}
.aq-cmp{display:flex;align-items:center;gap:14px;margin:6px 0 12px}
.aq-dial{flex:none;width:92px;height:92px}
.aq-cap{font:900 34px/1 ui-monospace,Consolas,monospace;color:var(--aq-acc)}
.aq-cap small{font-size:16px;color:var(--aq-tx);margin-left:6px}
`;
    function svg(p, s = 18) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`; }
    const I_SEARCH = svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', 20);

    function dial(deg) {
        const r = 40, c = 46, a = (deg - 90) * Math.PI / 180;
        const tx = c + Math.cos(a) * (r - 6), ty = c + Math.sin(a) * (r - 6);
        const ticks = Array.from({ length: 16 }, (_, i) => { const b = (i * 22.5 - 90) * Math.PI / 180, l = i % 4 ? 4 : 8; return `<line x1="${c + Math.cos(b) * r}" y1="${c + Math.sin(b) * r}" x2="${c + Math.cos(b) * (r - l)}" y2="${c + Math.sin(b) * (r - l)}" stroke="rgb(var(--t-muted,139 148 158))" stroke-opacity=".8" stroke-width="1.5"/>`; }).join('');
        return `<svg class="aq-dial" width="92" height="92" viewBox="0 0 92 92" style="flex:none"><circle cx="${c}" cy="${c}" r="${r}" fill="rgb(var(--t-card,22 25 32))" stroke="rgb(var(--t-border,42 47 58))" stroke-width="2"/>${ticks}
            <text x="${c}" y="17" text-anchor="middle" font-size="10" font-weight="900" fill="rgb(var(--t-red,255 71 87))" font-family="ui-monospace,Consolas,monospace">N</text>
            <line x1="${c}" y1="${c}" x2="${tx}" y2="${ty}" stroke="rgb(var(--t-acc,0 255 136))" stroke-width="4" stroke-linecap="round"/><circle cx="${c}" cy="${c}" r="4" fill="rgb(var(--t-acc,0 255 136))"/></svg>`;
    }

    function stat(k, v, a) { return `<div class="aq-s"><i>${esc(k)}</i><b class="${a ? 'a' : ''}">${v}</b></div>`; }
    function spawns(o) {
        if (!o.spawn || !o.spawn.length) return o.loot ? `<div class="aq-sec">Où le trouver</div><p class="aq-p">${esc(o.loot)}</p>` : '';
        const mx = Math.max(...o.spawn.map(s => s.p), 1);
        return `<div class="aq-sec">Meilleurs spawns</div>${o.spawn.map(s => `<div class="aq-sp"><span>${esc(s.n)}</span><em>${esc(s.i || '')}</em><div class="aq-bar"><i style="width:${Math.round(s.p / mx * 100)}%"></i></div><em>${fr(s.p)} %</em></div>`).join('')}${o.loot ? `<p class="aq-p" style="margin-top:8px">${esc(o.loot)}</p>` : ''}`;
    }
    function detail(o, index) {
        if (!o) return '';
        const sub = (...a) => `<div class="aq-sub">${a.filter(Boolean).map(esc).join(' • ')}</div>`;
        const im = pic(o, 'aq-pi');
        let h = (im ? `<div class="aq-hero">${im}</div>` : '') + `<div class="aq-h">${esc(o.name)}</div>`;
        if (o.type === 'weapon') {
            const t50 = T.ttk(o, 50), t150 = T.ttk(o, 150);
            h += sub(o.cat, o.cal, o.tier ? 'Tier ' + o.tier : '', o.rarity) + `<div class="aq-g">
                ${stat('Tête', o.hd, 1)}${stat('Corps', o.bod)}${stat('Membres', o.lim)}
                ${stat('Cadence', o.rof >= 5000 ? '—' : o.rof + ' rpm')}${stat('Chargeur', o.cap)}${stat('Recharge', o.rel ? fr(o.rel, 1) + ' s' : '—')}
                ${stat('TTK 50 st', T.sec(t50.t), 1)}${stat('TTK 150 st', T.sec(t150.t))}${stat('Dégâts 150', Math.round(t150.f * 100) + ' %')}
                ${stat('Pleins ≤', o.fdr + ' st')}${stat('Mini ≥', o.mdr + ' st')}${stat('Précision', o.acc + ' %')}</div>` + spawns(o);
        } else if (o.type === 'attachment') {
            const m = [['Vitesse visée', o.aimSpeed], ['Recul', o.recoilCtrl], ['Jugé', o.hipfire], ['Précision', o.aimAcc]].map(([k, v]) => stat(k, v ? (v > 0 ? '+' : '') + v : '0', v > 0));
            h += sub(o.slot, o.zoom && o.zoom !== '—' ? o.zoom : '', o.rarity, o.silent ? 'silencieux' : '') + `<div class="aq-g">${stat('Zoom', o.zoom || '—', 1)}${m.join('')}${stat('Discret', o.silent ? 'oui' : 'non')}</div><p class="aq-p">${esc(o.desc || '')}</p>` + spawns(o);
        } else if (o.type === 'heal') {
            h += sub(o.cat, o.rarity, o.size) + `<div class="aq-g">${stat('Soin', '+' + (o.heal || 0) + ' PV', 1)}${stat('Temporaire', o.temp ? '+' + o.temp : '—')}${stat('Durée', o.use ? fr(o.use, 1) + ' s' : 'instant')}${stat('Ralentit', o.slows ? 'oui' : 'non')}${stat('Taille', o.size || '—')}${stat('Effet', o.effect || '—')}</div>` + spawns(o);
        } else if (o.type === 'food') {
            h += sub(o.cat, o.rarity, o.size) + `<div class="aq-g">${stat('Énergie', (o.energy > 0 ? '+' : '') + (o.energy || 0), o.energy > 0)}${stat('Hydratation', (o.hydration > 0 ? '+' : '') + (o.hydration || 0), o.hydration > 0)}${stat('Taille', o.size || '—')}</div><p class="aq-p">${esc(o.desc || '')}</p>` + spawns(o);
        } else if (o.type === 'backpack') {
            h += sub(o.cat, o.rarity) + `<div class="aq-g">${stat('Cases', o.slots, 1)}${stat('Grille', o.grid ? o.grid.join('x') : '—')}${stat('Rareté', o.rarity || '—')}</div><p class="aq-p">${esc(o.desc || '')}</p>` + spawns(o);
        } else if (o.type === 'mag') {
            const ws = (o.ws || []).map(id => (T.get(index, id) || {}).name).filter(Boolean);
            h += sub('Chargeur', o.w + 'x' + o.h) + `<div class="aq-g">${stat('Capacité', o.cap, 1)}${stat('Taille', o.w + 'x' + o.h)}${stat('Armes', ws.length)}</div>${ws.length ? `<p class="aq-p">Pour : ${esc(ws.join(', '))}</p>` : ''}`;
        } else if (o.type === 'boss') {
            h += sub(o.kind, o.fr) + `<div class="aq-g">${stat('PV', o.hp || '?', 1)}${stat('Dégâts', o.dmg || '?')}${stat('Vitesse', o.speed || '—')}</div>${o.spawnTxt ? `<div class="aq-sec">Où le trouver</div><p class="aq-p">${esc(o.spawnTxt)}</p>` : ''}`;
        } else if (o.type === 'loc') {
            h += sub(o.catLabel, o.island ? 'Île ' + o.island : '', o.grid ? 'Case ' + o.grid : '', o.world === 'kf' ? 'Kin Flats' : '') + `<p class="aq-p">${esc(o.desc || '')}</p>`;
            if (o.loot && o.loot.length) h += `<div class="aq-sec">Loot</div><p class="aq-p">${esc(o.loot.join(' • '))}</p>`;
        }
        return h;
    }

    function duelHTML(d) {
        const wa = d.winner === d.a.id, wb = d.winner === d.b.id;
        return `<div class="aq-vs"><span class="${wa ? 'w' : ''}">${pic(d.a) ? `<i class="aq-th">${pic(d.a)}</i>` : ''}A · ${esc(d.a.name)}</span>VS<span class="${wb ? 'w' : ''}">${pic(d.b) ? `<i class="aq-th">${pic(d.b)}</i>` : ''}B · ${esc(d.b.name)}</span></div>
                <div class="aq-big ${d.winner ? '' : 'mix'}">${esc(d.headline)}</div>
                <ul class="aq-rs">${d.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>${d.note ? `<div class="aq-note">${esc(d.note)}</div>` : ''}
                ${d.table ? `<table class="aq-tb"><tr>${d.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${d.table.map(r => `<tr><td>${esc(r[0])}</td><td class="${r[3] === 'A' ? 'w' : ''}">${esc(r[1])}</td><td class="${r[3] === 'B' ? 'w' : ''}">${esc(r[2])}</td></tr>`).join('')}</table>` : ''}`;
    }
    function ensureCSS() { if (!document.getElementById('aq-css')) { const st = document.createElement('style'); st.id = 'aq-css'; st.textContent = CSS; document.head.appendChild(st); } }

    function mount(el, opt) {
        opt = Object.assign({ host: 'site', actions: {}, getOrigin: () => null, setOrigin: () => {} }, opt || {});
        ensureCSS();
        el.innerHTML = `<div class="aq"><div class="aq-top">${I_SEARCH}<input class="aq-in" spellcheck="false" autocomplete="off" placeholder="Arme, objet, lieu…  (ex : M4A1, Ashland, Holo vs OCR)"><span class="aq-mode">Wiki</span></div>
            <div class="aq-body"></div><div class="aq-foot"></div></div>`;
        const root_ = el.firstElementChild, input = root_.querySelector('.aq-in'), body = root_.querySelector('.aq-body'), foot = root_.querySelector('.aq-foot'), mode = root_.querySelector('.aq-mode');
        const useIx = ix => { if (ix && ix.imgBase && !IMG_FIXED) IMG_BASE = ix.imgBase; };
        useIx(opt.index);
        // image manquante (hors-ligne, 404) : on la masque sans casser la mise en page (CSP : pas de onerror inline)
        root_.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG') { const w = t.closest('.aq-th,.aq-hero'); if (w && w.classList.contains('aq-hero')) w.remove(); else t.style.visibility = 'hidden'; } }, true);
        let index = opt.index, results = [], sel = 0, cmd = { kind: 'search', q: '' }, lastDuel = null, lastRoute = null;
        const A = opt.actions;
        const app = opt.host === 'app';
        const keys = app
            ? '<span><b>↑↓</b> choisir</span><span><b>Entrée</b> action</span><span><b>Ctrl+Entrée</b> wiki complet</span><span><b>A vs B</b> duel</span><span><b>A &gt; B</b> cap</span><span><b>Échap</b> fermer</span>'
            : '<span><b>↑↓</b> choisir</span><span><b>Entrée</b> ouvrir</span><span><b>A vs B</b> Duel Express</span><span><b>A &gt; B</b> cap</span><span><b>Échap</b> fermer</span>';
        foot.innerHTML = keys;
        const EX = ['M4A1', 'Ashland', 'Holographic Sight vs OCR Sight', 'Small MedKit vs Military Field Dressing', 'AK-47 vs M4A1', 'Ashland > Regional Airport'];

        function actsFor(o) {
            const out = [];
            if (!o) return out;
            if (o.type === 'weapon' && A.equipRange) out.push(['range', 'Télémètre : équiper', 'Entrée']);
            if (o.type === 'loc' && A.compass) { out.push(['dest', 'Cap vers ce lieu', 'Entrée']); out.push(['origin', 'Je suis ici (départ)', 'Alt+Entrée']); }
            if (o.type !== 'loc' && o.type !== 'boss') out.push(['duel', 'Comparer avec…', 'Tab']);
            if (A.openWiki) out.push(['wiki', 'Ouvrir dans le wiki', app ? 'Ctrl+Entrée' : 'Entrée']);
            return out.sort((x, y) => (y[2] === 'Entrée') - (x[2] === 'Entrée'));
        }
        function runAct(id, o) {
            if (id === 'duel') { input.value = o.name + ' vs '; input.focus(); update(); return; }
            if (id === 'origin') { opt.setOrigin(o); msg(`Départ : ${o.name}. Tape une destination.`); input.value = ''; update(); return; }
            if (id === 'dest') {
                const from = opt.getOrigin();
                if (!from || from.id === o.id) { opt.setOrigin(o); msg(`Départ : ${o.name}. Tape maintenant la destination (ou « ${o.name} > … »).`); input.value = ''; update(); return; }
                return A.compass && A.compass([from, o]);
            }
            if (id === 'range') return A.equipRange && A.equipRange(o);
            if (id === 'wiki') return A.openWiki && A.openWiki(o);
            if (id === 'route' && lastRoute) { if (A.compass) return A.compass(lastRoute.pts); if (A.showRoute) return A.showRoute(lastRoute.pts); }
            if (id === 'routeMap' && lastRoute && A.showRoute) return A.showRoute(lastRoute.pts);
        }
        let msgT = 0;
        function msg(t) { foot.innerHTML = `<span style="color:var(--aq-acc)"><b style="color:inherit">${esc(t)}</b></span>`; clearTimeout(msgT); msgT = setTimeout(() => { foot.innerHTML = keys; }, 3500); }

        function renderEmpty() {
            const o = opt.getOrigin();
            body.className = 'aq-body full';
            body.innerHTML = `<div class="aq-empty">${index ? `Tape 2-3 lettres : stats clés, spawns, lieux. <b>A vs B</b> pour un verdict Duel Express, <b>A &gt; B</b> pour un cap de navigation.${o ? `<br>Départ actuel : <b style="color:var(--aq-acc)">${esc(o.name)}</b> — tape « cap Regional Airport ».` : ''}` : 'Chargement des données du wiki…'}
                <div class="aq-ex">${EX.map(x => `<button type="button" data-ex="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`;
        }
        function renderSearch() {
            body.className = 'aq-body';
            if (!results.length) { body.className = 'aq-body full'; body.innerHTML = `<div class="aq-empty">Aucun résultat pour « ${esc(input.value)} ».</div>`; return; }
            const o = results[sel];
            body.innerHTML = `<div class="aq-list">${results.map((r, i) => `<button type="button" class="aq-it ${i === sel ? 'sel' : ''}" data-i="${i}">${pic(r) ? `<span class="aq-th">${pic(r)}</span>` : `<span class="aq-ic" style="color:${CAT_COLOR[r.type] || 'var(--aq-mut)'}">${ICON[r.type] || '•'}</span>`}<b>${esc(r.name)}</b><small>${esc(r.type === 'loc' ? (r.island || r.catLabel || '') : r.type === 'weapon' ? (r.cal || '') : (r.slot || r.cat || ''))}</small></button>`).join('')}</div>
                <div class="aq-det">${detail(o, index)}<div class="aq-acts">${actsFor(o).map(([id, l, k], i) => `<button type="button" class="aq-btn ${i === 0 ? 'pri' : ''}" data-act="${id}">${esc(l)}<kbd>${k}</kbd></button>`).join('')}</div></div>`;
            const s = body.querySelector('.aq-it.sel'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
        }
        function renderDuel() {
            body.className = 'aq-body full';
            const d = lastDuel = T.duel(index, cmd.a, cmd.b);
            if (d.error) { body.innerHTML = `<div class="aq-empty">${esc(d.error)}</div>`; return; }
            body.innerHTML = `<div class="aq-verd">${duelHTML(d)}
                <div class="aq-acts">${A.openWiki ? `<button class="aq-btn" data-dw="a">Fiche ${esc(d.a.name)}</button><button class="aq-btn" data-dw="b">Fiche ${esc(d.b.name)}</button>` : ''}<button class="aq-btn" data-swap="1">Inverser</button></div></div>`;
        }
        function renderRoute() {
            body.className = 'aq-body full';
            const isLoc = o => o.type === 'loc';
            if (cmd.pts && cmd.pts.length > 2) return renderChain(isLoc);
            const a = cmd.a ? T.best(index, cmd.a, isLoc) : opt.getOrigin(), b = (a && T.best(index, cmd.b, o => isLoc(o) && (o.world || 'halsey') === (a.world || 'halsey'))) || T.best(index, cmd.b, isLoc);
            if (!a || !b) { body.innerHTML = `<div class="aq-empty">${!a ? (cmd.a ? `Lieu de départ introuvable : « ${esc(cmd.a)} »` : 'Choisis d\'abord un départ : « Ashland > Regional Airport »') : `Lieu introuvable : « ${esc(cmd.b)} »`}</div>`; lastRoute = null; return; }
            if ((a.world || 'halsey') !== (b.world || 'halsey')) { body.innerHTML = `<div class="aq-empty">${esc(a.name)} et ${esc(b.name)} ne sont pas sur la même carte.</div>`; lastRoute = null; return; }
            const l = T.leg(index, a, b);
            lastRoute = { pts: [a, b], leg: l };
            body.innerHTML = `<div class="aq-verd"><div class="aq-vs"><span>${esc(a.name)}</span>→<span class="w">${esc(b.name)}</span></div>
                <div class="aq-cmp">${dial(l.deg)}<div><div class="aq-cap">${Math.round(l.deg)}°<small>${l.card}</small></div><div class="aq-sub" style="margin:6px 0 0">${T.fmtDist(l.studs)} (${fr(l.meters)} m) à vol d'oiseau</div></div></div>
                <div class="aq-g">${stat('Marche', T.sec(l.walk))}${stat('Sprint', T.sec(l.sprint), 1)}${stat('Véhicule ≈', T.sec(l.vehicle))}</div>
                <div class="aq-note">Cap mesuré depuis le nord de la carte (0° = N, 90° = E). Aligne-toi avec ta boussole en jeu. Temps estimés (marche 16, sprint 24, véhicule ≈ 60 studs/s).</div>
                <div class="aq-acts">${A.compass ? '<button class="aq-btn pri" data-act="route">Afficher la boussole en jeu<kbd>Entrée</kbd></button>' : ''}${A.showRoute ? '<button class="aq-btn" data-act="routeMap">Voir sur la carte</button>' : ''}</div></div>`;
        }
        // itinéraire en plusieurs étapes (A > B > C) : toutes sur la même carte
        function renderChain(isLoc) {
            const first = T.best(index, cmd.pts[0], isLoc);
            const w = first ? (first.world || 'halsey') : null;
            const pts = cmd.pts.map((q, i) => i === 0 ? first : (T.best(index, q, o => isLoc(o) && (o.world || 'halsey') === w) || null));
            const miss = cmd.pts.find((q, i) => !pts[i]);
            if (miss) { body.innerHTML = `<div class="aq-empty">Lieu introuvable${w ? ' sur ' + (w === 'kf' ? 'Kin Flats' : "l'archipel") : ''} : « ${esc(miss)} »</div>`; lastRoute = null; return; }
            const r = T.route(index, pts);
            lastRoute = { pts, leg: r.legs[0] };
            body.innerHTML = `<div class="aq-verd"><div class="aq-vs" style="flex-wrap:wrap">${pts.map((p, i) => `<span${i === pts.length - 1 ? ' class="w"' : ''}>${esc(p.name)}</span>`).join('→')}</div>
                <div class="aq-sub" style="margin:4px 0 8px">${w === 'kf' ? 'Kin Flats' : 'Archipel'} • ${pts.length} étapes • ${T.fmtDist(r.studs)} au total</div>
                ${r.legs.map((l, i) => `<div class="aq-sub" style="margin:2px 0"><b>${Math.round(l.deg)}° ${l.card}</b> → ${esc(l.to.name)} · ${T.fmtDist(l.studs)} · ${T.sec(l.sprint)} en sprint</div>`).join('')}
                <div class="aq-g">${stat('Marche', T.sec(r.walk))}${stat('Sprint', T.sec(r.sprint), 1)}${stat('Véhicule ≈', T.sec(r.vehicle))}</div>
                <div class="aq-acts">${A.compass ? '<button class="aq-btn pri" data-act="route">Suivre à la boussole en jeu<kbd>Entrée</kbd></button>' : ''}${A.showRoute ? '<button class="aq-btn" data-act="routeMap">Voir sur la carte</button>' : ''}</div></div>`;
        }
        function update() {
            const v = input.value;
            cmd = T.parseCommand(v);
            mode.className = 'aq-mode' + (cmd.kind !== 'search' ? ' on' : '');
            mode.textContent = cmd.kind === 'duel' ? 'Duel' : cmd.kind === 'route' ? 'Cap' : 'Wiki';
            if (!index) return renderEmpty();
            if (cmd.kind === 'duel') return renderDuel();
            if (cmd.kind === 'route') return renderRoute();
            const q = v.trim();
            if (!q) { results = []; return renderEmpty(); }
            results = T.search(index, q, 9); sel = Math.min(sel, Math.max(0, results.length - 1));
            renderSearch();
        }
        input.addEventListener('input', () => { sel = 0; update(); });
        input.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (cmd.kind === 'search' && results.length) { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length; renderSearch(); } return; }
            if (e.key === 'Escape') { e.preventDefault(); if (input.value) { input.value = ''; update(); } else if (A.close) A.close(); return; }
            if (e.key === 'Tab') {
                if (cmd.kind === 'search' && results[sel] && results[sel].type !== 'loc') { e.preventDefault(); runAct('duel', results[sel]); }
                else if (cmd.kind === 'duel' && lastDuel && lastDuel.a && /vs\s*$/i.test(input.value) === false) { e.preventDefault(); }
                return;
            }
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (cmd.kind === 'route') return runAct(e.ctrlKey ? 'routeMap' : 'route');
            if (cmd.kind === 'duel') return;
            const o = results[sel]; if (!o) return;
            if (e.ctrlKey) return runAct('wiki', o);
            if (e.altKey && o.type === 'loc') return runAct('origin', o);
            const a = actsFor(o)[0]; if (a) runAct(a[0], o);
        });
        body.addEventListener('click', e => {
            const t = e.target.closest('button'); if (!t) return;
            if (t.dataset.ex) { input.value = t.dataset.ex; input.focus(); update(); return; }
            if (t.dataset.i) { sel = +t.dataset.i; renderSearch(); input.focus(); return; }
            if (t.dataset.act) { runAct(t.dataset.act, results[sel]); return; }
            if (t.dataset.swap && cmd.kind === 'duel') { input.value = `${cmd.b} vs ${cmd.a}`; update(); return; }
            if (t.dataset.dw && lastDuel && A.openWiki) A.openWiki(lastDuel[t.dataset.dw]);
        });
        body.addEventListener('dblclick', e => { const t = e.target.closest('.aq-it'); if (t && A.openWiki) A.openWiki(results[+t.dataset.i]); });
        update();
        return {
            focus(select) { input.focus(); if (select) input.select(); },
            setIndex(ix) { useIx(ix); index = T.prep(ix); update(); },
            set(text) { input.value = text || ''; sel = 0; update(); },
            message: msg,
            refresh: update,
            el: root_
        };
    }
    root.AR2Quick = { mount, detail, duelHTML, dial, ensureCSS, setImgBase, CAT_COLOR, ICON };
})(typeof window !== 'undefined' ? window : globalThis);
