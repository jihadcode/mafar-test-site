// middleware/auth.js
// These functions check whether a user is logged in (and, for some pages,
// whether they're an admin) before letting them continue.
const { readTable } = require('../utils/db');

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  // If the browser expects JSON (an API call), send a 401 error.
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  // Otherwise, send them to the login page.
  return res.redirect('/login.html');
}

// Only lets admin accounts through. Must be used AFTER requireAuth.
function requireAdmin(req, res, next) {
  const users = readTable('users');
  const user = users.find(u => u.id === req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
