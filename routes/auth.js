// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { readTable, writeTable, nextId } = require('../utils/db');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

// ---- REGISTER ----
// Creates a new user account. Passwords are never stored as plain text —
// bcrypt "hashes" (scrambles) them first.
router.post('/register', async (req, res) => {
  const { fullName, username, email, password, position } = req.body;

  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = readTable('users');

  const existing = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() ||
         u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    return res.status(409).json({ error: 'Username or email is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextId(users),
    fullName,
    username,
    email,
    passwordHash,
    position: position || 'Information Officer I',
    role: users.length === 0 ? 'admin' : 'staff', // first account becomes admin
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeTable('users', users);

  // Log the user in immediately after registering
  req.session.userId = newUser.id;

  res.json({ ok: true, user: { id: newUser.id, fullName: newUser.fullName, role: newUser.role, position: newUser.position } });
});

// ---- LOGIN ----
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const users = readTable('users');
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  req.session.userId = user.id;
  res.json({ ok: true, user: { id: user.id, fullName: user.fullName, role: user.role, position: user.position } });
});

// ---- LOGOUT ----
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ---- FORGOT PASSWORD (step 1: request a reset link) ----
// Sends a real email IF SMTP is configured (see utils/mailer.js and the
// README's "Sending real emails" section). If it's NOT configured yet,
// the reset link is printed to the server's terminal instead, so this
// still works out of the box during development.
router.post('/forgot-password', async (req, res) => {
  const { emailOrUsername } = req.body;

  // Always send back the same generic message, whether or not the account
  // exists. This stops someone from using this form to check which
  // usernames/emails are registered on the system.
  const genericResponse = {
    ok: true,
    message: 'If an account matches that username or email, a password reset link has been sent to the email on file. (If email delivery isn\'t set up yet, ask your system administrator to check the server console/logs instead.)'
  };

  if (!emailOrUsername) {
    return res.status(400).json({ error: 'Please enter your username or email.' });
  }

  const users = readTable('users');
  const needle = emailOrUsername.toLowerCase();
  const user = users.find(
    u => u.username.toLowerCase() === needle || u.email.toLowerCase() === needle
  );

  if (!user) {
    // Don't reveal that this account doesn't exist — same response either way.
    return res.json(genericResponse);
  }

  // Generate a random, one-time token. We only ever store a HASH of it
  // (never the raw token), the same way we never store raw passwords —
  // so even someone reading users.json can't reuse it.
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60; // valid for 1 hour

  user.resetTokenHash = tokenHash;
  user.resetTokenExpiry = expiresAt;
  writeTable('users', users);

  const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${rawToken}`;

  await sendMail({
    to: user.email,
    subject: 'Reset your MAFAR-LDS Portal password',
    text: `Hello ${user.fullName},\n\nWe received a request to reset your MAFAR-LDS Portal password. ` +
          `Click the link below to set a new one. This link is valid for 1 hour and can only be used once.\n\n${resetLink}\n\n` +
          `If you didn't request this, you can safely ignore this email — your password will not change.`,
    html: `<p>Hello ${user.fullName},</p>` +
          `<p>We received a request to reset your MAFAR-LDS Portal password. ` +
          `Click the link below to set a new one. This link is valid for 1 hour and can only be used once.</p>` +
          `<p><a href="${resetLink}">${resetLink}</a></p>` +
          `<p>If you didn't request this, you can safely ignore this email — your password will not change.</p>`
  });

  res.json(genericResponse);
});

// ---- FORGOT PASSWORD (step 2: use the token to set a new password) ----
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Missing reset token or new password.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const users = readTable('users');
  const user = users.find(
    u => u.resetTokenHash === tokenHash && u.resetTokenExpiry && u.resetTokenExpiry > Date.now()
  );

  if (!user) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  delete user.resetTokenHash;
  delete user.resetTokenExpiry;
  writeTable('users', users);

  res.json({ ok: true, message: 'Your password has been reset. You can now log in with your new password.' });
});

// ---- CURRENT USER ----
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const users = readTable('users');
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user.id, fullName: user.fullName, role: user.role, position: user.position } });
});

module.exports = router;
