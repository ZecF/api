const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL || 'emailkamu@gmail.com',
        pass: process.env.SMTP_PASS || 'xxxx xxxx xxxx xxxx' // App Password Google 16 digit
    }
});

async function sendVerifyEmail(toEmail, verifyUrl) {
    const mailOptions = {
        from: '"LoL Human REST API" <no-reply@lolhuman.xyz>',
        to: toEmail,
        subject: 'Verifikasi Akun LoL Human REST API',
        html: `
            <div style="background:#191c20;color:#fff;padding:30px;border-radius:10px;font-family:sans-serif;">
                <h2 style="color:#f06a6a;">lolhumanapi.</h2>
                <p>Terima kasih telah mendaftar! Klik tombol di bawah untuk mengaktifkan API Key kamu:</p>
                <a href="${verifyUrl}" style="display:inline-block;background:#f06a6a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px;">Verifikasi Akun</a>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}

module.exports = { sendVerifyEmail };
