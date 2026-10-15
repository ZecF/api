const express = require('express');
const router = express.Router();
const { verifyKey } = require('../lib/function');

router.get('/berita/kompas', verifyKey, async (req, res) => {
    try {
        const result = await scraper.kompasNews();
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/berita/cnn', verifyKey, async (req, res) => {
    try {
        const result = await scraper.cnnNews();
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
