const express = require('express');
const router = express.Router();
const { User } = require('../database/model');

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        await User.updateOne({ _id: userId }, { $set: { verified: true } });
        req.flash('success_msg', 'Email berhasil diverifikasi! Silakan login.');
        res.redirect('/users/login');
    } catch (e) {
        req.flash('error_msg', 'Link verifikasi tidak valid atau sudah kedaluwarsa.');
        res.redirect('/users/login');
    }
});

module.exports = router;
