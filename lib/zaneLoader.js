const path = require('path');

/**
 * Universal Loader untuk mengeksekusi scraper dari folder lib/zane/
 * @param {string} fileName - Nama file di lib/zane/ (contoh: 'capcutdl.js')
 * @param {Array} args - Parameter yang dikirim ke fungsi scraper
 * @param {string} [methodName] - Nama sub-fungsi spesifik jika file mengekspor banyak fungsi
 */
async function runZaneScraper(fileName, args = [], methodName = null) {
    const filePath = path.join(__dirname, 'zane', fileName);
    const mod = require(filePath);

    // 1. Jika file langsung mengekspor fungsi: module.exports = async function(...)
    if (typeof mod === 'function') {
        try {
            return await mod(...args);
        } catch (err) {
            // Jika ternyata berupa Class yang butuh 'new'
            if (/Class constructor/i.test(err.message)) {
                const instance = new mod();
                const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
                    .filter(m => m !== 'constructor' && typeof instance[m] === 'function');
                if (methodName && typeof instance[methodName] === 'function') {
                    return await instance[methodName](...args);
                }
                if (methods.length > 0) {
                    return await instance[methods[0]](...args);
                }
            }
            throw err;
        }
    }

    // 2. Jika file mengekspor Object: module.exports = { fn1, fn2, default }
    if (mod && typeof mod === 'object') {
        if (methodName && typeof mod[methodName] === 'function') {
            return await mod[methodName](...args);
        }
        if (typeof mod.default === 'function') {
            return await mod.default(...args);
        }

        const keys = Object.keys(mod).filter(k => typeof mod[k] === 'function');
        if (keys.length === 1) {
            return await mod[keys[0]](...args);
        }

        // Jika mengekspor lebih dari 1 fungsi (misal search & download) dan user tidak memilih action
        if (keys.length > 1) {
            const input = args[0] || '';
            const isUrl = /^https?:\/\//i.test(input);
            if (isUrl) {
                const dlKey = keys.find(k => /dl|download|detail|get|fetch|url/i.test(k));
                if (dlKey) return await mod[dlKey](...args);
            } else {
                const searchKey = keys.find(k => /search|find|query|stalk|list/i.test(k));
                if (searchKey) return await mod[searchKey](...args);
            }
            return await mod[keys[0]](...args);
        }
    }

    throw new Error(`Scraper ${fileName} tidak memiliki fungsi yang dapat dijalankan.`);
}

module.exports = { runZaneScraper };
