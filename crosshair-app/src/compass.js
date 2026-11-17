// Boussole / cap de navigation en haut de l'écran
(function () {
    const T = window.AR2Tools, box = document.getElementById('box');
    const SPEED = { walk: 'marche', sprint: 'sprint', vehicle: 'véhicule' };
    const CARDS = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };
    function tape(deg, W, H) {
        const span = 150, ppd = W / span, c = W / 2;
        let s = '';
        const start = Math.ceil((deg - span / 2) / 5) * 5;
        for (let a = start; a <= deg + span / 2; a += 5) {
            const x = c + (a - deg) * ppd, n = ((a % 360) + 360) % 360, big = n % 45 === 0, mid = n % 15 === 0;
            s += `<line x1="${x}" x2="${x}" y1="${H}" y2="${H - (big ? 12 : mid ? 8 : 4)}" stroke="rgb(var(--t-${big ? 'text' : 'muted'}))" stroke-width="${big ? 2 : 1}"/>`;
            if (big) s += `<text x="${x}" y="${H - 15}" text-anchor="middle" font-size="12" font-weight="800" fill="rgb(var(--t-${n === 0 ? 'red' : 'text'}))">${CARDS[n]}</text>`;
            else if (mid) s += `<text x="${x}" y="${H - 15}" text-anchor="middle" font-size="9" fill="rgb(var(--t-muted))">${n}</text>`;
        }
        s += `<path d="M${c - 7} 1 L${c + 7} 1 L${c} 10 Z" fill="rgb(var(--t-acc))"/><line x1="${c}" x2="${c}" y1="8" y2="${H}" stroke="rgb(var(--t-acc))" stroke-width="2"/>`;
        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
    }
    window.xh.onTheme(id => T.applyTheme(id));
    window.xh.onCompass(D => {
        T.applyTheme(D.theme);
        const k = D.scale || 1;
        document.body.style.fontSize = (13 * k) + 'px';
        box.style.opacity = D.opacity;
        if (D.empty) { box.innerHTML = `<div class="empty"><span>Aucune destination. <b>${T.esc(D.keys.spot)}</b> puis tape « Ashland &gt; Regional Airport », ou envoie un Loot Run depuis le wiki.</span></div>`; return; }
        const W = window.innerWidth, deg = D.deg;
        box.innerHTML = tape(deg, W, Math.round(36 * k)) +
            `<div class="row" style="margin-top:${4 * k}px"><span class="cap">${String(Math.round(deg) % 360).padStart(3, '0')}°</span><span class="card">${T.esc(D.card16)}</span>
                <span class="to"><small>vers</small> ${T.esc(D.to)}</span><span class="eta">${T.esc(D.dist)} · ${T.esc(T.sec(D[D.speed]))} ${SPEED[D.speed]}</span></div>
             <div class="sub">${D.legs > 1 ? `Étape <b>${D.leg}/${D.legs}</b> · ` : ''}depuis ${T.esc(D.from)}${D.next ? ` · ensuite ${T.esc(D.next)}` : ''}${D.legs > 1 ? ` · reste ${T.esc(D.restDist)}, ${T.esc(T.sec(D.restTime))}` : ''}${D.legs > 1 ? ` · ${T.esc(D.keys.next)} étape suivante` : ` · marche ${T.esc(T.sec(D.walk))}, véhicule ${T.esc(T.sec(D.vehicle))}`}</div>`;
    });
})();
