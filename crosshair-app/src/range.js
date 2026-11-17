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
        const l2 = w ? `Tête ${w.hd} · corps ${w.bod} · plein jusqu'à ${w.fdr} studs · ${D.src === 'manuel' ? 'arme choisie' : D.src}` : 'Choisis une arme dans le wiki instantané';
        const bars = D.ladder.map((m, i) => {
            const x = left(i), hh = m.px * 1.2 / 5.2;
            return `<div class="bar ${m.zone}" style="left:${x}px;height:${m.px}px"><i style="top:${hh}px"></i></div>`;
        }).join('');
        const lbs = D.ladder.map((m, i) => `<div class="lb ${m.zone}" style="left:${left(i)}px;top:${hdH + A + 4 * k}px"><b>${m.d}</b>${m.body != null ? `<span>${m.body}</span><em>${m.heads >= 0.25 ? '↓' + fr(m.heads, 1) : ''}</em>` : ''}</div>`).join('');
        box.innerHTML = `<div class="hd" style="height:${hdH - 6 * k}px">${head}<span class="l2">${T.esc(l2)}</span></div>
            <div class="area" style="top:${hdH}px;height:${A}px"><div class="mid"></div>${bars}</div>${lbs}
            <div class="ft">${D.ladder.length ? 'Trait = joueur debout · studs / dégâts corps / chute (têtes)' : 'Aucun repère pour ce zoom'} · ${T.esc(D.keys.zoom)} : lunette</div>`;
    });
})();
