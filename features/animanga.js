const express = require('express');
const router = express.Router();
const { verifyKey } = require('../lib/function');

router.get('/anime/kusonime', verifyKey, async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ status: 400, message: 'Masukkan parameter query!' });
    try {
        const result = await scraper.kusonime(query);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/anime/otakudesu', verifyKey, async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ status: 400, message: 'Masukkan parameter query!' });
    try {
        const result = await scraper.otakudesu(query);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
