const express = require('express');
const router = express.Router();
const { runZaneScraper } = require('../lib/zaneLoader');

const downloaderEndpoints = [
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
    { path: '/downloader/ytscrape', file: 'ytscrape.js', param: 'url' }
];

downloaderEndpoints.forEach(({ path, file, param }) => {
    router.get(path, async (req, res) => {
        const val = req.query[param] || req.query.url || req.query.query;
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
                message: err.message || 'Gagal mengambil data dari scraper.'
            });
        }
    });
});

module.exports = router;
