// routes/projects.js
const express = require('express');
const { readTable, writeTable, nextId } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Keep each program's "linkedProjects" count in sync with reality.
function recalcLinkedProjects() {
  const projects = readTable('projects');
  const programs = readTable('programs');
  programs.forEach(p => {
    p.linkedProjects = projects.filter(pr => pr.programId === p.id).length;
  });
  writeTable('programs', programs);
}

// GET /api/projects
router.get('/', (req, res) => {
  res.json(readTable('projects'));
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const projects = readTable('projects');
  const project = projects.find(p => p.id === Number(req.params.id));
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project);
});

// POST /api/projects
router.post('/', (req, res) => {
  const { name, programId, location, budget, beneficiaries, startDate, endDate, status } = req.body;
  if (!name || !programId) {
    return res.status(400).json({ error: 'Project name and a linked program are required.' });
  }

  const programs = readTable('programs');
  const program = programs.find(p => p.id === Number(programId));
  if (!program) return res.status(400).json({ error: 'Selected program does not exist.' });

  const projects = readTable('projects');
  const newProject = {
    id: nextId(projects),
    name,
    programId: Number(programId),
    programName: program.name,
    location: location || '',
    budget: Number(budget) || 0,
    beneficiaries: Number(beneficiaries) || 0,
    startDate: startDate || '',
    endDate: endDate || '',
    status: status || 'Planning'
  };
  projects.push(newProject);
  writeTable('projects', projects);
  recalcLinkedProjects();
  res.status(201).json(newProject);
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const projects = readTable('projects');
  const idx = projects.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  const body = { ...req.body };
  if (body.programId) {
    const programs = readTable('programs');
    const program = programs.find(p => p.id === Number(body.programId));
    if (!program) return res.status(400).json({ error: 'Selected program does not exist.' });
    body.programId = Number(body.programId);
    body.programName = program.name;
  }
  if (body.budget !== undefined) body.budget = Number(body.budget) || 0;
  if (body.beneficiaries !== undefined) body.beneficiaries = Number(body.beneficiaries) || 0;

  projects[idx] = { ...projects[idx], ...body, id: projects[idx].id };
  writeTable('projects', projects);
  recalcLinkedProjects();
  res.json(projects[idx]);
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  let projects = readTable('projects');
  const exists = projects.some(p => p.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ error: 'Project not found.' });

  projects = projects.filter(p => p.id !== Number(req.params.id));
  writeTable('projects', projects);
  recalcLinkedProjects();
  res.json({ ok: true });
});

module.exports = router;
