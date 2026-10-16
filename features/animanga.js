const express = require('express');
const router = express.Router();
const { runZaneScraper } = require('../lib/zaneLoader');

const animangaEndpoints = [
    { path: '/animanga/anichin', file: 'anichin.js', param: 'query' },
    { path: '/animanga/animein', file: 'animein.js', param: 'query' },
    { path: '/animanga/donghive', file: 'donghive.js', param: 'query' },
    { path: '/animanga/komikstation', file: 'komikstationScraper.js', param: 'query' },
    { path: '/animanga/mangadex', file: 'mangadex.js', param: 'query' }
];

animangaEndpoints.forEach(({ path, file, param }) => {
    router.get(path, async (req, res) => {
        const val = req.query[param] || req.query.url || req.query.query || '';
        const action = req.query.action || null;
        if (!val) {
            return res.status(400).json({
                status: 400,
                creator: 'lolhumanapi',
                message: `Masukkan parameter ${param} (kata kunci atau URL)!`
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
