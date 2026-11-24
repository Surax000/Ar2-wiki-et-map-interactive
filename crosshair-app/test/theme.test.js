const test = require('node:test');
const assert = require('node:assert/strict');
const tools = require('../src/ar2-tools.js');

test('new HUD palettes are available without changing existing theme IDs', () => {
    assert.deepEqual(tools.THEME_ORDER.slice(0, 4), ['classic', 'nvg', 'olive', 'esport']);
    for (const id of ['ocean', 'violet', 'crimson', 'arctic']) {
        assert.ok(tools.THEMES[id]);
        assert.equal(tools.themeVars(id)['--c-acc'], tools.THEMES[id].acc);
    }
});

test('custom theme applies the selected accent color to its CSS variables', () => {
    const vars = tools.themeVars({ id: 'custom', color: '#123456' });
    assert.equal(vars['--c-acc'], '#123456');
    assert.equal(vars['--t-acc'], '18 52 86');
    assert.notEqual(vars['--c-border'], tools.THEMES.custom.border);
});

test('applyTheme accepts a custom theme selection object', () => {
    const values = {};
    let themeId;
    const doc = {
        documentElement: {
            style: { setProperty: (key, value) => { values[key] = value; } },
            setAttribute: (key, value) => { if (key === 'data-theme') themeId = value; }
        }
    };

    tools.applyTheme({ id: 'custom', color: '#123456' }, doc);

    assert.equal(themeId, 'custom');
    assert.equal(values['--c-acc'], '#123456');
});

test('invalid custom colors use the safe default accent', () => {
    assert.equal(tools.themeVars({ id: 'custom', color: 'red' })['--c-acc'], tools.THEMES.custom.acc);
});
