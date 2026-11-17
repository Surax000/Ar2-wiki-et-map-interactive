// Applique le thème visuel choisi (Classique, NVG, Olive, E-Sport) à la fenêtre courante
(function () {
    const apply = id => { try { if (window.AR2Tools) window.AR2Tools.applyTheme(id || 'classic'); } catch (e) {} };
    if (window.xh && window.xh.getTheme) { window.xh.getTheme().then(apply).catch(() => apply('classic')); if (window.xh.onTheme) window.xh.onTheme(apply); }
    else apply('classic');
})();
