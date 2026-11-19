const test = require('node:test');
const assert = require('node:assert/strict');
const autoColor = require('../src/autocolor.js');

test('automatic contrast can choose colors beyond a user palette', () => {
    const analysis = { avg: [110, 110, 110], clusters: [{ rgb: [110, 110, 110], w: 1 }] };
    const favorite = '#6e6e6e';
    const result = autoColor.pick(analysis, { mode: 'contrast', palette: [favorite], sensitivity: 0 });

    assert.match(result.color, /^#[0-9a-f]{6}$/i);
    assert.notEqual(result.color, favorite);
    assert.ok(autoColor.score(autoColor.hexToRgb(result.color), analysis) > autoColor.score(autoColor.hexToRgb(favorite), analysis));
});

test('color picker favorites normalize short hex values, reject invalid values and stay bounded', () => {
    const analysis = { avg: [0, 0, 0], clusters: [{ rgb: [0, 0, 0], w: 1 }] };
    const favorites = autoColor.normalizePalette(['#abc', '#12zz88', '#ABC']);
    const manyColors = Array.from({ length: 300 }, (_, i) => '#' + i.toString(16).padStart(6, '0'));
    const result = autoColor.pick(analysis, { mode: 'contrast', palette: favorites });

    assert.deepEqual(favorites, ['#aabbcc']);
    assert.match(result.color, /^#[0-9a-f]{6}$/i);
    assert.equal(autoColor.normalizePalette(manyColors).length, autoColor.MAX_PALETTE);
});
