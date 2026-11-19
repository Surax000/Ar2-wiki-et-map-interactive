const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const tools = require('../src/ar2-tools.js');

test('range overlay labels show vertical hold and left/right lead in screen pixels', () => {
    let renderRange;
    const box = { innerHTML: '', style: {} };
    const window = {
        AR2Tools: tools,
        innerWidth: 1920,
        xh: { onTheme() {}, onRange(callback) { renderRange = callback; } }
    };
    const document = { body: { style: {} }, getElementById: () => box };
    vm.runInNewContext(fs.readFileSync(require.resolve('../src/range.js'), 'utf8'), { window, document });

    const weapon = { name: 'Test rifle', vel: 3000, hd: 40, bod: 30, fdr: 200, mdr: 400, mf: 0.5 };
    renderRange({
        scale: 1, opacity: 1, side: 'right', maxPx: 200, screenH: 1080,
        weapon, scope: { name: 'Rifle Scope', z: 4 }, src: 'arme choisie',
        targetSpeed: 'sprint', targetDirection: 'left',
        ladder: tools.ladder(weapon, 4, 1080, { dists: [250], targetSpeed: 24, targetDirection: 'left' }),
        keys: { zoom: 'Ctrl+Alt+Maj+D' }
    });

    assert.match(box.innerHTML, /↑[\d,]+px/);
    assert.match(box.innerHTML, /←[\d,]+px/);
    assert.match(box.innerHTML, /Rifle Scope/);
    assert.match(box.innerHTML, /cible sprint/);
});
