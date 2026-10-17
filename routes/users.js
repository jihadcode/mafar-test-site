// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { readTable, writeTable } = require('../utils/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- PUBLIC: anyone can see the staff directory (name + position only) ----
// This route is intentionally BEFORE the requireAuth/requireAdmin middleware
// below, so it works without logging in. It never exposes anything
// sensitive — no email, no username, no role, no password hash.
router.get('/public-directory', (req, res) => {
  const users = readTable('users');
  const directory = users
    .map(u => ({ fullName: u.fullName, position: u.position || '' }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  res.json(directory);
});

// Everything below this line requires an admin account.
router.use(requireAuth);
router.use(requireAdmin);

// Strip the password hash before sending user data to the browser.
function toSafeUser(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

// GET /api/users — list every registered account (admin only)
router.get('/', (req, res) => {
  const users = readTable('users');
  res.json(users.map(toSafeUser));
});

// PUT /api/users/:id — update a user's role/position (admin only)
router.put('/:id', (req, res) => {
  const users = readTable('users');
  const idx = users.findIndex(u => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'User not found.' });

  const { role, position, fullName } = req.body;
  if (role && !['admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Role must be "admin" or "staff".' });
  }

  if (role) users[idx].role = role;
  if (position !== undefined) users[idx].position = position;
  if (fullName) users[idx].fullName = fullName;

  writeTable('users', users);
  res.json(toSafeUser(users[idx]));
});

// POST /api/users/:id/reset-password — admin sets a new password for
// someone directly (no email required). Handy for a small internal team
// where the admin can just tell/message the person their new password.
router.post('/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const users = readTable('users');
  const idx = users.findIndex(u => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'User not found.' });

  users[idx].passwordHash = await bcrypt.hash(newPassword, 10);
  delete users[idx].resetTokenHash;
  delete users[idx].resetTokenExpiry;
  writeTable('users', users);

  res.json({ ok: true });
});

// DELETE /api/users/:id — remove an account (admin only, can't delete yourself)
router.delete('/:id', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.session.userId) {
    return res.status(400).json({ error: "You can't delete your own account while logged in as it." });
  }

  let users = readTable('users');
  const exists = users.some(u => u.id === targetId);
  if (!exists) return res.status(404).json({ error: 'User not found.' });

  users = users.filter(u => u.id !== targetId);
  writeTable('users', users);
  res.json({ ok: true });
});

module.exports = router;
