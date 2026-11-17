// Wiki instantané : barre de recherche semi-transparente par-dessus le jeu (Ctrl+Alt+W)
(function () {
    const T = window.AR2Tools, xh = window.xh, root = document.getElementById('root');
    let quick = null, origin = null, index = null;
    const alpha = a => document.documentElement.style.setProperty('--aq-alpha', String(Math.max(0.4, Math.min(1, +a || 0.9))));
    const pt = p => ({ id: p.id, name: p.name, x: p.x, y: p.y, world: p.world || 'halsey' });
    function mount() {
        quick = window.AR2Quick.mount(root, {
            index, host: 'app',
            actions: {
                openWiki: o => xh.hudAct('wiki', { type: o.type, id: o.id, name: o.name }),
                close: () => xh.hudAct('hide'),
                compass: pts => xh.hudAct('compass', { title: pts.map(p => p.name).join(' → '), points: pts.map(pt) }),
                equipRange: w => xh.hudAct('range', { id: w.id }).then(r => quick.message(r && r.ok ? r.msg : 'Arme introuvable.'))
            },
            getOrigin: () => origin,
            setOrigin: o => { origin = o; xh.hudAct('origin', { id: o.id }); }
        });
        window.__spotReady = true;
    }
    xh.hudGet().then(s => {
        T.applyTheme(s.theme); alpha(s.opacity);
        index = s.index && s.index.items && s.index.items.length ? s.index : null;
        if (index && s.origin) origin = T.get(index, s.origin);
        mount(); quick.focus(true);
    });
    xh.onSpotShow(o => {
        T.applyTheme(o.theme); alpha(o.opacity);
        if (!quick) return;
        if (index && o.origin) origin = T.get(index, o.origin) || origin;
        if (o.text) quick.set(o.text);
        quick.focus(true);
        if (o.msg) quick.message(o.msg);
    });
    xh.onIndex(ix => { index = ix; if (quick) quick.setIndex(ix); });
    xh.onTheme(id => T.applyTheme(id));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !(e.target && e.target.classList && e.target.classList.contains('aq-in'))) xh.hudAct('hide'); });
    // clic dans la zone transparente autour de la barre : on ferme
    document.addEventListener('mousedown', e => { if (e.target === root || e.target === document.body || e.target === document.documentElement) xh.hudAct('hide'); });
})();
