const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const customers = await db.all('SELECT * FROM customers WHERE company_id = ? ORDER BY created_at DESC', req.companyId);
  res.json(customers);
}));

router.get('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const cust = await db.get('SELECT * FROM customers WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  if (!cust) return res.status(404).json({ error: 'Cliente no encontrado' });
  const interactions = await db.all(`
    SELECT i.*, e.name as assigned_name FROM interactions i
    LEFT JOIN employees e ON i.assigned_to = e.id
    WHERE i.customer_id = ? AND i.company_id = ? ORDER BY i.created_at DESC
  `, req.params.id, req.companyId);
  const orders = await db.all('SELECT * FROM orders WHERE customer_id = ? AND company_id = ? ORDER BY created_at DESC', req.params.id, req.companyId);
  res.json({ ...cust, interactions, orders });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, address, type, credit_limit, notes } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM customers WHERE company_id = ?', req.companyId);
  const code = `CLI-${String((result.c || 0) + 1).padStart(3, '0')}`;
  await db.run('INSERT INTO customers (id,code,name,email,phone,address,type,credit_limit,notes,company_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    id, code, name, email, phone, address, type || 'regular', credit_limit || 0, notes, req.companyId, req.user.id);
  const cust = await db.get('SELECT * FROM customers WHERE id = ? AND company_id = ?', id, req.companyId);
  res.status(201).json(cust);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, address, type, credit_limit, notes } = req.body;
  await db.run('UPDATE customers SET name=?,email=?,phone=?,address=?,type=?,credit_limit=?,notes=? WHERE id=? AND company_id=?',
    name, email, phone, address, type, credit_limit, notes, req.params.id, req.companyId);
  const cust = await db.get('SELECT * FROM customers WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json(cust);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM customers WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

router.get('/:id/interactions', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const interactions = await db.all(`
    SELECT i.*, e.name as assigned_name FROM interactions i
    LEFT JOIN employees e ON i.assigned_to = e.id
    WHERE i.customer_id = ? AND i.company_id = ? ORDER BY i.created_at DESC
  `, req.params.id, req.companyId);
  res.json(interactions);
}));

router.post('/:id/interactions', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { type, subject, description, assigned_to, due_date } = req.body;
  const id = uuidv4();
  await db.run('INSERT INTO interactions (id,customer_id,type,subject,description,status,assigned_to,due_date,company_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
    id, req.params.id, type, subject, description, 'pending', assigned_to, due_date, req.companyId, req.user.id);
  const int = await db.get('SELECT i.*, e.name as assigned_name FROM interactions i LEFT JOIN employees e ON i.assigned_to = e.id WHERE i.id = ? AND i.company_id = ?', id, req.companyId);
  res.status(201).json(int);
}));

module.exports = router;
