const box = document.getElementById('box');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
window.xh.onChecklist(c => {
    const k = Math.max(0.6, Math.min(2, +c.scale || 1));
    const items = c.items.filter(i => !(c.hideDone && i.done));
    const done = c.items.filter(i => i.done).length;
    box.style.width = (290 - 0) + 'px';
    box.style.transform = `scale(${k})`;
    box.style.opacity = Math.max(0.2, Math.min(1, +c.opacity || 0.85));
    box.innerHTML = `<div class="t">${esc(c.title || 'Objectifs')}<span>${done}/${c.items.length}</span></div>` +
        (items.length ? items.map(i => `<div class="i ${i.done ? 'd' : ''}"><span class="c"></span><span class="x">${esc(i.text)}</span></div>`).join('') : '<div class="i"><span class="x" style="color:var(--c-acc,#00ff88)">Tout est fait.</span></div>');
});
