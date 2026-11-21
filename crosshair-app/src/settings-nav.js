/* AR2 Crosshair – réglages rangés en catégories et sous-catégories (v1.6) */
(function () {
    const I = {
        viseur: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
        armes: '<path d="M3 14h11l2-3h5v3h-3l-1 2h-3l-1 3H9l1-3H3z"/>',
        jeu: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4M7 9h5M7 12h8"/>',
        wiki: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
        look: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-1-.8-1.4-.8-2.3 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
        app: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
        fav: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'
    };
    const svg = (k, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;

    // [id du bloc, nom de l'onglet, phrase simple "à quoi ça sert"]
    const CATS = [
        { id: 'viseur', name: 'Mon viseur', desc: "La petite croix au milieu de l'écran : sa couleur, sa taille et sa place.", side: true, subs: [
            ['cl-box', 'Couleur', 'Choisis la couleur de ta croix et si elle est plus ou moins transparente.'],
            ['ac-box', 'Couleur auto', "La croix change toute seule de couleur pour qu'on la voie toujours (sur l'herbe, le ciel, la neige…)."],
            ['dim-box', 'Taille et forme', 'Plus longue, plus épaisse, avec un point ou un cercle : regarde l’aperçu à droite.'],
            ['ol-box', 'Contour et lueur', 'Un bord noir ou une lueur autour de la croix pour mieux la voir.'],
            ['pos-box', 'Position', "Déplace la croix si elle n'est pas pile au centre de ton viseur Roblox."]] },
        { id: 'armes', name: 'Mes armes', desc: 'Une croix différente pour chaque arme, qui change toute seule quand tu changes d’arme.', side: true, subs: [
            ['auto-box', 'Changement auto', 'Tu appuies sur 1, 2, 3… dans AR2 : l’appli met la croix de cette arme.']] },
        { id: 'jeu', name: 'Aides en jeu', desc: 'Les petites fenêtres qui s’affichent par-dessus Roblox pendant que tu joues.', subs: [
            ['sp-box', 'Wiki instantané', 'Une barre de recherche par-dessus le jeu : tape le nom d’une arme ou d’un lieu.'],
            ['rg-box', 'Télémètre', 'Une règle à côté du viseur pour savoir à quelle distance est un ennemi.'],
            ['cp-box', 'Boussole', 'Une flèche en haut de l’écran qui montre la direction de ta destination.'],
            ['sound-box', 'Alertes sonores', 'Un anneau bleu autour du personnage et des repères rouges pour les bruits proches.'],
            ['tm2-box', 'Carte tactique', 'Ta carte par-dessus le jeu, avec ton chemin de loot et les bâtiments utiles.'],
            ['tm-box', 'Minuteur', 'Un compte à rebours pour savoir quand revenir chercher du loot.'],
            ['ck-box', 'Objectifs', 'Ta liste de choses à faire, dans un coin de l’écran.']] },
        { id: 'wiki', name: 'Wiki et entraînement', desc: 'Tout le site AR2 dans l’appli, et un petit jeu pour tester ton viseur.', subs: [
            ['wiki-box', 'Wiki AR2', 'Le site complet : armes, carte, loot run, boss…'],
            ['aim-box', 'Entraînement', 'Un mini-jeu pour voir si ta croix te va bien.']] },
        { id: 'look', name: 'Apparence', desc: 'Les couleurs de l’appli et des fenêtres en jeu.', subs: [
            ['th-box', 'Thème', 'Choisis une ambiance : vision nocturne, militaire, e-sport…']] },
        { id: 'app', name: 'Réglages de l’appli', desc: 'Les touches, les sauvegardes et le démarrage de l’appli.', subs: [
            ['hk-box', 'Raccourcis clavier', 'Les touches à presser pour tout faire sans quitter le jeu.'],
            ['wl-box', 'Applis autorisées', 'Choisis dans quels programmes la croix a le droit de s’afficher.'],
            ['bk-box', 'Sauvegarde', 'Garde tous tes réglages dans un fichier, ou récupère-les.'],
            ['gen-box', 'Général', 'Démarrage avec Windows, mises à jour…']] }
    ];

    // Mes favoris : les réglages épinglés avec l'étoile (v1.7)
    CATS.unshift({ id: 'fav', name: 'Mes favoris', desc: 'Tes réglages préférés, tous au même endroit. Clique sur l’étoile ☆ à côté de n’importe quel réglage pour l’ajouter ici.', subs: [
        ['fav-box', 'Mes réglages favoris', 'Les réglages que tu changes souvent. Clique encore sur l’étoile pour les enlever.']] });
    const ctl0 = document.getElementById('controls');
    if (ctl0 && !document.getElementById('fav-box')) {
        const fb = document.createElement('details'); fb.id = 'fav-box'; fb.open = true;
        fb.innerHTML = '<summary>Mes réglages favoris</summary><div id="fav-list"></div><div id="fav-empty" class="fav-empty"><b>Aucun favori pour l’instant.</b><br>Va dans n’importe quel onglet et clique sur l’étoile <span class="fav-demo">☆</span> à droite d’un réglage (ex : Couleur auto, FOV du télémètre, Opacité du minuteur). Il apparaîtra ici.</div>';
        ctl0.prepend(fb);
    }
    const layout = document.querySelector('main.layout');
    const controls = document.getElementById('controls');
    const preview = document.querySelector('.preview-panel');
    const profiles = document.querySelector('.profiles');
    if (!layout || !controls) return;

    const blocks = {};
    CATS.forEach(c => c.subs.forEach(([id, label, kid]) => {
        const d = document.getElementById(id); if (!d) return;
        d.open = true; d.classList.add('sub'); d.dataset.cat = c.id;
        const sm = d.querySelector('summary');
        const h = document.createElement('div'); h.className = 'sub-head';
        h.innerHTML = `<h2></h2><p class="kid"></p>`;
        h.querySelector('h2').textContent = label; h.querySelector('.kid').textContent = kid;
        sm.after(h);
        d.addEventListener('toggle', () => { if (!d.open) d.open = true; });
        blocks[id] = { d, label, kid, cat: c };
    }));

    // Colonne de gauche : recherche + catégories
    const nav = document.createElement('nav'); nav.className = 'panel cats'; nav.id = 'cats';
    nav.innerHTML = `<label class="search">${svg('search', 16)}<input id="set-search" type="search" placeholder="Chercher un réglage…" autocomplete="off"></label>
        <div class="cat-list">${CATS.map(c => `<button type="button" class="cat" data-cat="${c.id}">${svg(c.id, 22)}<span><b>${c.name}</b><small>${c.id === 'fav' ? '<span id="fav-count">0</span> épinglé(s)' : c.subs.length + ' ' + (c.subs.length > 1 ? 'onglets' : 'onglet')}</small></span></button>`).join('')}</div>
        <p class="cats-help"><b>Comment ça marche ?</b><br>1. Choisis une catégorie ici.<br>2. Choisis un onglet en haut.<br>3. Règle, c'est enregistré tout de suite.</p>`;

    // Colonne du milieu : titre, onglets, contenu
    const content = document.createElement('section'); content.className = 'panel content'; content.id = 'content';
    content.innerHTML = `<div class="cat-head"><div class="crumb" id="crumb"></div><h1 id="cat-title"></h1><p id="cat-desc" class="muted"></p></div><div class="subtabs" id="subtabs" role="tablist"></div><div class="empty hidden" id="no-res">Aucun réglage ne correspond. Essaie un autre mot (ex : couleur, touche, boussole).</div>`;
    controls.classList.remove('panel');
    content.appendChild(controls);

    // Colonne de droite : aperçu + profils (seulement pour le viseur et les armes)
    const side = document.createElement('aside'); side.className = 'side'; side.id = 'side';
    preview.classList.add('pv-card'); profiles.classList.add('pf-card');
    side.appendChild(preview); side.appendChild(profiles);

    layout.innerHTML = ''; layout.classList.add('v2');
    layout.append(nav, content, side);

    const LS = 'ar2x_settings_nav';
    let st = { cat: 'viseur', sub: {} };
    try { st = Object.assign(st, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
    const save = () => { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) {} };
    try { const fv = JSON.parse(localStorage.getItem('ar2x_settings_favs') || '[]'); if (Array.isArray(fv) && fv.length) st.cat = 'fav'; else if (st.cat === 'fav') st.cat = 'viseur'; } catch (e) {}
    let query = '';

    const subLabel = id => {
        if (id === 'ck-box') { const m = /(\d+\/\d+)/.exec(blocks[id].d.querySelector('summary').textContent); return blocks[id].label + (m ? ` <i>${m[1]}</i>` : ''); }
        return blocks[id].label;
    };

    // ---------- favoris ----------
    const FAV_LS = 'ar2x_settings_favs';
    let favs = [];
    try { favs = JSON.parse(localStorage.getItem(FAV_LS) || '[]'); if (!Array.isArray(favs)) favs = []; } catch (e) { favs = []; }
    const favSave = () => { try { localStorage.setItem(FAV_LS, JSON.stringify(favs)); } catch (e) {} };
    const fields = {};
    Object.entries(blocks).forEach(([bid, b]) => {
        if (bid === 'fav-box') return;
        b.d.querySelectorAll('.field').forEach((f, i) => {
            if (f.closest('.field') !== f || f.parentElement.closest('.field')) return;
            const el = f.querySelector('[id]:not(b):not(span)') || f.querySelector('[data-k]');
            const key = el ? (el.id ? '#' + el.id : 'k:' + el.dataset.k) : bid + ':' + i;
            if (fields[key]) return;
            const lb = f.querySelector('label');
            const name = (lb ? lb.textContent : f.textContent).replace(/\s+/g, ' ').replace(/\(.*?\)/g, '').trim().slice(0, 60);
            fields[key] = { f, bid, name, home: null };
            f.classList.add('favable'); f.dataset.favKey = key;
            const star = document.createElement('button'); star.type = 'button'; star.className = 'fav-star'; star.dataset.fav = key;
            star.setAttribute('aria-label', 'Épingler « ' + name + ' » dans Mes favoris');
            f.appendChild(star);
        });
    });
    favs = favs.filter(k => fields[k]);
    function favPaint() {
        Object.entries(fields).forEach(([k, o]) => { const on = favs.includes(k); o.f.classList.toggle('is-fav', on); const s = o.f.querySelector('.fav-star'); s.textContent = on ? '★' : '☆'; s.title = on ? 'Retirer de Mes favoris' : 'Épingler dans Mes favoris (tout en haut des réglages)'; });
        const c = document.getElementById('fav-count'); if (c) c.textContent = favs.length;
    }
    function favRestore() {
        Object.values(fields).forEach(o => { if (o.home) { o.home.replaceWith(o.f); o.home = null; } });
        const l = document.getElementById('fav-list'); if (l) l.innerHTML = '';
    }
    function favMount() {
        const list = document.getElementById('fav-list'); if (!list) return;
        list.innerHTML = '';
        favs.forEach(k => {
            const o = fields[k]; if (!o) return;
            const b = blocks[o.bid];
            const wrap = document.createElement('div'); wrap.className = 'fav-item';
            const where = document.createElement('button'); where.type = 'button'; where.className = 'fav-where'; where.dataset.goto = o.bid;
            where.textContent = b.cat.name + ' › ' + b.label; where.title = 'Ouvrir cet onglet';
            o.home = document.createComment('fav:' + k); o.f.replaceWith(o.home);
            wrap.append(where, o.f); list.appendChild(wrap);
        });
        document.getElementById('fav-empty').classList.toggle('hidden', favs.length > 0);
        CATS[0].side = favs.some(k => fields[k] && blocks[fields[k].bid].cat.side);
    }
    document.addEventListener('click', e => {
        const s = e.target.closest('.fav-star'); if (!s) return;
        e.preventDefault(); e.stopPropagation();
        const k = s.dataset.fav, i = favs.indexOf(k);
        if (i >= 0) favs.splice(i, 1); else favs.push(k);
        favSave(); favPaint();
        if (st.cat === 'fav' && !query) render();
        else { s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
    }, true);
    favPaint();

    function render() {
        favRestore();
        const cat = CATS.find(c => c.id === st.cat) || CATS[0];
        nav.querySelectorAll('.cat').forEach(b => b.classList.toggle('on', !query && b.dataset.cat === cat.id));
        const tabs = document.getElementById('subtabs');
        const noRes = document.getElementById('no-res');
        if (query) {
            const q = norm(query);
            let n = 0;
            Object.entries(blocks).forEach(([id, b]) => { const hit = id !== 'fav-box' && norm(b.label + ' ' + b.kid + ' ' + b.cat.name + ' ' + b.d.textContent).includes(q); b.d.classList.toggle('show', hit); b.d.classList.toggle('in-search', hit); if (hit) n++; });
            document.getElementById('crumb').textContent = 'Recherche';
            document.getElementById('cat-title').textContent = n ? `${n} résultat${n > 1 ? 's' : ''} pour « ${query} »` : `Rien pour « ${query} »`;
            document.getElementById('cat-desc').textContent = 'Efface la recherche pour revenir aux catégories.';
            tabs.innerHTML = ''; noRes.classList.toggle('hidden', n > 0);
            Object.values(blocks).forEach(b => { const t = b.d.querySelector('.sub-head h2'); t.textContent = b.cat.name + ' › ' + b.label; });
            layout.classList.add('no-side');
            return;
        }
        noRes.classList.add('hidden');
        Object.values(blocks).forEach(b => { b.d.querySelector('.sub-head h2').textContent = b.label; b.d.classList.remove('in-search'); });
        const sub = cat.subs.some(s => s[0] === st.sub[cat.id]) ? st.sub[cat.id] : cat.subs[0][0];
        document.getElementById('crumb').innerHTML = `${svg(cat.id, 14)} ${cat.name}`;
        document.getElementById('cat-title').textContent = cat.name;
        document.getElementById('cat-desc').textContent = cat.desc;
        tabs.innerHTML = cat.subs.length > 1 ? cat.subs.map(([id]) => `<button type="button" role="tab" class="subtab${id === sub ? ' on' : ''}" data-sub="${id}" aria-selected="${id === sub}">${subLabel(id)}</button>`).join('') : '';
        Object.entries(blocks).forEach(([id, b]) => b.d.classList.toggle('show', id === sub));
        if (cat.id === 'fav') favMount();
        layout.classList.toggle('no-side', !cat.side);
        controls.scrollTop = 0; content.scrollTop = 0;
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
    const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    nav.addEventListener('click', e => { const b = e.target.closest('.cat'); if (!b) return; st.cat = b.dataset.cat; const si = document.getElementById('set-search'); if (query) { query = ''; si.value = ''; } save(); render(); });
    content.addEventListener('click', e => { const b = e.target.closest('.subtab'); if (!b) return; st.sub[st.cat] = b.dataset.sub; save(); render(); });
    document.getElementById('set-search').addEventListener('input', e => { query = e.target.value.trim(); if (query.length < 2) query = ''; render(); });
    document.addEventListener('keydown', e => {
        if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.hk) return;
        if ((e.ctrlKey && e.key.toLowerCase() === 'f') || (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) { e.preventDefault(); document.getElementById('set-search').focus(); }
        if (e.key === 'Escape' && document.activeElement.id === 'set-search') { e.target.value = ''; query = ''; render(); }
    });
    // le compteur des objectifs suit la liste
    const ckSum = document.querySelector('#ck-box summary');
    if (ckSum) new MutationObserver(() => { const t = content.querySelector('.subtab[data-sub="ck-box"]'); if (t) t.innerHTML = subLabel('ck-box'); }).observe(ckSum, { childList: true, characterData: true, subtree: true });
    // liens internes : ouvre une catégorie / un onglet (ex : data-goto="hk-box")
    document.addEventListener('click', e => { const g = e.target.closest('[data-goto]'); if (!g || !blocks[g.dataset.goto]) return; const b = blocks[g.dataset.goto]; st.cat = b.cat.id; st.sub[b.cat.id] = g.dataset.goto; query = ''; document.getElementById('set-search').value = ''; save(); render(); });
    window.AR2SettingsNav = { go: id => { const b = blocks[id]; if (!b) return; st.cat = b.cat.id; st.sub[b.cat.id] = id; render(); }, cats: CATS, favs: () => favs.slice(), toggleFav: k => { const i = favs.indexOf(k); if (i >= 0) favs.splice(i, 1); else if (fields[k]) favs.push(k); favSave(); favPaint(); render(); } };
    const pvBox = document.querySelector('.preview');
    if (pvBox && window.ResizeObserver) { let t = 0; new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))); }).observe(pvBox); }
    render();
})();
