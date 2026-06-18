const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, e.name as employee_name FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN employees e ON o.employee_id = e.id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

router.get('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name, e.name as employee_name FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN employees e ON o.employee_id = e.id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  const items = db.prepare(`
    SELECT oi.*, p.name as product_name, p.code as product_code FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);
  res.json({ ...order, items });
});

router.post('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { customer_id, employee_id, items, payment_method, notes } = req.body;
  const total = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM orders').get().c + 1;
  const code = `ORD-${String(count).padStart(4, '0')}`;

  const createOrder = db.transaction(() => {
    db.prepare(`INSERT INTO orders (id,code,customer_id,employee_id,total,status,payment_method,notes,created_by)
      VALUES (?,?,?,?,?,'pending',?,?,?)`).run(id, code, customer_id, employee_id, total, payment_method, notes, req.user.id);
    items.forEach(it => {
      db.prepare(`INSERT INTO order_items (id,order_id,product_id,quantity,unit_price,subtotal)
        VALUES (?,?,?,?,?,?)`).run(uuidv4(), id, it.product_id, it.quantity, it.unit_price, it.quantity * it.unit_price);
    });
  });
  createOrder();

  const newOrder = db.prepare('SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?').get(id);
  res.status(201).json(newOrder);
});

router.put('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { status, payment_method, notes } = req.body;
  db.prepare('UPDATE orders SET status=?, payment_method=?, notes=? WHERE id=?')
    .run(status, payment_method, notes, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(order);
});

router.delete('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
