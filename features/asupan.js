const express = require('express');
const router = express.Router();
const { verifyKey } = require('../lib/function');


router.get('/asupan/random', verifyKey, async (req, res) => {
    try {
        const result = await random.asupan();
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

router.get('/asupan/cecan', verifyKey, async (req, res) => {
    try {
        const result = await random.cecan();
        res.json({ status: 200, creator: 'lolhumanapi', result });
    } catch (e) {
        res.status(500).json({ status: 500, message: e.message });
    }
});

module.exports = router;
