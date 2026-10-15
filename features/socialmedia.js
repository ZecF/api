const express = require('express');
const router = express.Router();
const { checkKey, isLimit, limitAdd } = require('../database/db');


// Middleware Validasi API Key & Limit
async function verifyApiKey(req, res, next) {
    const apikey = req.query.apikey;
    if (!apikey) {
        return res.status(400).json({ status: 400, message: 'Masukkan parameter apikey!' });
    }
    const check = await checkKey(apikey);
    if (!check) {
        return res.status(403).json({ status: 403, message: `API Key ${apikey} tidak ditemukan / invalid.` });
    }
    const limit = await isLimit(apikey);
    if (limit) {
        return res.status(429).json({ status: 429, message: 'Limit harian API Key kamu sudah habis!' });
    }
    req.apikey = apikey;
    next();
}

// Endpoint: GET /api/tiktok?url=...&apikey=...
router.get('/tiktok', verifyApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ status: 400, message: 'Masukkan parameter url!' });

    try {
        const result = await tiktok(url);
        await limitAdd(req.apikey); // Kurangi limit user -1 & tambah counter Requests Today +1
        res.status(200).json({
            status: 200,
            message: 'success',
            result: result
        });
    } catch (e) {
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
});

module.exports = router;
