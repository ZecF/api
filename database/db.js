const { User, Stat } = require('./model');
const { limitCount, limitPremium } = require('../lib/settings');

async function getStats() {
    let stats = await Stat.findOne({ id: 'global_stats' });
    const today = new Date().toISOString().slice(0, 10);
    if (!stats) {
        stats = await Stat.create({
            id: 'global_stats',
            visitor: 1,
            totalRequests: 0,
            requestsToday: 0,
            lastReset: today
        });
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
    return Number(db.limit) <= 0;
}

// Perbaikan utama: kurangi limit secara eksplisit & tambah counter request
async function limitAdd(apikey) {
    let user = await User.findOne({ apikey: apikey });
    if (!user) return;

    let currentLimit = Number(user.limit) || 0;
    let newLimit = currentLimit > 0 ? currentLimit - 1 : 0;

    await User.updateOne(
        { apikey: apikey },
        { $set: { limit: newLimit }, $inc: { totalreq: 1 } }
    );

    await getStats();
    await Stat.updateOne(
        { id: 'global_stats' },
        { $inc: { totalRequests: 1, requestsToday: 1 } }
    );
}

async function getApikey(id) {
    let users = await User.findOne({ _id: id });
    return { apikey: users ? users.apikey : '', username: users ? users.username : '', limit: users ? users.limit : 0 };
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
    cekKey: checkKey, // Alias untuk kompatibilitas semua file di features/
    getApikey,
    isLimit,
    limitAdd,
    kurangLimit: limitAdd, // Alias tambahan
    resetAllLimit
};
