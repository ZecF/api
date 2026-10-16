const fs = require('fs');
const path = require('path');
const Module = require('module');

const moduleCache = new Map();

function sanitizeToCommonJS(rawCode) {
    let code = rawCode.replace(/\r\n/g, '\n');
    let exportedNames = [];
    let defaultExport = null;

    // 1. Konversi semua variasi ESM import menjadi CommonJS require()
    code = code.replace(/^\s*import\s+([A-Za-z0-9_$]+)\s*,\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm, (_, def, named, pkg) => {
        return `const ${def} = require('${pkg}');\nconst { ${named.replace(/\s+as\s+/g, ': ')} } = require('${pkg}');`;
    });
    code = code.replace(/^\s*import\s+\*\s+as\s+([A-Za-z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?/gm, "const $1 = require('$2');");
    code = code.replace(/^\s*import\s+\{([^}]+)\}\s+from\s*['"]([^'"]+)['"]\s*;?/gm, (_, named, pkg) => {
        return `const { ${named.replace(/\s+as\s+/g, ': ')} } = require('${pkg}');`;
    });
    code = code.replace(/^\s*import\s+([A-Za-z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?/gm, "const $1 = require('$2');");
    code = code.replace(/^\s*import\s+['"]([^'"]+)['"]\s*;?/gm, "require('$1');");

    // 2. Konversi semua variasi ESM export menjadi CommonJS
    code = code.replace(/^\s*export\s+default\s+(async\s+function|function|class)\s+([A-Za-z0-9_$]+)/gm, (_, type, name) => {
        defaultExport = name;
        return `${type}${name}`;
    });
    code = code.replace(/^\s*export\s+default\s+/gm, 'module.exports = ');
    code = code.replace(/^\s*export\s+(async\s+function|function|class|const|let|var)\s+([A-Za-z0-9_$]+)/gm, (_, type, name) => {
        exportedNames.push(name);
        return `${type}${name}`;
    });
    code = code.replace(/^\s*export\s+\{([^}]+)\}\s*;?/gm, (_, names) => {
        const clean = names.split(',').map(s => s.trim().replace(/\s+as\s+/, ': ')).join(', ');
        return `module.exports = { ${clean} };`;
    });

    // 3. Kelompokkan kode per blok Top-Level untuk membuang Top-Level Await & kode testing
    const lines = code.split('\n');
    const chunks = [];
    let currentChunk = [];
    let depth = 0;

    function countDelta(line) {
        // Abaikan kurung di dalam string atau komentar satu baris
        const stripped = line
            .replace(/\/\/.*$/, '')
            .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '');
        let d = 0;
        for (const ch of stripped) {
            if (ch === '{' || ch === '(' || ch === '[') d++;
            else if (ch === '}' || ch === ')' || ch === ']') d--;
        }
        return d;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Gabungkan blok catch / finally atau .then / .catch ke chunk sebelumnya
        if (
            depth === 0 &&
            currentChunk.length > 0 &&
            !/^(catch|finally|\.|else)\b/.test(trimmed)
        ) {
            chunks.push(currentChunk.join('\n'));
            currentChunk = [];
        }

        currentChunk.push(line);
        depth += countDelta(line);
        if (depth < 0) depth = 0;
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
    }

    // 4. Filter chunk: hapus blok testing yang mengandung top-level await, try-catch luar, IIFE, atau console.log
    const keptChunks = chunks.filter(chunk => {
        const t = chunk.trim();
        if (!t) return false;

        // Buang komentar murni
        if (/^\/\/|^\/\*[\s\S]*\*\/$/.test(t)) return false;

        // Buang top-level try/catch, console.log, atau IIFE testing: (async () => { ... })()
        if (/^(try\b|console\.|;?\s*\(\s*async\b|;?\s*\(\s*function\b|!\s*\(\s*async\b)/.test(t)) {
            return false;
        }

        // Buang deklarasi variabel / ekspresi di level luar yang memakai 'await' tanpa 'async'
        if (/\bawait\b/.test(t) && !/\basync\b/.test(t)) {
            return false;
        }

        // Buang pemanggilan fungsi testing langsung di level luar (contoh: omdown('https://...').then(...))
        if (/^[A-Za-z0-9_$]+\s*\(/.test(t) && !/^(function|async|class|require|if|for|while|switch)\b/.test(t)) {
            return false;
        }

        return true;
    });

    code = keptChunks.join('\n\n');

    // 5. Pastikan module.exports tersedia di akhir file
    if (!/module\.exports|\bexports\./.test(code)) {
        if (defaultExport) {
            code += `\n\nmodule.exports = ${defaultExport};\n`;
        } else if (exportedNames.length === 1) {
            code += `\n\nmodule.exports = ${exportedNames[0]};\n`;
        } else if (exportedNames.length > 1) {
            code += `\n\nmodule.exports = { ${exportedNames.join(', ')} };\n`;
        } else {
            const detected = [];
            const fnRegex = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^class\s+([A-Za-z0-9_$]+)\vert{}^(?:const\vert{}let\vert{}var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\b|\(|function\b|new\b|\{)/gm;
            let match;
            const ignore = ['axios', 'cheerio', 'crypto', 'fs', 'path', 'FormData', 'https', 'http', 'url'];
            while ((match = fnRegex.exec(code)) !== null) {
                const name = match[1] || match[2] || match[3];
                if (name && !ignore.includes(name) && !detected.includes(name)) {
                    detected.push(name);
                }
            }
            if (detected.length === 1) {
                code += `\n\nmodule.exports = ${detected[0]};\n`;
            } else if (detected.length > 1) {
                code += `\n\nmodule.exports = { ${detected.join(', ')} };\n`;
            }
        }
    }

    return code;
}

function loadScraperModule(fileName) {
    if (moduleCache.has(fileName)) {
        return moduleCache.get(fileName);
    }

    const filePath = path.join(__dirname, 'zane', fileName);
    const rawCode = fs.readFileSync(filePath, 'utf8');
    const cjsCode = sanitizeToCommonJS(rawCode);

    const tempModule = new Module(filePath, module.parent);
    tempModule.filename = filePath;
    tempModule.paths = Module._nodeModulePaths(path.dirname(filePath));

    // Shim agar jika ada scraper yang memanggil require('node-fetch') tidak terkena error ESM di Heroku
    const originalRequire = tempModule.require.bind(tempModule);
    tempModule.require = function (id) {
        if (id === 'node-fetch') {
            const fetchFn = (...args) => global.fetch(...args);
            fetchFn.default = fetchFn;
            return fetchFn;
        }
        return originalRequire(id);
    };

    tempModule._compile(cjsCode, filePath);
    moduleCache.set(fileName, tempModule.exports);
    return tempModule.exports;
}

async function runZaneScraper(fileName, args = [], methodName = null) {
    const mod = loadScraperModule(fileName);

    if (typeof mod === 'function') {
        try {
            return await mod(...args);
        } catch (err) {
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

    throw new Error(`Scraper ${fileName} tidak memiliki fungsi yang dapat dieksekusi.`);
}

module.exports = { runZaneScraper };
