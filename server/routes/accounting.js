const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const txns = await db.all('SELECT * FROM transactions WHERE company_id = ? ORDER BY created_at DESC', req.companyId);
  res.json(txns);
}));

router.get('/summary', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const income = await db.get("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'income' AND company_id = ?", req.companyId);
  const expense = await db.get("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'expense' AND company_id = ?", req.companyId);
  const byMonth = await db.all(`
    SELECT strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
    FROM transactions WHERE company_id = ? GROUP BY month ORDER BY month DESC LIMIT 12
  `, req.companyId);
  const byCategory = await db.all(`
    SELECT category, SUM(amount) as total FROM transactions WHERE type='expense' AND company_id = ?
    GROUP BY category ORDER BY total DESC
  `, req.companyId);
  res.json({ income: income.total, expense: expense.total, balance: income.total - expense.total, byMonth, byCategory });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { type, category, description, amount, payment_method, reference, date } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM transactions WHERE company_id = ?', req.companyId);
  const code = `TXN-${String((result.c || 0) + 1).padStart(4, '0')}`;
  await db.run('INSERT OR IGNORE INTO transactions (id,code,type,category,description,amount,payment_method,reference,date,company_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    id, code, type, category, description, amount, payment_method || 'cash', reference || `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, date, req.companyId, req.user.id);
  const txn = await db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', id, req.companyId);
  res.status(201).json(txn);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM transactions WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

module.exports = router;
