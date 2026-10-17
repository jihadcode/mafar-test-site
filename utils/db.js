// utils/db.js
// A tiny "database" that stores data as JSON files on disk.
// This is intentionally simple so a beginner can read and understand it.
// For a real government system with many users, you would swap this out
// for a real database like PostgreSQL or MySQL — see README.md, section
// "Upgrading to a real database" for notes on how to do that later.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readTable(name) {
  const file = filePath(name);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf-8');
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

function writeTable(name, rows) {
  const file = filePath(name);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), 'utf-8');
}

function nextId(rows) {
  if (rows.length === 0) return 1;
  return Math.max(...rows.map(r => r.id)) + 1;
}

module.exports = { readTable, writeTable, nextId };
