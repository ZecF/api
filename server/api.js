const express = require('express');
const router = express.Router();
const { limitAdd, getStats } = require('../database/db');
const { User } = require('../database/model');

const animanga = require('../features/animanga');
const asupan = require('../features/asupan');
const berita = require('../features/berita');
const creator = require('../features/creator');
const nsfwsfw = require('../features/nsfwsfw');
const primbon = require('../features/primbon');
const searching = require('../features/searching');
const socialmedia = require('../features/socialmedia');
const textpro = require('../features/textpro');

// Endpoint Cek Status API Key & Sinkronisasi Real-Time Dashboard (Tanpa Potong Limit)
router.get('/cekey', async (req, res) => {
    const apikey = req.query.apikey;
    if (!apikey) return res.status(400).json({ status: 400, message: 'Masukkan parameter apikey' });
    const user = await User.findOne({ apikey: apikey });
    if (!user) return res.status(403).json({ status: 403, message: 'API Key tidak ditemukan' });
    const stats = await getStats();
    const totalUsers = await User.countDocuments();

    res.json({
        status: 200,
        message: 'success',
        result: {
            username: user.username,
            apikey: user.apikey,
            limit: user.limit,
            premium: user.premium ? true : false,
            total_requests: user.totalreq || 0,
            stats: {
                visitor: stats.visitor.toLocaleString('en-US'),
                totalUsers: totalUsers.toLocaleString('en-US'),
                totalRequests: stats.totalRequests.toLocaleString('en-US'),
                requestsToday: stats.requestsToday.toLocaleString('en-US')
            }
        }
    });
});

// Middleware Global: Otomatis Cek & Kurangi Limit di SEMUA Endpoint /api/*
router.use(async (req, res, next) => {
    if (req.path === '/cekey' || req.path === '/cekkey') return next();

    const apikey = req.query.apikey || req.query.key;
    if (!apikey) {
        return res.status(400).json({
            status: 400,
            creator: 'lolhumanapi',
            message: 'Masukkan parameter apikey!'
        });
    }

    const user = await User.findOne({ apikey: apikey });
    if (!user) {
        return res.status(403).json({
            status: 403,
            creator: 'lolhumanapi',
            message: `API Key ${apikey} tidak ditemukan!`
        });
    }

    if (Number(user.limit) <= 0) {
        return res.status(429).json({
            status: 429,
            creator: 'lolhumanapi',
            message: 'Limit harian API Key kamu sudah habis!'
        });
    }

    const limitAwal = Number(user.limit);

    // Begitu API selesai merespons, pastikan limit berkurang 1 (tanpa dobel potong)
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            try {
                const cekUlang = await User.findOne({ apikey: apikey });
                if (cekUlang && Number(cekUlang.limit) === limitAwal) {
                    await limitAdd(apikey);
                }
            } catch (err) {
                console.error('Error auto-deduct limit:', err);
            }
        }
    });

    next();
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
