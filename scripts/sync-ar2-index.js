const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'crosshair-app', 'src', 'ar2-index.json');
const sourcePath = path.join(root, 'site-data.js');

const context = {};
vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8') + '\nglobalThis.catalog = { WEAPONS_DATA, EXPLOSIVES_DATA };', context);
const explosives = context.catalog.EXPLOSIVES_DATA;
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const explosiveIds = new Set(explosives.map(item => item.id));
index.items = (index.items || []).filter(item => !explosiveIds.has(item.id));
for (const item of explosives) {
    index.items.push({
        id: item.id,
        name: item.name,
        englishName: item.englishName,
        type: 'explosive',
        cat: item.category,
        subcat: item.subcategory,
        kind: item.kind,
        trigger: item.trigger,
        alias: item.aliases || [],
        rarity: item.rarity || 'Inconnue',
        availability: item.availability,
        status: item.status,
        associated: item.associated || [],
        stats: item.stats || {},
        image: item.image || null,
        loot: item.loot || 'Aucune localisation inventée',
        availableMaps: item.availableMaps || [],
        desc: item.description,
        source: item.source,
        verifiedAt: item.verifiedAt,
        loot: 'Aucune localisation inventée',
        spawn: []
    });
}
index.format = 1;
index.generated = new Date().toISOString();
if (!index.imgBase) index.imgBase = 'https://surax000.github.io/Ar2-wiki-et-map-interactive/img/items/';

fs.writeFileSync(indexPath, JSON.stringify(index));
console.log(`Synchronisé: ${explosives.length} explosifs dans ${path.relative(root, indexPath)}`);
