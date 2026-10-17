// routes/reports.js
const express = require('express');
const { readTable } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/public-summary
// A safe, no-login-required version of the summary below: only aggregate
// counts, never individual client records. Used for the homepage's
// "at a glance" stats — nothing here reveals any person's information.
router.get('/public-summary', (req, res) => {
  const clients = readTable('clients');
  const programs = readTable('programs');
  const projects = readTable('projects');

  res.json({
    totalClients: clients.length,
    totalPrograms: programs.length,
    totalProjects: projects.length,
    totalMunicipalities: new Set(clients.map(c => c.municipality)).size
  });
});

router.use(requireAuth);

// GET /api/reports/summary
// Returns the numbers used by the Dashboard overview and the Reports page.
router.get('/summary', (req, res) => {
  const clients = readTable('clients');
  const programs = readTable('programs');
  const projects = readTable('projects');

  const clientsByType = { Farmer: 0, Fisherfolk: 0, ARB: 0 };
  clients.forEach(c => { if (clientsByType[c.type] !== undefined) clientsByType[c.type]++; });

  const clientsByMunicipality = {};
  clients.forEach(c => {
    clientsByMunicipality[c.municipality] = (clientsByMunicipality[c.municipality] || 0) + 1;
  });

  const programsByStatus = {};
  programs.forEach(p => { programsByStatus[p.status] = (programsByStatus[p.status] || 0) + 1; });

  const projectsByStatus = {};
  let totalBudget = 0;
  let totalBeneficiaries = 0;
  projects.forEach(p => {
    projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
    totalBudget += Number(p.budget) || 0;
    totalBeneficiaries += Number(p.beneficiaries) || 0;
  });

  res.json({
    totals: {
      clients: clients.length,
      programs: programs.length,
      projects: projects.length,
      totalBudget,
      totalBeneficiaries
    },
    clientsByType,
    clientsByMunicipality,
    programsByStatus,
    projectsByStatus
  });
});

// Helper: turn an array of flat objects into a CSV string.
function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    const str = String(val === undefined || val === null ? '' : val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const lines = [headers.join(',')];
  rows.forEach(row => {
    lines.push(headers.map(h => escapeCell(row[h])).join(','));
  });
  return lines.join('\n');
}

// GET /api/reports/export/:table  -> downloads clients.csv / programs.csv / projects.csv
router.get('/export/:table', (req, res) => {
  const allowed = ['clients', 'programs', 'projects'];
  const table = req.params.table;
  if (!allowed.includes(table)) {
    return res.status(400).json({ error: 'Unknown export table.' });
  }
  const rows = readTable(table);
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
  res.send(csv);
});

module.exports = router;
