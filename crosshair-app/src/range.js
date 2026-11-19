// Télémètre : jauge de distance à côté du viseur (stadiamètre)
// Chaque trait vertical = hauteur d'un personnage Roblox debout à la distance indiquée, avec la lunette choisie.
(function () {
    const T = window.AR2Tools, box = document.getElementById('box');
    const fr = (n, d) => T.fr(n, d);
    window.xh.onTheme(id => T.applyTheme(id));
    window.xh.onRange(D => {
        T.applyTheme(D.theme);
        const k = D.scale || 1, colW = 34 * k, hdH = 50 * k, ftH = 70 * k, A = D.maxPx;
        document.body.style.fontSize = (12 * k) + 'px';
        box.style.opacity = D.opacity;
        const W = window.innerWidth, w = D.weapon;
        const left = i => D.side === 'left' ? W - (13 * k + colW * (i + 0.5)) : 13 * k + colW * (i + 0.5);
        const head = w ? `<b>${T.esc(w.name)}</b> <span class="s">· ${T.esc(D.scope.name)}</span>` : '<b>Télémètre</b>';
        const speedLabel = { stationary: 'immobile', walk: 'marche', sprint: 'sprint', vehicle: 'véhicule' }[D.targetSpeed] || 'immobile';
        const direction = D.targetDirection === 'left' ? '←' : '→';
        const l2 = w ? `Tête ${w.hd} · corps ${w.bod} · plein jusqu'à ${w.fdr} studs · ${D.src === 'manuel' ? 'arme choisie' : D.src} · cible ${speedLabel}${w.estimated ? ' · vitesse estimée' : ''}` : 'Choisis une arme dans le wiki instantané';
        const bars = D.ladder.map((m, i) => {
            const x = left(i), hh = m.px * 1.2 / 5.2;
            return `<div class="bar ${m.zone}" style="left:${x}px;height:${m.px}px"><i style="top:${hh}px"></i></div>`;
        }).join('');
        const lbs = D.ladder.map((m, i) => `<div class="lb ${m.zone}" style="left:${left(i)}px;top:${hdH + A + 4 * k}px"><b>${m.d}</b>${m.body != null ? `<span>${m.body}</span><em title="Hausse estimée au-dessus de la cible">${m.correctionAvailable ? '↑' + fr(m.holdPx, 1) + 'px' : '↑—'}</em>${D.targetSpeed !== 'stationary' ? `<em title="Avance estimée devant la cible">${m.correctionAvailable ? (m.leadPx < 0 ? '←' : direction) + fr(Math.abs(m.leadPx), 1) + 'px' : '↔—'}</em>` : ''}` : ''}</div>`).join('');
        const guide = D.targetSpeed === 'stationary'
            ? '↑ hausse estimée · sélectionne le mouvement de la cible pour afficher l’avance latérale'
            : `↑ hausse · ${direction} avance pour une cible en ${speedLabel} traversant l’écran`;
        box.innerHTML = `<div class="hd" style="height:${hdH - 6 * k}px">${head}<span class="l2">${T.esc(l2)}</span></div>
            <div class="area" style="top:${hdH}px;height:${A}px"><div class="mid"></div>${bars}</div>${lbs}
            <div class="ft">${D.ladder.length ? guide + ' · optique prise en compte, autres effets d’accessoires non modélisés' : 'Aucun repère pour ce zoom'} · ${T.esc(D.keys.zoom)} : lunette</div>`;
    });
})();
