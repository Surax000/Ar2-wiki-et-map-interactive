const core = require('./crosshair-core.js');

function cleanName(value) {
    if (typeof value !== 'string') throw new Error('Le nom du profil doit être du texte.');
    const name = value.trim().slice(0, 40).trim();
    if (!name) throw new Error('Le nom du profil ne peut pas être vide.');
    return name;
}

function assertUniqueName(name, profiles, excludeIndex = -1) {
    const wanted = name.toLowerCase();
    if (profiles.some((profile, index) => index !== excludeIndex && String(profile.name || '').trim().toLowerCase() === wanted)) {
        throw new Error('Un profil porte déjà ce nom.');
    }
}

function uniqueName(value, profiles) {
    const base = cleanName(value);
    if (!profiles.some(profile => String(profile.name || '').trim().toLowerCase() === base.toLowerCase())) return base;
    for (let suffix = 2; suffix < 10000; suffix++) {
        const tail = ` (${suffix})`;
        const name = base.slice(0, 40 - tail.length).trimEnd() + tail;
        if (!profiles.some(profile => String(profile.name || '').trim().toLowerCase() === name.toLowerCase())) return name;
    }
    throw new Error('Impossible de créer un nom de profil unique.');
}

function cloneSettings(settings) {
    const source = settings == null ? {} : settings;
    if (typeof source !== 'object' || Array.isArray(source)) throw new Error('Les réglages du profil sont invalides.');
    const json = JSON.stringify(source);
    if (typeof json !== 'string') throw new Error('Les réglages du profil ne peuvent pas être enregistrés.');
    return core.withDefaults(JSON.parse(json));
}

function uniqueId(profiles, idFactory) {
    for (let attempt = 0; attempt < 100; attempt++) {
        const id = idFactory();
        if (typeof id === 'string' && id && !profiles.some(profile => profile.id === id)) return id;
    }
    throw new Error('Impossible de générer un identifiant de profil unique.');
}

function create(profiles, name, settings, idFactory) {
    const clean = cleanName(name);
    assertUniqueName(clean, profiles);
    const profile = { id: uniqueId(profiles, idFactory), name: clean, settings: cloneSettings(settings) };
    return { profiles: profiles.concat(profile), active: profiles.length };
}

function rename(profiles, index, name) {
    if (!Number.isInteger(index) || index < 0 || index >= profiles.length) throw new Error('Profil introuvable.');
    const clean = cleanName(name);
    assertUniqueName(clean, profiles, index);
    const next = profiles.slice();
    next[index] = { ...profiles[index], name: clean };
    return next;
}

function select(profiles, index) {
    if (!Number.isInteger(index) || index < 0 || index >= profiles.length) throw new Error('Profil introuvable.');
    return index;
}

function remove(profiles, active, index) {
    if (profiles.length <= 1) throw new Error('Le dernier profil ne peut pas être supprimé.');
    select(profiles, index);
    const next = profiles.filter((_, i) => i !== index);
    return {
        profiles: next,
        active: index < active ? active - 1 : Math.min(active, next.length - 1)
    };
}

function normalizeLoaded(profiles, idFactory) {
    if (!Array.isArray(profiles) || !profiles.length) return null;
    const normalized = [];
    profiles.forEach(profile => {
        if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Un profil enregistré est invalide.');
        const id = typeof profile.id === 'string' && profile.id && !normalized.some(item => item.id === profile.id)
            ? profile.id
            : uniqueId(normalized, idFactory);
        normalized.push({
            ...profile,
            id,
            settings: cloneSettings(profile.settings)
        });
    });
    return normalized;
}

function importProfiles(source, existingProfiles, { preserveIds = false, idFactory } = {}) {
    if (!Array.isArray(source) || !source.length) throw new Error('La sauvegarde ne contient aucun profil.');
    const reservedNames = existingProfiles.slice();
    const reservedIds = preserveIds ? [] : existingProfiles.slice();
    const sourceIds = new Set();
    const idMap = {};
    const profiles = source.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Un profil importé est invalide.');
        const name = uniqueName(typeof item.name === 'undefined' || item.name === null ? 'Profil' : item.name, reservedNames);
        const sourceId = typeof item.id === 'string' && item.id ? item.id : null;
        if (sourceId && sourceIds.has(sourceId)) throw new Error('La sauvegarde contient des identifiants de profil en double.');
        if (sourceId) sourceIds.add(sourceId);
        let settings = item.settings;
        if (settings == null && item.code) settings = core.fromCode(item.code);
        const id = preserveIds && sourceId && !reservedIds.some(profile => profile.id === sourceId)
            ? sourceId
            : uniqueId(reservedIds, idFactory);
        const profile = { id, name, settings: cloneSettings(settings) };
        reservedNames.push(profile);
        reservedIds.push(profile);
        if (sourceId) idMap[sourceId] = id;
        return profile;
    });
    return { profiles, idMap };
}

function exportProfiles(profiles) {
    return profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        settings: cloneSettings(profile.settings),
        code: core.toCode(profile.settings)
    }));
}

module.exports = { cleanName, uniqueName, cloneSettings, create, rename, select, remove, normalizeLoaded, importProfiles, exportProfiles };
