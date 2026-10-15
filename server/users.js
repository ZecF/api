const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');

const { addUser, checkUsername, checkEmail } = require('../database/db');
const { User } = require('../database/model');
const { notAuthenticated, isAuthenticated } = require('../lib/auth');

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    return sha256.update(password).digest('base64');
};

const randomText = (len) => {
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
};

// GET Login
router.get('/login', notAuthenticated, (req, res) => {
    res.render('login', { layout: false });
});

// POST Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/docs',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// GET Register
router.get('/register', notAuthenticated, (req, res) => {
    res.render('register', { layout: false });
});

// POST Register
router.post('/register', async (req, res) => {
    try {
        let { username, email, password, confirmPassword } = req.body;
        if (!username || !email || !password || !confirmPassword) {
            req.flash('error_msg', 'Semua kolom wajib diisi!');
            return res.redirect('/users/register');
        }
        if (password.length < 6 || confirmPassword < 6) {
            req.flash('error_msg', 'Password minimal 6 karakter!');
            return res.redirect('/users/register');
        }
        if (password !== confirmPassword) {
            req.flash('error_msg', 'Konfirmasi password tidak cocok!');
            return res.redirect('/users/register');
        }

        let checking = await checkUsername(username);
        let checkingEmail = await checkEmail(email);
        if (checking) {
            req.flash('error_msg', 'Username sudah digunakan!');
            return res.redirect('/users/register');
        }
        if (checkingEmail) {
            req.flash('error_msg', 'Email sudah terdaftar!');
            return res.redirect('/users/register');
        }

        let hashedPassword = getHashedPassword(password);
        let apikey = randomText(12);
        await addUser(username, email, hashedPassword, apikey);
        req.flash('success_msg', 'Registrasi berhasil! Silakan login.');
        return res.redirect('/users/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Terjadi kesalahan pada server.');
        return res.redirect('/users/register');
    }
});

// POST Custom API Key (Khusus User / VIP)
router.post('/customapikey', isAuthenticated, async (req, res) => {
    let { customkey } = req.body;
    if (!customkey || customkey.length < 4) {
        req.flash('error_msg', 'API Key baru minimal 4 karakter.');
        return res.redirect('/profile');
    }
    let cekKey = await User.findOne({ apikey: customkey });
    if (cekKey) {
        req.flash('error_msg', 'API Key tersebut sudah dipakai user lain.');
        return res.redirect('/profile');
    }
    await User.updateOne({ _id: req.user._id }, { $set: { apikey: customkey } });
    req.flash('success_msg', `API Key berhasil diubah menjadi: ${customkey}`);
    res.redirect('/profile');
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        req.flash('success_msg', 'Berhasil logout.');
        res.redirect('/users/login');
    });
});

module.exports = router;
