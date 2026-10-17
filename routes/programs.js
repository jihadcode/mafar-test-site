// routes/programs.js
const express = require('express');
const { readTable, writeTable, nextId } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/programs
router.get('/', (req, res) => {
  res.json(readTable('programs'));
});

// GET /api/programs/:id
router.get('/:id', (req, res) => {
  const programs = readTable('programs');
  const program = programs.find(p => p.id === Number(req.params.id));
  if (!program) return res.status(404).json({ error: 'Program not found.' });
  res.json(program);
});

// POST /api/programs
router.post('/', (req, res) => {
  const { name, description, fundingSource, coverageArea, status } = req.body;
  if (!name || !fundingSource || !coverageArea) {
    return res.status(400).json({ error: 'Name, funding source, and coverage area are required.' });
  }

  const programs = readTable('programs');
  const newProgram = {
    id: nextId(programs),
    name,
    description: description || '',
    fundingSource,
    coverageArea,
    linkedProjects: 0,
    status: status || 'Active'
  };
  programs.push(newProgram);
  writeTable('programs', programs);
  res.status(201).json(newProgram);
});

// PUT /api/programs/:id
router.put('/:id', (req, res) => {
  const programs = readTable('programs');
  const idx = programs.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Program not found.' });

  programs[idx] = { ...programs[idx], ...req.body, id: programs[idx].id };
  writeTable('programs', programs);
  res.json(programs[idx]);
});

// DELETE /api/programs/:id
router.delete('/:id', (req, res) => {
  let programs = readTable('programs');
  const exists = programs.some(p => p.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ error: 'Program not found.' });

  programs = programs.filter(p => p.id !== Number(req.params.id));
  writeTable('programs', programs);
  res.json({ ok: true });
});

module.exports = router;
