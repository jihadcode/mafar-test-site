// routes/news.js
const express = require('express');
const { readTable, writeTable, nextId } = require('../utils/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- PUBLIC: anyone visiting the homepage can read published news ----
// This route is intentionally BEFORE the requireAuth/requireAdmin middleware
// below, so it works without logging in.
router.get('/public', (req, res) => {
  const { section } = req.query;
  let news = readTable('news').filter(n => n.status === 'Published');
  if (section) news = news.filter(n => n.section === section);
  news.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(news);
});

// Everything below this line requires an admin account.
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/news — full list (including drafts), for the dashboard
router.get('/', (req, res) => {
  const news = readTable('news').sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(news);
});

// The categories shown as tabs on each page. Kept here so the dashboard
// and public pages always agree on the same lists.
//
// "KnowledgeCorner" powers the homepage's "News and Information" tabs.
// "News" powers the separate /news.html page (Regional/Provincial/named
// national projects). Every news post belongs to exactly one section.
const CATEGORIES_BY_SECTION = {
  KnowledgeCorner: [
    'Pull Quotes', 'Updates', 'InfoGraphic Videos', 'Trivia',
    'Audio-Video Presentation', 'Radio Program', 'Publications',
    'IEC Materials', 'Annual Reports', 'Project Papers'
  ],
  News: [
    'Regional', 'Provincial', 'Philippine Rural Development Project',
    'Mindanao Inclusive Agriculture Development Project',
    'Special Development Fund',
    'Bangsamoro Agriculture and Fisheries Training Institute'
  ]
};

function isValidCategory(section, category) {
  const list = CATEGORIES_BY_SECTION[section] || CATEGORIES_BY_SECTION.KnowledgeCorner;
  return list.includes(category);
}

// GET /api/news/categories — lets the dashboard build its Category dropdown
// without duplicating this list in the frontend.
router.get('/categories', (req, res) => {
  res.json(CATEGORIES_BY_SECTION);
});

// POST /api/news — create a news post/announcement
router.post('/', (req, res) => {
  const { title, body, date, status, section, category, youtubeUrl, facebookUrl } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  const resolvedSection = section === 'News' ? 'News' : 'KnowledgeCorner';
  const news = readTable('news');
  const newPost = {
    id: nextId(news),
    title,
    body,
    date: date || new Date().toISOString().slice(0, 10),
    status: status || 'Published',
    section: resolvedSection,
    category: isValidCategory(resolvedSection, category) ? category : CATEGORIES_BY_SECTION[resolvedSection][0],
    youtubeUrl: youtubeUrl || '',
    facebookUrl: facebookUrl || ''
  };
  news.push(newPost);
  writeTable('news', news);
  res.status(201).json(newPost);
});

// PUT /api/news/:id — edit a news post
router.put('/:id', (req, res) => {
  const news = readTable('news');
  const idx = news.findIndex(n => n.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'News post not found.' });

  news[idx] = { ...news[idx], ...req.body, id: news[idx].id };
  writeTable('news', news);
  res.json(news[idx]);
});

// DELETE /api/news/:id
router.delete('/:id', (req, res) => {
  let news = readTable('news');
  const exists = news.some(n => n.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ error: 'News post not found.' });

  news = news.filter(n => n.id !== Number(req.params.id));
  writeTable('news', news);
  res.json({ ok: true });
});

module.exports = router;
