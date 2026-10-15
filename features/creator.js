const express = require('express');
const router = express.Router();
const { verifyKey } = require('../lib/function');

router.get('/creator/unblur', verifyKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ status: 400, message: 'Masukkan parameter url gambar!' });
    try {
        const result = await unblur(url);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/photofunia/snow', verifyKey, async (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).json({ status: 400, message: 'Masukkan parameter text!' });
    try {
        const result = await photofunia.snow(text);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
