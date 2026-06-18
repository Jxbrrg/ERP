const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const txns = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
  res.json(txns);
});

router.get('/summary', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const income = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'income'").get();
  const expense = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'expense'").get();
  const byMonth = db.prepare(`
    SELECT strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
    FROM transactions GROUP BY month ORDER BY month DESC LIMIT 12
  `).all();
  const byCategory = db.prepare(`
    SELECT category, SUM(amount) as total FROM transactions WHERE type='expense'
    GROUP BY category ORDER BY total DESC
  `).all();
  res.json({ income: income.total, expense: expense.total, balance: income.total - expense.total, byMonth, byCategory });
});

router.post('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { type, category, description, amount, payment_method, reference, date } = req.body;
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c + 1;
  const code = `TXN-${String(count).padStart(4, '0')}`;
  db.prepare('INSERT INTO transactions (id,code,type,category,description,amount,payment_method,reference,date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, code, type, category, description, amount, payment_method || 'cash', reference || `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, date, req.user.id);
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  res.status(201).json(txn);
});

router.delete('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
