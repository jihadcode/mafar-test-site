// routes/faqs.js
const express = require('express');
const { readTable, writeTable, nextId } = require('../utils/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- PUBLIC: anyone can read published FAQs ----
router.get('/public', (req, res) => {
  const faqs = readTable('faqs').filter(f => f.status === 'Published');
  res.json(faqs);
});

// Everything below this line requires an admin account.
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/faqs — full list (including drafts), for the dashboard
router.get('/', (req, res) => {
  res.json(readTable('faqs'));
});

// POST /api/faqs
router.post('/', (req, res) => {
  const { question, answer, status } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required.' });
  }

  const faqs = readTable('faqs');
  const newFaq = {
    id: nextId(faqs),
    question,
    answer,
    status: status || 'Published'
  };
  faqs.push(newFaq);
  writeTable('faqs', faqs);
  res.status(201).json(newFaq);
});

// PUT /api/faqs/:id
router.put('/:id', (req, res) => {
  const faqs = readTable('faqs');
  const idx = faqs.findIndex(f => f.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'FAQ not found.' });

  faqs[idx] = { ...faqs[idx], ...req.body, id: faqs[idx].id };
  writeTable('faqs', faqs);
  res.json(faqs[idx]);
});

// DELETE /api/faqs/:id
router.delete('/:id', (req, res) => {
  let faqs = readTable('faqs');
  const exists = faqs.some(f => f.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ error: 'FAQ not found.' });

  faqs = faqs.filter(f => f.id !== Number(req.params.id));
  writeTable('faqs', faqs);
  res.json({ ok: true });
});

module.exports = router;
