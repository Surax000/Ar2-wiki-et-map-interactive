const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJsonAtomically(file, value) {
    const directory = path.dirname(file);
    fs.mkdirSync(directory, { recursive: true });
    const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`);
    const data = JSON.stringify(value, null, 2);
    let descriptor;
    try {
        descriptor = fs.openSync(temporary, 'wx', 0o600);
        fs.writeFileSync(descriptor, data, 'utf8');
        fs.fsyncSync(descriptor);
        fs.closeSync(descriptor);
        descriptor = undefined;
        fs.renameSync(temporary, file);
    } catch (error) {
        if (descriptor !== undefined) {
            try { fs.closeSync(descriptor); } catch (closeError) { console.error('Impossible de fermer le fichier temporaire de configuration:', closeError); }
        }
        error.configTempPath = temporary;
        throw error;
    }
}

module.exports = { readJson, writeJsonAtomically };
