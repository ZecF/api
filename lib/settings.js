module.exports = {
    port: '5000',
    limitCount: 100, // Limit harian user Free
    limitPremium: 100000, // Limit harian user Premium / VIP
    tokens: 'admin_rahasia_123', // Token khusus untuk akses halaman /admin
    // Ganti dengan MongoDB URI milikmu
    dbURI: process.env.MONGODB_URI || 'mongodb+srv://dimasryanjr_db_user:dimasugesti@cluster0.yyngy7.mongodb.net/?appName=Cluster0'
};
