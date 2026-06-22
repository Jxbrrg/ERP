const express = require('express');
const db = require('../db');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const TABLES = ['employees', 'categories', 'products', 'customers', 'orders', 'transactions', 'interactions', 'projects', 'tasks', 'notifications'];

router.get('/backup', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const backup = {};
  for (const table of TABLES) {
    backup[table] = await db.all(`SELECT * FROM ${table} WHERE company_id = ?`, req.companyId);
  }
  backup.company = await db.get('SELECT id, name, slug, plan FROM companies WHERE id = ?', req.companyId);
  backup.exportedAt = new Date().toISOString();
  res.json(backup);
}));

router.post('/restore', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const data = req.body;
  if (!data || !data.company) return res.status(400).json({ error: 'Datos de backup inválidos' });
  if (data.company.id !== req.companyId) return res.status(403).json({ error: 'El backup no pertenece a esta empresa' });
  for (const table of TABLES) {
    if (data[table] && data[table].length > 0) {
      await db.run(`DELETE FROM ${table} WHERE company_id = ?`, req.companyId);
      for (const row of data[table]) {
        const keys = Object.keys(row);
        const vals = Object.values(row);
        const placeholders = keys.map(() => '?').join(',');
        await db.run(`INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, ...vals);
      }
    }
  }
  res.json({ success: true, restored: Object.keys(data).filter(k => k !== 'company' && k !== 'exportedAt') });
}));

module.exports = router;
