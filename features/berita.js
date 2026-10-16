const express = require('express');
const router = express.Router();
const { runZaneScraper } = require('../lib/zaneLoader');

// Generator Dot/Alias Gmail
router.get('/tools/generatorgmail', async (req, res) => {
    const email = req.query.email || 'example@gmail.com';
    try {
        const result = await runZaneScraper('generatorgmail.js', [email], req.query.action);
        res.status(200).json({ status: 200, creator: 'lolhumanapi', result });
    } catch (err) {
        res.status(500).json({ status: 500, creator: 'lolhumanapi', message: err.message });
    }
});

// TempMail (Create / Check Inbox)
router.get('/tools/tempmail', async (req, res) => {
    const email = req.query.email || '';
    const action = req.query.action || null;
    try {
        const result = await runZaneScraper('tempmail.js', email ? [email] : [], action);
        res.status(200).json({ status: 200, creator: 'lolhumanapi', result });
    } catch (err) {
        res.status(500).json({ status: 500, creator: 'lolhumanapi', message: err.message });
    }
});

// Rannd Utility / Random Generator
router.get('/tools/rannd', async (req, res) => {
    const query = req.query.query || '';
    try {
        const result = await runZaneScraper('rannd.js', query ? [query] : [], req.query.action);
        res.status(200).json({ status: 200, creator: 'lolhumanapi', result });
    } catch (err) {
        res.status(500).json({ status: 500, creator: 'lolhumanapi', message: err.message });
    }
});

module.exports = router;
