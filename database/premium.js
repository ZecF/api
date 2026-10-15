const { User } = require('./model');
const { limitCount, limitPremium } = require('../lib/settings');

// Konversi durasi (contoh: "30d" -> milidetik)
function parseDuration(str) {
    const match = /^(\d+)([dhm])$/.exec(str);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // Default 30 hari
    const val = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'd') return val * 24 * 60 * 60 * 1000;
    if (unit === 'h') return val * 60 * 60 * 1000;
    if (unit === 'm') return val * 60 * 1000;
}

async function addPremium(username, customKey, expired) {
    const expTime = Date.now() + parseDuration(expired);
    await User.updateOne(
        { username: username },
        { apikey: customKey, premium: expTime.toString(), limit: limitPremium }
    );
}

async function deletePremium(username) {
    let users = await User.findOne({ username: username });
    if (!users) return;
    await User.updateOne(
        { username: username },
        { apikey: users.defaultKey, premium: null, limit: limitCount }
    );
}

async function checkPremium(username) {
    let users = await User.findOne({ username: username });
    return users && users.premium !== null;
}

async function changeKey(username, key) {
    await User.updateOne({ username: username }, { apikey: key });
}

async function resetOneLimit(username) {
    let users = await User.findOne({ username: username });
    if (users !== null) {
        await User.updateOne({ username: username }, { limit: limitCount });
    }
}

// Mengecek dan mencabut status Premium yang sudah lewat masa aktifnya
async function expiredCheck() {
    let users = await User.find({ premium: { $ne: null } });
    for (let data of users) {
        if (Date.now() >= parseInt(data.premium, 10)) {
            await deletePremium(data.username);
            console.log(`Masa aktif Premium untuk ${data.username} telah habis.`);
        }
    }
}

async function getTotalUser() {
    let db = await User.find({});
    return db;
}

module.exports = {
    addPremium,
    deletePremium,
    checkPremium,
    changeKey,
    resetOneLimit,
    expiredCheck,
    getTotalUser
};
