const express = require('express');
const router = express.Router();
const { verifyKey } = require('../lib/function');
const scraper2 = require('../lib/scraper2');

router.get('/primbon/artinama', verifyKey, async (req, res) => {
    const nama = req.query.nama;
    if (!nama) return res.status(400).json({ status: 400, message: 'Masukkan parameter nama!' });
    try {
        const result = await scraper2.artiNama(nama);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/primbon/jodoh', verifyKey, async (req, res) => {
    const { nama1, nama2 } = req.query;
    if (!nama1 || !nama2) return res.status(400).json({ status: 400, message: 'Masukkan parameter nama1 & nama2!' });
    try {
        const result = await scraper2.ramalJodoh(nama1, nama2);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
