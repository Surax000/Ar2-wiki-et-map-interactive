const box = document.getElementById('box');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let current = null;
window.xh.onChecklist(c => {
    current = c;
    const k = Math.max(0.6, Math.min(2, +c.scale || 1));
    const items = c.items.filter(i => !(c.hideDone && i.done));
    const done = c.items.filter(i => i.done).length;
    box.style.width = '290px';
    box.style.transform = `scale(${k})`;
    box.style.opacity = Math.max(0.2, Math.min(1, +c.opacity || 0.85));
    box.innerHTML = `<div class="t"><span class="drag">⠿ ${esc(c.title || 'Objectifs')}</span><span>${done}/${c.items.length}</span></div>` +
        (items.length ? items.map(i => `<button type="button" class="i ${i.done ? 'd' : ''}" data-check-id="${esc(i.id)}" aria-pressed="${i.done}"><span class="c"></span><span class="x">${esc(i.text)}</span></button>`).join('') : '<div class="i"><span class="x" style="color:var(--c-acc,#00ff88)">Tout est fait.</span></div>');
});
box.addEventListener('click', async e => {
    const b = e.target.closest('[data-check-id]');
    if (!b || !current) return;
    b.disabled = true;
    try { await window.xh.checklistToggle(b.dataset.checkId); }
    catch (err) { b.disabled = false; }
});
