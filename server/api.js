const express = require('express');
const router = express.Router();
const { checkKey } = require('../database/db');
const { User } = require('../database/model');

// Import ke-9 modul fitur dari folder features/
const animanga = require('../features/animanga');
const asupan = require('../features/asupan');
const berita = require('../features/berita');
const creator = require('../features/creator');
const nsfwsfw = require('../features/nsfwsfw');
const primbon = require('../features/primbon');
const searching = require('../features/searching');
const socialmedia = require('../features/socialmedia');
const textpro = require('../features/textpro');

// Endpoint Cek Status API Key: GET /api/cekey?apikey=...
router.get('/cekey', async (req, res) => {
    const apikey = req.query.apikey;
    if (!apikey) return res.status(400).json({ status: 400, message: 'Masukkan parameter apikey' });
    const user = await User.findOne({ apikey: apikey });
    if (!user) return res.status(403).json({ status: 403, message: 'API Key tidak ditemukan' });
    res.json({
        status: 200,
        message: 'success',
        result: {
            username: user.username,
            apikey: user.apikey,
            limit: user.limit,
            premium: user.premium ? true : false,
            total_requests: user.totalreq || 0
        }
    });
});

// Daftarkan semua sub-router fitur
router.use('/', animanga);
router.use('/', asupan);
router.use('/', berita);
router.use('/', creator);
router.use('/', nsfwsfw);
router.use('/', primbon);
router.use('/', searching);
router.use('/', socialmedia);
router.use('/', textpro);

module.exports = router;
