const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const datasetNames = ['WEAPONS_DATA', 'EXPLOSIVES_DATA', 'HEAL_ITEMS_DATA', 'ATTACHMENTS_DATA', 'BACKPACKS_DATA', 'FOOD_DATA'];
const dataContext = {};
vm.runInNewContext(
    `${read('site-data.js')}\nglobalThis.datasets = { ${datasetNames.join(', ')} };`,
    dataContext
);

test('catalog datasets contain named entries with unique IDs', () => {
    const allItems = datasetNames.flatMap(name => {
        const items = dataContext.datasets[name];
        assert.ok(Array.isArray(items), `${name} must be an array`);
        assert.ok(items.length > 0, `${name} must not be empty`);
        for (const item of items) {
            assert.equal(typeof item.id, 'string', `${name} entry must have an ID`);
            assert.ok(item.id.length > 0, `${name} entry ID must not be empty`);
            assert.equal(typeof item.name, 'string', `${name} entry must have a name`);
            assert.ok(item.name.length > 0, `${name} entry name must not be empty`);
        }
        return items;
    });

    assert.equal(new Set(allItems.map(item => item.id)).size, allItems.length, 'item IDs must be unique');
});

test('official placed-explosive update is documented without invented gameplay statistics', () => {
    const explosives = dataContext.datasets.EXPLOSIVES_DATA;
    assert.ok(explosives.length >= 9);
    const names = explosives.map(item => item.name);
    for (const name of ['C4', 'PMN-2', 'M14', 'TM-46', 'TM-72', 'M19', 'M18A1 Claymore', 'PSS-12 Mine Detector']) {
        assert.ok(names.includes(name), `missing documented explosive: ${name}`);
    }
    for (const item of explosives) {
        assert.equal(item.status, 'confirmed');
        assert.match(item.source, /^https:\/\//);
        assert.match(item.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(!item.internalId, 'no unverified internal game ID');
        assert.equal(Object.keys(item.stats).length, 0);
    }
});

test('embedded Windows index contains the same placed explosives', () => {
    const index = JSON.parse(read('crosshair-app/src/ar2-index.json'));
    const embedded = index.items.filter(item => item.type === 'explosive');
    const names = embedded.map(item => item.name);
    assert.ok(names.includes('C4'));
    assert.ok(names.includes('M18A1 Claymore'));
    assert.equal(new Set(embedded.map(item => item.id)).size, embedded.length);
});

test('site scripts and PWA assets referenced by the page exist', () => {
    const html = read('index.html');
    const scriptUrls = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
    for (const url of scriptUrls) {
        if (/^https?:\/\//i.test(url)) continue;
        const cleanUrl = url.split('?')[0];
        assert.ok(fs.existsSync(path.join(root, cleanUrl)), `Missing local script: ${url}`);
    }

    assert.ok(html.indexOf('<script src="site-data.js"></script>') < html.indexOf('const ALL_ITEMS'));
    assert.match(html, /href="manifest\.webmanifest"/);
    assert.match(html, /id="main-content"/);
    assert.match(html, /href="#main-content"/);

    const manifest = JSON.parse(read('manifest.webmanifest'));
    assert.equal(manifest.scope, './');
    assert.equal(manifest.start_url, './');
    for (const icon of manifest.icons) {
        assert.ok(fs.existsSync(path.join(root, icon.src)), `Missing PWA icon: ${icon.src}`);
    }
});

test('data snapshot metadata is dated, sourced, and explicit about estimates', () => {
    const meta = JSON.parse(read('data-version.json'));
    assert.equal(meta.schemaVersion, 1);
    assert.match(meta.revision, /^\d{4}\.\d{2}\.\d{2}$/);
    assert.match(meta.snapshotDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(meta.sources.length > 0);
    assert.ok(meta.sources.every(source => /^https:\/\//.test(source.url)));
    assert.match(meta.notice, /snapshot|estim/i);
});

test('service worker precache URLs resolve to existing site assets', () => {
    const worker = read('service-worker.js');
    const urls = [...worker.matchAll(/'(\.\/[^']+)'/g)].map(match => match[1]);
    assert.ok(urls.length > 0);
    for (const url of urls) {
        assert.ok(fs.existsSync(path.join(root, url.slice(2))), `Missing precached asset: ${url}`);
    }
});
