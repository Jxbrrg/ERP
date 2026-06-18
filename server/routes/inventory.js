const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const products = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(products);
});

router.get('/categories', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const cats = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(cats);
});

router.post('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, category_id, unit_price, cost_price, stock, min_stock, location } = req.body;
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c + 1;
  const code = `PROD-${String(count).padStart(4, '0')}`;
  db.prepare(`INSERT INTO products (id,code,name,description,category_id,unit_price,cost_price,stock,min_stock,location,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(id, code, name, description, category_id, unit_price, cost_price, stock, min_stock, location, req.user.id);
  const prod = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(id);
  res.status(201).json(prod);
});

router.put('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, category_id, unit_price, cost_price, stock, min_stock, location } = req.body;
  db.prepare(`UPDATE products SET name=?,description=?,category_id=?,unit_price=?,cost_price=?,stock=?,min_stock=?,location=? WHERE id=?`)
    .run(name, description, category_id, unit_price, cost_price, stock, min_stock, location, req.params.id);
  const prod = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(req.params.id);
  res.json(prod);
});

router.delete('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
