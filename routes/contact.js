// routes/contact.js
// Handles the public Contact Us form. Reuses utils/mailer.js — if SMTP is
// configured (see .env.example), the message is emailed to whoever is set
// as CONTACT_EMAIL; if not, it's printed to the server console just like
// the "Forgot Password" emails, so this still works before email is set up.
const express = require('express');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'contact@example.com';

  await sendMail({
    to,
    subject: `[MAFAR-LDS Contact Form] ${subject || 'New message'}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, '<br>')}</p>`
  });

  res.json({ ok: true, message: 'Thank you — your message has been sent. We\'ll get back to you soon.' });
});

module.exports = router;
