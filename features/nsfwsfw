const express = require('express');
const router = express.Router();
const { verifyKey, fetchJson } = require('../lib/function');

router.get('/random/waifu', verifyKey, async (req, res) => {
    try {
        const data = await fetchJson('https://api.waifu.pics/sfw/waifu');
        res.json({ status: 200, creator: 'lolhumanapi', result: data.url });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/random/neko', verifyKey, async (req, res) => {
    try {
        const data = await fetchJson('https://api.waifu.pics/sfw/neko');
        res.json({ status: 200, creator: 'lolhumanapi', result: data.url });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
