const { User, Stat } = require('./model');
const { limitCount, limitPremium } = require('../lib/settings');

// Inisialisasi dokumen statistik global
async function getStats() {
    let stats = await Stat.findOne({ id: 'global_stats' });
    const today = new Date().toISOString().slice(0, 10);
    if (!stats) {
        stats = await Stat.create({ id: 'global_stats', visitor: 1, totalRequests: 0, requestsToday: 0, lastReset: today });
    } else if (stats.lastReset !== today) {
        stats.requestsToday = 0;
        stats.lastReset = today;
        await stats.save();
    }
    return stats;
}

async function addVisitor() {
    await getStats();
    await Stat.updateOne({ id: 'global_stats' }, { $inc: { visitor: 1 } });
}

async function addUser(username, email, password, apikey) {
    let obj = {
        username,
        email,
        password,
        apikey,
        defaultKey: apikey,
        premium: null,
        limit: limitCount,
        totalreq: 0
    };
    await User.create(obj);
}

async function checkUsername(username) {
    let users = await User.findOne({ username: username });
    return users !== null ? users.username : false;
}

async function checkEmail(email) {
    let users = await User.findOne({ email: email });
    return users !== null ? users.email : false;
}

async function checkKey(apikey) {
    let db = await User.findOne({ apikey: apikey });
    return db !== null ? db.apikey : false;
}

async function isLimit(apikey) {
    let db = await User.findOne({ apikey: apikey });
    if (!db) return true;
    return db.limit <= 0;
}

async function limitAdd(apikey) {
    await getStats();
    await User.updateOne({ apikey: apikey }, { $inc: { limit: -1, totalreq: 1 } });
    await Stat.updateOne({ id: 'global_stats' }, { $inc: { totalRequests: 1, requestsToday: 1 } });
}

async function resetAllLimit() {
    await User.updateMany({ premium: null }, { $set: { limit: limitCount } });
    await User.updateMany({ premium: { $ne: null } }, { $set: { limit: limitPremium } });
    await Stat.updateOne({ id: 'global_stats' }, { $set: { requestsToday: 0 } });
}

module.exports = {
    getStats,
    addVisitor,
    addUser,
    checkUsername,
    checkEmail,
    checkKey,
    isLimit,
    limitAdd,
    resetAllLimit
};
