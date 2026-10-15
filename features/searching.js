const express = require('express');
const router = express.Router();
const { verifyKey } = require('../lib/function');


router.get('/search/sfile', verifyKey, async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ status: 400, message: 'Masukkan parameter query!' });
    try {
        const result = await sfile.search(query);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/search/apkpure', verifyKey, async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ status: 400, message: 'Masukkan parameter query!' });
    try {
        const result = await apkpure(query);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/stalk/ig', verifyKey, async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ status: 400, message: 'Masukkan parameter username!' });
    try {
        const result = await igstalk(username);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
