// server.js
// This is the starting point of the whole website.
// Run it with:  npm start
// Then open:    http://localhost:3000 in your browser.

// Load settings from a .env file if one exists (copy .env.example to .env
// and fill it in — see the README's "Sending real emails" section).
// This must run before anything else touches process.env.
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const programRoutes = require('./routes/programs');
const projectRoutes = require('./routes/projects');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const newsRoutes = require('./routes/news');
const resourceRoutes = require('./routes/resources');
const faqRoutes = require('./routes/faqs');
const contactRoutes = require('./routes/contact');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON request bodies (so req.body works)
app.use(express.json());

// Sessions keep a user "logged in" as they click around the site.
// IMPORTANT: before this website goes live for real, set SESSION_SECRET in
// your .env file (or your hosting provider's environment variables) to a
// long random string. The fallback below is only safe for local testing.
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // Only require HTTPS-only cookies once actually deployed with HTTPS —
    // keeping this false lets login still work over plain http://localhost.
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// Serve everything in /public as static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/contact', contactRoutes);

// Protect the dashboard PAGE itself: if not logged in, bounce to /login.html
app.get('/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`\nMAFAR-LDS Portal is running!`);
  console.log(`Open this in your browser:  http://localhost:${PORT}\n`);
});
