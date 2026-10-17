// utils/mailer.js
// Sends real emails IF SMTP settings are provided via environment variables
// (see .env.example). If they're NOT set, this falls back to printing the
// email to the server console instead — so the "Forgot Password" feature
// keeps working out of the box even before you've set up real email, and
// nothing breaks for anyone who hasn't configured this yet.

const nodemailer = require('nodemailer');

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // Port 465 requires secure:true (implicit TLS). Port 587 (the common
    // default) uses secure:false with STARTTLS negotiated automatically.
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// sendMail({ to, subject, text, html }) -> { sent: boolean }
async function sendMail({ to, subject, text, html }) {
  if (!isConfigured()) {
    console.log('\n=== EMAIL NOT SENT (SMTP not configured yet) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('See README.md → "Sending real emails" to set this up.');
    console.log('================================================\n');
    return { sent: false };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log(`Email sent to ${to} (message id: ${info.messageId})`);
    return { sent: true };
  } catch (err) {
    // If sending fails (wrong credentials, provider blocked it, etc.), log
    // the problem clearly but don't crash the request — the reset link
    // still exists and an admin can retrieve it a different way if needed.
    console.error('Failed to send email:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendMail, isConfigured };
