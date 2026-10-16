const express = require('express');
const router = express.Router();
const { runZaneScraper } = require('../lib/zaneLoader');

const searchEndpoints = [
    // Alight Motion Preset Scrapers
    { path: '/search/adam-am', file: 'adamAmPrem.js', param: 'query' },
    { path: '/search/amfinder', file: 'amfinder.js', param: 'query' },
    { path: '/search/ampremium', file: 'ampremium.js', param: 'query' },
    { path: '/search/noxx-am', file: 'noxxAmScraper.js', param: 'query' },
    { path: '/search/parx-am', file: 'parxAm.js', param: 'query' },
    { path: '/search/satria-am', file: 'satriaAm.js', param: 'query' },
    { path: '/search/vinz-am', file: 'vinzAm.js', param: 'query' },
    // Music, Soundboard & TikTok Search
    { path: '/search/chosic-spotify', file: 'chosicSpotify.js', param: 'query' },
    { path: '/search/soundboard', file: 'soundboardScraper.js', param: 'query' },
    { path: '/search/ttsearch', file: 'ttsearch.js', param: 'query' },
    // Stalkers
    { path: '/stalk/ff', file: 'ffStalkScraper.js', param: 'id' },
    { path: '/stalk/ig', file: 'igstalkScraper.js', param: 'username' },
    { path: '/stalk/tiktok', file: 'tikstalkScraper.js', param: 'username' }
];

searchEndpoints.forEach(({ path, file, param }) => {
    router.get(path, async (req, res) => {
        const val = req.query[param] || req.query.query || req.query.url || req.query.username || req.query.id;
        const action = req.query.action || null;
        if (!val) {
            return res.status(400).json({
                status: 400,
                creator: 'lolhumanapi',
                message: `Masukkan parameter ${param}!`
            });
        }
        try {
            const result = await runZaneScraper(file, [val], action);
            res.status(200).json({
                status: 200,
                creator: 'lolhumanapi',
                result
            });
        } catch (err) {
            res.status(500).json({
                status: 500,
                creator: 'lolhumanapi',
                message: err.message
            });
        }
    });
});

module.exports = router;
