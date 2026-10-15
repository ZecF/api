const express = require('express');
const router = express.Router();
const { verifyKey } = require('../lib/function');

// Mapping gaya populer TextPro.me
const styles = {
    blackpink: 'https://textpro.me/create-blackpink-logo-style-online-1001.html',
    neon: 'https://textpro.me/create-3d-neon-light-text-effect-online-1028.html',
    glitch: 'https://textpro.me/create-impressive-glitch-text-effects-online-1027.html',
    thunder: 'https://textpro.me/online-thunder-text-effect-generator-1031.html'
};

router.get('/textpro/:style', verifyKey, async (req, res) => {
    const style = req.params.style.toLowerCase();
    const text = req.query.text;
    if (!text) return res.status(400).json({ status: 400, message: 'Masukkan parameter text!' });
    if (!styles[style]) return res.status(404).json({ status: 404, message: 'Style TextPro tidak ditemukan!' });

    try {
        const result = await textmaker.textpro(styles[style], [text]);
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
