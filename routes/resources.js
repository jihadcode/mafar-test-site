// routes/resources.js
// A general-purpose "list of documents/links" system, reused for THREE
// different nav sections instead of building three separate systems:
//   - Issuances   (Memorandum Orders, Administrative Orders)
//   - Downloads   (forms and application files)
//   - Transparency (Procurement notices, Vacant Position postings)
// Each resource has a `section` (which page it belongs to) and a
// `category` (the sub-tab within that page).
const express = require('express');
const { readTable, writeTable, nextId } = require('../utils/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES_BY_SECTION = {
  Issuances: ['Memorandum Orders', 'Administrative Orders'],
  Downloads: ['Forms', 'Application Forms'],
  Transparency: ['Procurement', 'Vacant Position']
};

function isValidCategory(section, category) {
  const list = CATEGORIES_BY_SECTION[section];
  return Array.isArray(list) && list.includes(category);
}

// ---- PUBLIC: anyone can read published resources ----
router.get('/public', (req, res) => {
  const { section } = req.query;
  let resources = readTable('resources').filter(r => r.status === 'Published');
  if (section) resources = resources.filter(r => r.section === section);
  resources.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(resources);
});

// Everything below this line requires an admin account.
router.use(requireAuth);
router.use(requireAdmin);

router.get('/categories', (req, res) => {
  res.json(CATEGORIES_BY_SECTION);
});

// GET /api/resources — full list (including drafts), for the dashboard
router.get('/', (req, res) => {
  const { section } = req.query;
  let resources = readTable('resources');
  if (section) resources = resources.filter(r => r.section === section);
  resources.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(resources);
});

// POST /api/resources — create a new document/link entry
router.post('/', (req, res) => {
  const { title, description, section, category, fileUrl, date, status } = req.body;
  if (!title || !section || !CATEGORIES_BY_SECTION[section]) {
    return res.status(400).json({ error: 'Title and a valid section are required.' });
  }

  const resources = readTable('resources');
  const newResource = {
    id: nextId(resources),
    title,
    description: description || '',
    section,
    category: isValidCategory(section, category) ? category : CATEGORIES_BY_SECTION[section][0],
    fileUrl: fileUrl || '',
    date: date || new Date().toISOString().slice(0, 10),
    status: status || 'Published'
  };
  resources.push(newResource);
  writeTable('resources', resources);
  res.status(201).json(newResource);
});

// PUT /api/resources/:id
router.put('/:id', (req, res) => {
  const resources = readTable('resources');
  const idx = resources.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Resource not found.' });

  resources[idx] = { ...resources[idx], ...req.body, id: resources[idx].id };
  writeTable('resources', resources);
  res.json(resources[idx]);
});

// DELETE /api/resources/:id
router.delete('/:id', (req, res) => {
  let resources = readTable('resources');
  const exists = resources.some(r => r.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ error: 'Resource not found.' });

  resources = resources.filter(r => r.id !== Number(req.params.id));
  writeTable('resources', resources);
  res.json({ ok: true });
});

module.exports = router;
