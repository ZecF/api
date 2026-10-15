module.exports = {
    isAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Silakan login terlebih dahulu untuk mengakses dashboard.');
        res.redirect('/users/login');
    },
    notAuthenticated: function (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/docs');
    }
};
