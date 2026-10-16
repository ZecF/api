const express = require('express');
const router = express.Router();
const { limitAdd, getStats } = require('../database/db');
const { User } = require('../database/model');
const { runZaneScraper } = require('../lib/zaneLoader');

// 1. Endpoint Cek API Key & Auto-Sync Dashboard (Tanpa Potong Limit)
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

// 2. Middleware Global: Validasi API Key & Potong Limit (Free & Premium)
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

    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            try {
                await limitAdd(apikey);
            } catch (err) {
                console.error('Gagal mengurangi limit:', err);
            }
        }
    });

    next();
});

// 3. Daftar Lengkap 41 Scraper Murni dari Scraper-By-Zane-main
const zaneRoutes = [
    // Kategori 1: Downloader (13 Scraper)
    { path: '/downloader/aio', file: 'aio.js', param: 'url' },
    { path: '/downloader/capcut', file: 'capcutdl.js', param: 'url' },
    { path: '/downloader/facebook', file: 'facebookScraper.js', param: 'url' },
    { path: '/downloader/igexport', file: 'igexportScraper.js', param: 'url' },
    { path: '/downloader/instaloadr', file: 'instaloadrScraper.js', param: 'url' },
    { path: '/downloader/omdown', file: 'omdown.js', param: 'url' },
    { path: '/downloader/pinterest', file: 'pinterest.js', param: 'query' },
    { path: '/downloader/spotify', file: 'spotify.js', param: 'url' },
    { path: '/downloader/ttdlzone', file: 'ttdlzoneScraper.js', param: 'url' },
    { path: '/downloader/ytmp3', file: 'ytmp3.js', param: 'url' },
    { path: '/downloader/ytmp3gg', file: 'ytmp3gg.js', param: 'url' },
    { path: '/downloader/ytmp3pc', file: 'ytmp3pc.js', param: 'url' },
    { path: '/downloader/ytscrape', file: 'ytscrape.js', param: 'url' },

    // Kategori 2: Anime, Manga & Donghua (5 Scraper)
    { path: '/animanga/anichin', file: 'anichin.js', param: 'query' },
    { path: '/animanga/animein', file: 'animein.js', param: 'query' },
    { path: '/animanga/donghive', file: 'donghive.js', param: 'query' },
    { path: '/animanga/komikstation', file: 'komikstationScraper.js', param: 'query' },
    { path: '/animanga/mangadex', file: 'mangadex.js', param: 'query' },

    // Kategori 3: Alight Motion Preset, Searcher & Stalker (13 Scraper)
    { path: '/search/adam-am', file: 'adamAmPrem.js', param: 'query' },
    { path: '/search/amfinder', file: 'amfinder.js', param: 'query' },
    { path: '/search/ampremium', file: 'ampremium.js', param: 'query' },
    { path: '/search/noxx-am', file: 'noxxAmScraper.js', param: 'query' },
    { path: '/search/parx-am', file: 'parxAm.js', param: 'query' },
    { path: '/search/satria-am', file: 'satriaAm.js', param: 'query' },
    { path: '/search/vinz-am', file: 'vinzAm.js', param: 'query' },
    { path: '/search/chosic-spotify', file: 'chosicSpotify.js', param: 'query' },
    { path: '/search/soundboard', file: 'soundboardScraper.js', param: 'query' },
    { path: '/search/ttsearch', file: 'ttsearch.js', param: 'query' },
    { path: '/stalk/ff', file: 'ffStalkScraper.js', param: 'id' },
    { path: '/stalk/ig', file: 'igstalkScraper.js', param: 'username' },
    { path: '/stalk/tiktok', file: 'tikstalkScraper.js', param: 'username' },

    // Kategori 4: Creator, AI, Audio & Image Tools (7 Scraper)
    { path: '/creator/8daudio', file: '8daudio.js', param: 'url' },
    { path: '/creator/removevocal', file: 'removeVocal.js', param: 'url' },
    { path: '/creator/removebg', file: 'iloveimgRmBg.js', param: 'url' },
    { path: '/creator/upscale', file: 'iloveimgUpscale.js', param: 'url' },
    { path: '/creator/text2img', file: 'text2img.js', param: 'prompt' },
    { path: '/creator/naxachat', file: 'naxachat.js', param: 'text' },
    { path: '/creator/ssweb', file: 'sswebScraper.js', param: 'url' },

    // Kategori 5: Mail & Random Generator (3 Scraper)
    { path: '/tools/generatorgmail', file: 'generatorgmail.js', param: 'email', optional: true },
    { path: '/tools/tempmail', file: 'tempmail.js', param: 'email', optional: true },
    { path: '/tools/rannd', file: 'rannd.js', param: 'query', optional: true }
];

zaneRoutes.forEach(({ path, file, param, optional }) => {
    router.get(path, async (req, res) => {
        const val = req.query[param] || req.query.url || req.query.query || req.query.text || req.query.prompt || req.query.username || req.query.id || req.query.email || '';
        const action = req.query.action || null;

        if (!optional && !val) {
            return res.status(400).json({
                status: 400,
                creator: 'lolhumanapi',
                message: `Masukkan parameter ${param}!`
            });
        }

        try {
            const args = val ? [val] : [];
            const result = await runZaneScraper(file, args, action);
            res.status(200).json({
                status: 200,
                creator: 'lolhumanapi',
                result
            });
        } catch (err) {
            res.status(500).json({
                status: 500,
                creator: 'lolhumanapi',
                message: err.message || 'Terjadi kesalahan pada scraper.'
            });
        }
    });
});

module.exports = router;
