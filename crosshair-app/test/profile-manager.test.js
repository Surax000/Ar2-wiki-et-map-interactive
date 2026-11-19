const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const core = require('../src/crosshair-core.js');
const profiles = require('../src/profile-manager.js');
const configStore = require('../src/config-store.js');

function idFactory() {
    let id = 0;
    return () => `test-${++id}`;
}

test('profiles keep isolated settings through create, switch and all deletion positions', () => {
    const makeId = idFactory();
    let list = core.PRESETS.slice(0, 3).map((preset, index) => ({
        id: `preset-${index}`,
        name: preset.name,
        settings: core.withDefaults(preset.s)
    }));
    let active = 0;

    let created = profiles.create(list, 'Portée', list[active].settings, makeId);
    list = created.profiles;
    active = created.active;
    list[active].settings.customParts = [{ style: 'cross', x: 4 }];
    list[active].settings.customParts[0].x = 17;

    created = profiles.create(list, 'Combat', list[active].settings, makeId);
    list = created.profiles;
    active = created.active;
    list[active].settings.customParts[0].x = 29;
    assert.equal(list[3].settings.customParts[0].x, 17);
    assert.notEqual(list[3].settings.customParts, list[4].settings.customParts);

    active = profiles.select(list, 3);
    list[active].settings.color = '#123456';
    active = profiles.select(list, 4);
    assert.equal(list[4].settings.customParts[0].x, 29);
    assert.equal(list[4].settings.color, list[0].settings.color);
    assert.equal(list[3].settings.color, '#123456');

    ({ profiles: list, active } = profiles.remove(list, active, active));
    assert.equal(list[active].name, 'Portée');

    // Supprimer avant le profil actif décale son index sans changer sa sélection.
    active = profiles.select(list, 3);
    const selectedId = list[active].id;
    ({ profiles: list, active } = profiles.remove(list, active, 1));
    assert.equal(list[active].id, selectedId);
    assert.equal(active, 2);

    // Supprimer après le profil actif conserve l'index actif.
    active = profiles.select(list, 0);
    const activeId = list[active].id;
    ({ profiles: list, active } = profiles.remove(list, active, list.length - 1));
    assert.equal(list[active].id, activeId);

    while (list.length > 1) ({ profiles: list, active } = profiles.remove(list, active, list.length - 1));
    assert.throws(() => profiles.remove(list, active, 0), /dernier profil/);
});

test('profile names and imported profile data are validated without replacing existing profiles', () => {
    const makeId = idFactory();
    const existing = [
        { id: 'one', name: 'Sniper', settings: core.withDefaults({ color: '#ffffff' }) },
        { id: 'two', name: 'Autre', settings: core.withDefaults({ color: '#00ff88' }) }
    ];
    assert.throws(() => profiles.create(existing, '   ', existing[0].settings, makeId), /ne peut pas être vide/);
    assert.throws(() => profiles.create(existing, 'sniper', existing[0].settings, makeId), /déjà ce nom/);
    assert.throws(() => profiles.rename(existing, 0, '  '), /ne peut pas être vide/);
    assert.throws(() => profiles.rename(existing, 1, 'SNIPER'), /déjà ce nom/);

    let renamed = profiles.rename(existing, 0, 'Tir longue portée');
    renamed = profiles.rename(renamed, 1, 'Viseur compact');
    assert.deepEqual(renamed.map(profile => profile.name), ['Tir longue portée', 'Viseur compact']);
    assert.equal(existing[0].name, 'Sniper');

    const exportedCode = core.toCode(existing[0].settings);
    const importedSettings = core.fromCode(exportedCode);
    const shared = profiles.create(existing, 'Profil partagé', importedSettings, makeId);
    assert.equal(shared.profiles[2].settings.color, '#ffffff');
    const imported = profiles.importProfiles([
        { id: 'external-1', name: 'Sniper', settings: importedSettings },
        { id: 'external-2', name: 'Sniper', settings: { color: '#00ff88' } }
    ], existing, { idFactory: makeId });
    assert.deepEqual(imported.profiles.map(profile => profile.name), ['Sniper (2)', 'Sniper (3)']);
    assert.notEqual(imported.profiles[0].id, existing[0].id);
    assert.equal(imported.idMap['external-1'], imported.profiles[0].id);
    assert.equal(existing.length, 2);
    assert.equal(existing[0].settings.color, '#ffffff');
    assert.throws(() => profiles.importProfiles([{ name: 'Bad', settings: 'not settings' }], existing, { idFactory: makeId }), /réglages.*invalides/);
    assert.throws(() => profiles.importProfiles([{ id: 'same', name: 'A' }, { id: 'same', name: 'B' }], existing, { idFactory: makeId }), /identifiants.*double/);
});

test('profile export survives an atomic save and reload of a legacy-format config', t => {
    const makeId = idFactory();
    const created = profiles.create([], 'Profil personnalisé', {
        color: '#abcdef',
        customParts: [{ style: 'circle', x: 5 }],
        offsetX: 24
    }, makeId);
    const legacy = { active: created.active, profiles: created.profiles, hotkeys: { toggle: 'Control+Alt+X' } };
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ar2-profile-test-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const file = path.join(directory, 'config.json');

    configStore.writeJsonAtomically(file, legacy);
    const reloaded = configStore.readJson(file);
    reloaded.profiles = profiles.normalizeLoaded(reloaded.profiles, makeId);
    assert.equal(reloaded.profiles[0].settings.color, '#abcdef');
    assert.equal(reloaded.profiles[0].settings.offsetX, 24);
    assert.deepEqual(reloaded.profiles[0].settings.customParts, [{ style: 'circle', x: 5 }]);
    assert.equal(reloaded.hotkeys.toggle, 'Control+Alt+X');
    assert.equal(reloaded.version, undefined);
    const malformed = '{ "profiles": [';
    fs.writeFileSync(file, malformed);
    assert.throws(() => configStore.readJson(file));
    assert.equal(fs.readFileSync(file, 'utf8'), malformed);

    const backup = JSON.stringify({ app: 'ar2-crosshair', format: 1, data: { profiles: profiles.exportProfiles(reloaded.profiles) } });
    const importedBackup = JSON.parse(backup);
    const restored = profiles.importProfiles(importedBackup.data.profiles, [], { preserveIds: true, idFactory: makeId });
    assert.deepEqual(restored.profiles[0].settings, reloaded.profiles[0].settings);
    assert.equal(restored.profiles[0].id, reloaded.profiles[0].id);
});
