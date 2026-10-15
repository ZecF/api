const express = require('express');
const router = express.Router();
const { checkUsername, resetAllLimit } = require('../database/db');
const { addPremium, deletePremium, checkPremium, changeKey, resetOneLimit, getTotalUser } = require('../database/premium');
const { isAuthenticated } = require('../lib/auth');
const { tokens } = require('../lib/settings');

// Halaman Utama Admin Panel
router.get('/', isAuthenticated, (req, res) => {
    res.render('admin/index', { layout: false });
});

// Halaman Daftar Semua User
router.get('/listuser', isAuthenticated, async (req, res) => {
    let List = await getTotalUser();
    res.render('admin/listuser', {
        List,
        layout: false
    });
});

// Tambah User Premium
router.post('/add', isAuthenticated, async (req, res) => {
    let { username, expired, customKey, token } = req.body;
    if (token !== tokens) {
        req.flash('error_msg', 'Token Admin salah!');
        return res.redirect('/premium');
    }
    let checking = await checkUsername(username);
    if (!checking) {
        req.flash('error_msg', 'Username tidak ditemukan di database!');
        return res.redirect('/premium');
    }
    let checkPrem = await checkPremium(username);
    if (checkPrem) {
        req.flash('error_msg', 'User tersebut sudah berstatus Premium!');
        return res.redirect('/premium');
    }
    await addPremium(username, customKey, expired);
    req.flash('success_msg', `Berhasil meng-upgrade ${username} ke Premium selama ${expired}!`);
    res.redirect('/premium');
});

// Hapus User Premium
router.post('/delete', isAuthenticated, async (req, res) => {
    let { username, token } = req.body;
    if (token !== tokens) {
        req.flash('error_msg', 'Token Admin salah!');
        return res.redirect('/premium');
    }
    let checking = await checkUsername(username);
    if (!checking) {
        req.flash('error_msg', 'Username tidak ditemukan!');
        return res.redirect('/premium');
    }
    await deletePremium(username);
    req.flash('success_msg', `Status Premium ${username} berhasil dicabut.`);
    res.redirect('/premium');
});

// Ganti Custom API Key (Khusus VIP/Premium dari halaman Profile)
router.post('/custom', isAuthenticated, async (req, res) => {
    let { customKey } = req.body;
    let { username } = req.user;
    let checkPrem = await checkPremium(username);
    if (!checkPrem) {
        req.flash('error_msg', 'Fitur Custom API Key hanya untuk member Premium/VIP!');
        return res.redirect('/profile');
    }
    await changeKey(username, customKey);
    req.flash('success_msg', `API Key berhasil diubah menjadi: ${customKey}`);
    res.redirect('/profile');
});

// Reset Limit 1 User
router.post('/limit', isAuthenticated, async (req, res) => {
    let { username, token } = req.body;
    if (token !== tokens) {
        req.flash('error_msg', 'Token Admin salah!');
        return res.redirect('/premium');
    }
    await resetOneLimit(username);
    req.flash('success_msg', `Limit untuk ${username} berhasil di-reset.`);
    res.redirect('/premium');
});

// Reset Semua Limit User
router.post('/resetall', isAuthenticated, async (req, res) => {
    let { token } = req.body;
    if (token !== tokens) {
        req.flash('error_msg', 'Token Admin salah!');
        return res.redirect('/premium');
    }
    await resetAllLimit();
    req.flash('success_msg', 'Seluruh limit user Free & Premium berhasil di-reset!');
    res.redirect('/premium');
});

module.exports = router;
