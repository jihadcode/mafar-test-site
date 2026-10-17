// routes/clients.js
const express = require('express');
const { readTable, writeTable, nextId } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All routes below require the user to be logged in.
router.use(requireAuth);

// GET /api/clients?type=Farmer&q=amina
router.get('/', (req, res) => {
  let clients = readTable('clients');
  const { type, q } = req.query;

  if (type && type !== 'All') {
    clients = clients.filter(c => c.type === type);
  }
  if (q) {
    const needle = q.toLowerCase();
    clients = clients.filter(
      c => c.name.toLowerCase().includes(needle) ||
           c.barangay.toLowerCase().includes(needle) ||
           c.municipality.toLowerCase().includes(needle)
    );
  }
  res.json(clients);
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const clients = readTable('clients');
  const client = clients.find(c => c.id === Number(req.params.id));
  if (!client) return res.status(404).json({ error: 'Client not found.' });
  res.json(client);
});

// POST /api/clients  -- add a new client record
router.post('/', (req, res) => {
  const { name, type, sex, municipality, barangay, keyDetail, contact } = req.body;
  if (!name || !type || !sex || !municipality) {
    return res.status(400).json({ error: 'Name, type, sex, and municipality are required.' });
  }

  const clients = readTable('clients');
  const newClient = {
    id: nextId(clients),
    name,
    type,          // "Farmer" | "Fisherfolk" | "ARB"
    sex,
    municipality,
    barangay: barangay || '',
    keyDetail: keyDetail || '',
    contact: contact || ''
  };
  clients.push(newClient);
  writeTable('clients', clients);
  res.status(201).json(newClient);
});

// PUT /api/clients/:id -- edit a client record
router.put('/:id', (req, res) => {
  const clients = readTable('clients');
  const idx = clients.findIndex(c => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Client not found.' });

  clients[idx] = { ...clients[idx], ...req.body, id: clients[idx].id };
  writeTable('clients', clients);
  res.json(clients[idx]);
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  let clients = readTable('clients');
  const exists = clients.some(c => c.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ error: 'Client not found.' });

  clients = clients.filter(c => c.id !== Number(req.params.id));
  writeTable('clients', clients);
  res.json({ ok: true });
});

module.exports = router;
