/* AR2 Crosshair – Assistant de configuration (4 écrans) */
(function () {
    const C = window.AR2Crosshair;
    const q = s => document.querySelector(s);
    const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const kb = a => (a || 'aucun').replace(/Control/g, 'Ctrl').replace(/Shift/g, 'Maj');
    let step = 0, layout = null, fired = new Set(), root = null;
    const st = () => window.__obState || {};
    async function refresh(s) { if (s) window.__obState = s; else window.__obState = await xh.getState(); try { S = window.__obState; renderAll(); } catch (e) { } }

    const TEST_KEYS = [['toggle', 'Afficher / masquer le viseur'], ['spotlight', 'Wiki instantané'], ['range', 'Télémètre'], ['compass', 'Boussole'], ['map', 'Carte tactique'], ['timer', 'Minuteur']];
    // Touches qui deviennent un symbole avec AltGr (= Ctrl+Alt) sur un clavier AZERTY français
    const ALTGR = { '2': '~', '3': '#', '4': '{', '5': '[', '6': '|', '7': '`', '8': '\\', '9': '^', '0': '@', 'E': '€', ')': ']', '=': '}', 'Plus': '}' };

    function shell() {
        root = document.createElement('div'); root.id = 'ob'; root.className = 'ob-back';
        root.innerHTML = `<div class="ob-card" role="dialog" aria-modal="true" aria-labelledby="ob-title">
            <div class="ob-head"><div><span class="ob-step" id="ob-step"></span><h2 id="ob-title"></h2></div><button class="btn sm ghost" id="ob-skip">Passer l'assistant</button></div>
            <div class="ob-dots" id="ob-dots"></div>
            <div class="ob-body" id="ob-body"></div>
            <div class="ob-foot"><button class="btn" id="ob-prev">Retour</button><button class="btn primary" id="ob-next">Suivant</button></div>
        </div>`;
        document.body.appendChild(root);
        q('#ob-skip').onclick = () => finish(true);
        q('#ob-prev').onclick = () => { if (step > 0) { step--; draw(); } };
        q('#ob-next').onclick = () => { if (step < 3) { step++; draw(); } else finish(false); };
        root.addEventListener('keydown', e => { if (e.key === 'Escape') finish(true); });
    }

    const TITLES = ['Ton champ de vision (FOV)', 'Ton viseur', 'Tes aides en jeu', 'Tes raccourcis clavier'];
    function draw() {
        const s = st(), cfg = s.cfg || {};
        q('#ob-step').textContent = `Étape ${step + 1} sur 4`;
        q('#ob-title').textContent = TITLES[step];
        q('#ob-dots').innerHTML = TITLES.map((t, i) => `<span class="${i === step ? 'on' : i < step ? 'done' : ''}" title="${esc(t)}"></span>`).join('');
        q('#ob-prev').disabled = step === 0;
        q('#ob-next').textContent = step === 3 ? 'Terminer' : 'Suivant';
        const b = q('#ob-body');
        if (step === 0) {
            const fov = (cfg.range && cfg.range.fov) || 70;
            b.innerHTML = `<p>Le <b>télémètre</b> (Ctrl+Alt+D) dessine des petits traits pour savoir où viser selon la distance. Pour qu'ils tombent au bon endroit, il doit connaître ton <b>champ de vision</b>, comme dans le jeu.</p>
                <ol class="ob-how"><li>Dans AR2, appuie sur <span class="kbd">Échap</span> puis ouvre <b>Settings</b>.</li><li>Regarde le nombre à côté de <b>Field of View</b>.</li><li>Mets le même nombre ici. Tu ne l'as jamais changé ? Laisse <b>70</b>.</li></ol>
                <div class="ob-fov"><input type="range" id="ob-fov" min="50" max="120" step="1" value="${fov}"><input type="number" id="ob-fovn" min="50" max="120" value="${fov}"><span class="muted">degrés</span></div>
                <div class="row gap wrap mt-s">${[70, 80, 90, 100].map(v => `<button class="chip" data-fov="${v}">${v}${v === 70 ? ' (normal)' : ''}</button>`).join('')}</div>`;
            const set = async v => { v = Math.max(50, Math.min(120, Math.round(+v) || 70)); q('#ob-fov').value = v; q('#ob-fovn').value = v; await refresh(await xh.hudExtras({ range: { fov: v } })); };
            q('#ob-fov').oninput = e => { q('#ob-fovn').value = e.target.value; };
            q('#ob-fov').onchange = e => set(e.target.value);
            q('#ob-fovn').onchange = e => set(e.target.value);
            b.querySelectorAll('[data-fov]').forEach(x => x.onclick = () => set(x.dataset.fov));
        } else if (step === 1) {
            const curS = (cfg.profiles && cfg.profiles[cfg.active] && cfg.profiles[cfg.active].settings) || {};
            const ac = cfg.autoColor || {};
            b.innerHTML = `<p>Choisis le viseur qui te plaît. Tu pourras le modifier en détail après (onglet « Mon viseur »).</p>
                <div class="ob-presets">${C.PRESETS.map((p, i) => `<button class="ob-preset" data-pi="${i}"><canvas width="72" height="72"></canvas><span>${esc(p.name)}</span></button>`).join('')}</div>
                <label class="ob-big tog"><input type="checkbox" id="ob-ac" ${ac.enabled ? 'checked' : ''}><span><b>Couleur auto</b><br><span class="muted small">Le viseur change de couleur tout seul pour toujours bien se voir (vert sur la neige, blanc dans le noir…).</span></span></label>`;
            const same = (a, p) => Object.keys(C.withDefaults(p.s)).every(k => JSON.stringify(a[k]) === JSON.stringify(C.withDefaults(p.s)[k]));
            b.querySelectorAll('.ob-preset').forEach(btn => {
                const p = C.PRESETS[+btn.dataset.pi], cv = btn.querySelector('canvas'), ctx = cv.getContext('2d');
                ctx.fillStyle = '#3a4a3a'; ctx.fillRect(0, 0, 72, 72); C.draw(ctx, 36, 36, C.withDefaults(p.s));
                btn.classList.toggle('on', same(curS, p));
                btn.onclick = async () => { await refresh(await xh.update(C.withDefaults(p.s))); b.querySelectorAll('.ob-preset').forEach(x => x.classList.toggle('on', x === btn)); };
            });
            q('#ob-ac').onchange = async e => refresh(await xh.setExtras({ autoColor: { enabled: e.target.checked } }));
        } else if (step === 2) {
            const h = cfg.hotkeys || {};
            const T = [
                ['compass', 'Boussole', 'Une flèche en haut de l’écran qui montre où aller (Loot Run ou destination du wiki).', !!(cfg.compass && cfg.compass.show), h.compass],
                ['timer', 'Minuteur', 'Des comptes à rebours à l’écran (caisses, hélico…).', !!(cfg.timer && cfg.timer.overlay), h.timer],
                ['checklist', 'Objectifs', 'Ta petite liste de choses à faire, dans un coin de l’écran.', !!(cfg.checklist && cfg.checklist.overlay), h.checklist],
                ['range', 'Télémètre', 'Les traits pour viser loin, à côté du viseur.', !!(cfg.range && cfg.range.show), h.range],
                ['autoSwitch', 'Viseur selon l’arme', 'Le viseur change tout seul quand tu changes d’arme (touches 1 à 9).', !!(cfg.autoSwitch && cfg.autoSwitch.enabled), null]
            ];
            b.innerHTML = `<p>Allume ce qui t'aide. Tout reste réglable plus tard, et chaque aide a sa touche pour l'afficher ou la cacher en jeu.</p>
                <div class="ob-aids">${T.map(([k, n, d, on, key]) => `<label class="ob-aid tog"><input type="checkbox" data-aid="${k}" ${on ? 'checked' : ''}><span><b>${n}</b>${key ? ` <span class="kbd">${esc(kb(key))}</span>` : ''}<br><span class="muted small">${d}</span></span></label>`).join('')}</div>`;
            b.querySelectorAll('[data-aid]').forEach(x => x.onchange = async () => {
                const v = x.checked, k = x.dataset.aid; let r;
                if (k === 'compass') r = await xh.hudExtras({ compass: { show: v } });
                else if (k === 'range') r = await xh.hudExtras({ range: { show: v } });
                else if (k === 'timer') r = await xh.setExtras({ timer: { overlay: v } });
                else if (k === 'checklist') r = await xh.setExtras({ checklist: { overlay: v } });
                else r = await xh.setConfig({ autoSwitch: { enabled: v } });
                await refresh(r);
            });
        } else {
            const h = cfg.hotkeys || {};
            const isAz = layout ? layout.get('KeyQ') === 'a' : null;
            const conflicts = Object.entries(h).filter(([k, a]) => a && /Control/.test(a) && /Alt/.test(a) && !/Shift/.test(a) && ALTGR[a.split('+').pop()]).map(([k, a]) => [k, a, ALTGR[a.split('+').pop()]]);
            const fails = s.hkFails || [];
            b.innerHTML = `<p>${isAz === true ? 'Ton clavier est en <b>AZERTY</b> : parfait, les lettres des raccourcis sont celles écrites sur tes touches (Ctrl+Alt+A = la touche A de ton clavier).' : isAz === false ? 'Ton clavier n’est pas en AZERTY : les lettres des raccourcis suivent quand même les touches de ton clavier.' : 'Les lettres des raccourcis sont celles écrites sur tes touches (Ctrl+Alt+A = la touche A de ton clavier).'}</p>
                <div class="ob-note">Sur un clavier AZERTY, <b>Ctrl+Alt</b> fait comme <b>AltGr</b>. Évite donc Ctrl+Alt avec les chiffres 0 à 9 ou la lettre E : ils écrivent des symboles (@, #, €…).</div>
                ${conflicts.length ? `<div class="ob-warn">À changer : ${conflicts.map(([k, a, sy]) => `<b>${esc(kb(a))}</b> (écrit « ${esc(sy)} »)`).join(', ')}.</div>` : '<div class="ob-ok">Aucun raccourci ne gêne AltGr.</div>'}
                ${fails.length ? `<div class="ob-warn">Ces raccourcis sont déjà pris par une autre appli : ${fails.map(a => `<b>${esc(kb(a))}</b>`).join(', ')}. Change-les dans « Raccourcis clavier ».</div>` : ''}
                <p class="mt-s"><b>Essaie-les</b> : appuie sur chaque raccourci, il passe au vert quand ça marche.</p>
                <div class="ob-test">${TEST_KEYS.map(([k, n]) => `<div class="ob-tk ${fired.has(h[k]) ? 'ok' : ''}" data-acc="${esc(h[k] || '')}"><span class="kbd">${esc(kb(h[k]))}</span><span>${n}</span><b class="ob-tick">${fired.has(h[k]) ? 'OK' : '…'}</b></div>`).join('')}</div>
                <div class="row gap wrap mt-s"><button class="btn sm" data-goto-hk>Changer mes raccourcis</button></div>`;
            const g = b.querySelector('[data-goto-hk]'); if (g) g.onclick = () => { finish(false); const t = document.querySelector('[data-goto="hk-box"]'); if (t) t.click(); };
        }
    }
    function onFired(acc) {
        fired.add(acc);
        if (!root || step !== 3) return;
        root.querySelectorAll('.ob-tk').forEach(x => { if (x.dataset.acc === acc) { x.classList.add('ok'); x.querySelector('.ob-tick').textContent = 'OK'; } });
    }
    async function finish(skipped) {
        try { await refresh(await xh.setConfig({ onboarded: true })); } catch (e) { }
        try { localStorage.setItem('ar2x_onboarded', '1'); } catch (e) { }
        if (root) { root.remove(); root = null; }
    }
    async function open() {
        if (root) return;
        await refresh();
        try { if (navigator.keyboard && navigator.keyboard.getLayoutMap) layout = await navigator.keyboard.getLayoutMap(); } catch (e) { }
        step = 0; shell(); draw(); q('#ob-next').focus();
    }
    window.AR2Onboarding = { open, finish, onFired, get step() { return step; } };
    if (xh.onHotkeyFired) xh.onHotkeyFired(onFired);
    if (xh.onOpenOnboarding) xh.onOpenOnboarding(() => open());
    document.addEventListener('click', e => { if (e.target.closest('[data-onboarding]')) open(); });
    xh.getState().then(s => { if (s.firstRun || /[?&]onboarding/.test(location.search)) setTimeout(open, 300); });
})();
