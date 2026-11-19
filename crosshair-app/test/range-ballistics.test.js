const test = require('node:test');
const assert = require('node:assert/strict');
const tools = require('../src/ar2-tools.js');

test('range correction uses weapon velocity, distance, optic zoom and lateral target movement', () => {
    const weapon = { vel: 3000, hd: 40, bod: 30, fdr: 200, mdr: 400, mf: 0.5 };
    const near = tools.aimCorrection(weapon, 100, { screenH: 1080, zoom: 1, targetSpeed: 24 });
    const far = tools.aimCorrection(weapon, 400, { screenH: 1080, zoom: 1, targetSpeed: 24 });
    const magnified = tools.aimCorrection(weapon, 400, { screenH: 1080, zoom: 4, targetSpeed: 24 });

    assert.equal(near.available, true);
    assert.ok(far.flightTime > near.flightTime);
    assert.ok(far.drop > near.drop);
    assert.ok(far.liftPx > near.liftPx);
    assert.ok(far.lead > near.lead);
    assert.ok(magnified.liftPx > far.liftPx);
    assert.ok(magnified.leadPx > far.leadPx);

    const left = tools.aimCorrection(weapon, 250, { targetSpeed: 24, targetDirection: 'left' });
    const right = tools.aimCorrection(weapon, 250, { targetSpeed: 24, targetDirection: 'right' });
    assert.equal(left.leadPx, -right.leadPx);

    const ladder = tools.ladder(weapon, 1, 1080, { dists: [100], targetSpeed: 16, targetDirection: 'left' });
    assert.ok(ladder[0].holdPx > 0);
    assert.ok(ladder[0].leadPx < 0);
});

test('unknown projectile speed does not invent an aiming correction', () => {
    assert.deepEqual(tools.aimCorrection({}, 250), {
        available: false, flightTime: 0, drop: 0, heads: 0, liftPx: 0, lead: 0, leadPx: 0
    });
    const [marker] = tools.ladder({}, 1, 1080, { dists: [250] });
    assert.equal(marker.correctionAvailable, false);
});
