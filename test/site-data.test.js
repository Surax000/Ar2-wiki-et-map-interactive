const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const datasetNames = ['WEAPONS_DATA', 'HEAL_ITEMS_DATA', 'ATTACHMENTS_DATA', 'BACKPACKS_DATA', 'FOOD_DATA'];
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

test('site scripts and PWA assets referenced by the page exist', () => {
    const html = read('index.html');
    const scriptUrls = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
    for (const url of scriptUrls) {
        if (/^https?:\/\//i.test(url)) continue;
        assert.ok(fs.existsSync(path.join(root, url)), `Missing local script: ${url}`);
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
