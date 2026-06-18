const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  res.json(customers);
});

router.get('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const cust = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!cust) return res.status(404).json({ error: 'Cliente no encontrado' });
  const interactions = db.prepare(`
    SELECT i.*, e.name as assigned_name FROM interactions i
    LEFT JOIN employees e ON i.assigned_to = e.id
    WHERE i.customer_id = ? ORDER BY i.created_at DESC
  `).all(req.params.id);
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...cust, interactions, orders });
});

router.post('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, address, type, credit_limit, notes } = req.body;
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM customers').get().c + 1;
  const code = `CLI-${String(count).padStart(3, '0')}`;
  db.prepare('INSERT INTO customers (id,code,name,email,phone,address,type,credit_limit,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, code, name, email, phone, address, type || 'regular', credit_limit || 0, notes, req.user.id);
  const cust = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  res.status(201).json(cust);
});

router.put('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, address, type, credit_limit, notes } = req.body;
  db.prepare('UPDATE customers SET name=?,email=?,phone=?,address=?,type=?,credit_limit=?,notes=? WHERE id=?')
    .run(name, email, phone, address, type, credit_limit, notes, req.params.id);
  const cust = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(cust);
});

router.delete('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Interactions
router.get('/:id/interactions', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const interactions = db.prepare(`
    SELECT i.*, e.name as assigned_name FROM interactions i
    LEFT JOIN employees e ON i.assigned_to = e.id
    WHERE i.customer_id = ? ORDER BY i.created_at DESC
  `).all(req.params.id);
  res.json(interactions);
});

router.post('/:id/interactions', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { type, subject, description, assigned_to, due_date } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO interactions (id,customer_id,type,subject,description,status,assigned_to,due_date,created_by) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, req.params.id, type, subject, description, 'pending', assigned_to, due_date, req.user.id);
  const int = db.prepare('SELECT i.*, e.name as assigned_name FROM interactions i LEFT JOIN employees e ON i.assigned_to = e.id WHERE i.id = ?').get(id);
  res.status(201).json(int);
});

module.exports = router;
