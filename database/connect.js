const mongoose = require('mongoose');
const { dbURI } = require('../lib/settings');

function connectMongoDb() {
    mongoose.connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'Koneksi MongoDB Gagal:'));
    db.once('open', () => {
        console.log('Berhasil terhubung ke MongoDB LoL Human API!');
    });
}

module.exports.connectMongoDb = connectMongoDb;
