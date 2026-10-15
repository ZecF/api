const axios = require('axios');
const { checkKey, isLimit, limitAdd } = require('../database/db');

async function fetchJson(url, options) {
    try {
        options ? options : {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
}

async function getBuffer(url, options) {
    try {
        options ? options : {};
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Requests': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (e) {
        console.log(`Error : ${e}`);
    }
}

// Middleware pengecekan apikey & pemotongan limit otomatis
async function verifyKey(req, res, next) {
    const apikey = req.query.apikey;
    if (!apikey) return res.status(400).json({ status: 400, creator: 'lolhumanapi', message: 'Masukkan parameter apikey!' });
    const check = await checkKey(apikey);
    if (!check) return res.status(403).json({ status: 403, creator: 'lolhumanapi', message: 'API Key tidak valid!' });
    const limit = await isLimit(apikey);
    if (limit) return res.status(429).json({ status: 429, creator: 'lolhumanapi', message: 'Limit harian API Key telah habis!' });
    await limitAdd(apikey);
    next();
}

module.exports = { fetchJson, getBuffer, verifyKey };
