const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const crypto = require('crypto');
const path = require('path');

const { port } = require('./lib/settings');
const { connectMongoDb } = require('./database/connect');
const { User } = require('./database/model');
const { getStats, addVisitor } = require('./database/db');
const { isAuthenticated } = require('./lib/auth');

const userRouters = require('./server/users');
const apiRouters = require('./server/api');
const premiumRouters = require('./server/premium');

// Koneksi MongoDB
connectMongoDb();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Session & Passport
app.use(session({
    secret: 'lolhuman_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Konfigurasi Strategi Login Passport
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        let hashed = crypto.createHash('sha256').update(password).digest('base64');
        let users = await User.findOne({ username: username });
        if (!users) {
            return done(null, false, { message: 'Username tidak ditemukan!' });
        }
        if (username === users.username && hashed === users.password) {
            return done(null, users);
        } else {
            return done(null, false, { message: 'Password yang kamu masukkan salah!' });
        }
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Global Variabel untuk Flash Message & Data User di EJS
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

// Halaman Utama -> Redirect ke /docs
app.get('/', (req, res) => {
    res.redirect('/docs');
});

// Halaman Dashboard Utama (docs.ejs)
app.get('/docs', isAuthenticated, async (req, res) => {
    await addVisitor();
    const stats = await getStats();
    const totalUsers = await User.countDocuments();
    
    res.render('docs', {
        username: req.user.username,
        apikey: req.user.apikey,
        limit: req.user.limit,
        premium: req.user.premium,
        totalreq: req.user.totalreq || 0,
        visitor: stats.visitor.toLocaleString('en-US'),
        totalUsers: totalUsers.toLocaleString('en-US'),
        totalRequests: stats.totalRequests.toLocaleString('en-US'),
        requestsToday: stats.requestsToday.toLocaleString('en-US')
    });
});

// Halaman Profile (profile.ejs)
app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', {
        user: req.user
    });
});

// Halaman Kategori Fitur (Sesuai views/*.ejs di apaky-master)
const categories = ['animanga', 'asupan', 'berita', 'creator', 'nsfwsfw', 'photofunia', 'primbon', 'searching', 'socialmedia', 'textpro', 'pricing'];
categories.forEach((cat) => {
    app.get(`/${cat}`, isAuthenticated, (req, res) => {
        res.render(cat, {
            username: req.user.username,
            apikey: req.user.apikey,
            limit: req.user.limit
        });
    });
});

// Mount Routers
app.use('/users', userRouters);
app.use('/api', apiRouters);
app.use('/premium', premiumRouters);

// 404 Handler
app.use((req, res) => {
    res.status(404).render('notfound');
});

const PORT = process.env.PORT || port || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server LoL Human REST API berjalan di port ${PORT}`);
});
