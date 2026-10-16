const fs = require('fs');
const path = require('path');

const zaneDir = path.join(__dirname, 'lib', 'zane');

function convertFileToCommonJS(code) {
    let exportedNames = [];
    let defaultExport = null;

    // 1. Ubah sintaks ESM import menjadi CommonJS require()
    // import a, { b, c } from 'pkg'
    code = code.replace(/^\s*import\s+([A-Za-z0-9_$]+)\s*,\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm, (_, def, named, pkg) => {
        const cleanNamed = named.replace(/\s+as\s+/g, ': ');
        return `const ${def} = require('${pkg}');\nconst { ${cleanNamed} } = require('${pkg}');`;
    });

    // import * as name from 'pkg'
    code = code.replace(/^\s*import\s+\*\s+as\s+([A-Za-z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?/gm, "const $1 = require('$2');");

    // import { a, b as c } from 'pkg'
    code = code.replace(/^\s*import\s+\{([^}]+)\}\s+from\s*['"]([^'"]+)['"]\s*;?/gm, (_, named, pkg) => {
        const cleanNamed = named.replace(/\s+as\s+/g, ': ');
        return `const { ${cleanNamed} } = require('${pkg}');`;
    });

    // import name from 'pkg'
    code = code.replace(/^\s*import\s+([A-Za-z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?/gm, "const $1 = require('$2');");

    // import 'pkg'
    code = code.replace(/^\s*import\s+['"]([^'"]+)['"]\s*;?/gm, "require('$1');");

    // 2. Ubah sintaks ESM export menjadi CommonJS
    // export default async function / function / class
    code = code.replace(/^\s*export\s+default\s+(async\s+function|function|class)\s+([A-Za-z0-9_$]+)/gm, (_, type, name) => {
        defaultExport = name;
        return `${type} ${name}`;
    });

    // export default (anonymous / expression)
    code = code.replace(/^\s*export\s+default\s+/gm, 'module.exports = ');

    // export async function / function / class / const / let / var
    code = code.replace(/^\s*export\s+(async\s+function|function|class|const|let|var)\s+([A-Za-z0-9_$]+)/gm, (_, type, name) => {
        exportedNames.push(name);
        return `${type} ${name}`;
    });

    // export { a, b }
    code = code.replace(/^\s*export\s+\{([^}]+)\}\s*;?/gm, (_, names) => {
        const clean = names.split(',').map(s => s.trim().replace(/\s+as\s+/, ': ')).join(', ');
        return `module.exports = { ${clean} };`;
    });

    // 3. Bersihkan Top-Level Await & Kode Testing di Luar Fungsi (Brace Depth = 0)
    const lines = code.split('\n');
    const cleanedLines = [];
    let braceDepth = 0;
    let skipBlock = false;
    let skipDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Hitung kurung kurawal di luar string sederhana
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;

        if (skipBlock) {
            skipDepth += openBraces - closeBraces;
            if (skipDepth <= 0) {
                skipBlock = false;
            }
            continue;
        }

        // Jika di level paling luar (depth 0), abaikan IIFE testing: (async () => { ... })()
        if (braceDepth === 0 && /^(\(?\s*async\b|\(\s*function\b)/.test(trimmed) && !trimmed.startsWith('async function')) {
            skipBlock = true;
            skipDepth = openBraces - closeBraces;
            if (skipDepth <= 0) skipBlock = false;
            continue;
        }

        // Jika di level paling luar (depth 0), abaikan baris testing yang memakai top-level await atau console.log
        if (braceDepth === 0 && (/\bawait\b/.test(trimmed) || /^console\.(log|error|dir)\b/.test(trimmed))) {
            if (openBraces > closeBraces) {
                skipBlock = true;
                skipDepth = openBraces - closeBraces;
            }
            continue;
        }

        cleanedLines.push(line);
        braceDepth += openBraces - closeBraces;
        if (braceDepth < 0) braceDepth = 0;
    }

    code = cleanedLines.join('\n');

    // 4. Pastikan file memiliki module.exports di bagian akhir
    if (!/module\.exports|\bexports\./.test(code)) {
        if (defaultExport) {
            code += `\n\nmodule.exports = ${defaultExport};\n`;
        } else if (exportedNames.length === 1) {
            code += `\n\nmodule.exports = ${exportedNames[0]};\n`;
        } else if (exportedNames.length > 1) {
            code += `\n\nmodule.exports = { ${exportedNames.join(', ')} };\n`;
        } else {
            // Deteksi otomatis nama function / class / object utama di dalam file
            const detected = [];
            const fnRegex = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^class\s+([A-Za-z0-9_$]+)\vert{}^(?:const\vert{}let\vert{}var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\b|\(|function\b|new\b|\{)/gm;
            let match;
            const ignoreList = ['axios', 'cheerio', 'crypto', 'fs', 'path', 'FormData', 'https', 'http', 'url'];
            while ((match = fnRegex.exec(code)) !== null) {
                const name = match[1] || match[2] || match[3];
                if (name && !ignoreList.includes(name) && !detected.includes(name)) {
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

const files = fs.readdirSync(zaneDir).filter(f => f.endsWith('.js'));
files.forEach(file => {
    const fullPath = path.join(zaneDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const converted = convertFileToCommonJS(raw);
    fs.writeFileSync(fullPath, converted, 'utf8');
    console.log(`✅ Berhasil dikonversi ke CommonJS: ${file}`);
});

console.log(`\n🎉 Selesai! Total ${files.length} file scraper di lib/zane/ sudah menjadi CommonJS.`);
