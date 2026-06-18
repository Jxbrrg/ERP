const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const orders = await db.all(`
    SELECT o.*, c.name as customer_name, e.name as employee_name FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN employees e ON o.employee_id = e.id
    ORDER BY o.created_at DESC
  `);
  res.json(orders);
}));

router.get('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const order = await db.get(`
    SELECT o.*, c.name as customer_name, e.name as employee_name FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN employees e ON o.employee_id = e.id
    WHERE o.id = ?
  `, req.params.id);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  const items = await db.all(`
    SELECT oi.*, p.name as product_name, p.code as product_code FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `, req.params.id);
  res.json({ ...order, items });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { customer_id, employee_id, items, payment_method, notes } = req.body;
  const total = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM orders');
  const code = `ORD-${String((result.c || 0) + 1).padStart(4, '0')}`;

  await db.transaction(async (tx) => {
    await tx.run(`INSERT INTO orders (id,code,customer_id,employee_id,total,status,payment_method,notes,created_by)
      VALUES (?,?,?,?,?,'pending',?,?,?)`, id, code, customer_id, employee_id, total, payment_method, notes, req.user.id);
    for (const it of items) {
      await tx.run(`INSERT INTO order_items (id,order_id,product_id,quantity,unit_price,subtotal)
        VALUES (?,?,?,?,?,?)`, uuidv4(), id, it.product_id, it.quantity, it.unit_price, it.quantity * it.unit_price);
    }
  });

  const newOrder = await db.get('SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?', id);
  res.status(201).json(newOrder);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { status, payment_method, notes } = req.body;
  await db.run('UPDATE orders SET status=?, payment_method=?, notes=? WHERE id=?',
    status, payment_method, notes, req.params.id);
  const order = await db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
  res.json(order);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM orders WHERE id = ?', req.params.id);
  res.json({ success: true });
}));

module.exports = router;
