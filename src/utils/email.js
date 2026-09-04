const nodemailer = require('nodemailer');

function hasSMTP() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

async function sendEmail(to, subject, text) {
  if (!hasSMTP()) {
    console.log(`\n[DEVELOPMENT EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text
  });
}

module.exports = { sendEmail };
