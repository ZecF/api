const mongoose = require('mongoose');

const Users = mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    apikey: { type: String, required: true },
    defaultKey: { type: String, required: true },
    premium: { type: String, default: null }, // Menyimpan timestamp expired VIP
    limit: { type: Number, default: 100 },
    totalreq: { type: Number, default: 0 },
    verified: { type: Boolean, default: true }
}, { versionKey: false });

const Stats = mongoose.Schema({
    id: { type: String, default: 'global_stats' },
    visitor: { type: Number, default: 0 },
    totalRequests: { type: Number, default: 0 },
    requestsToday: { type: Number, default: 0 },
    lastReset: { type: String, default: () => new Date().toISOString().slice(0, 10) }
}, { versionKey: false });

module.exports.User = mongoose.model('user', Users);
module.exports.Stat = mongoose.model('stat', Stats);
