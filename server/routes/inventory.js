const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const products = await db.all(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `);
  res.json(products);
}));

router.get('/categories', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const cats = await db.all('SELECT * FROM categories ORDER BY name');
  res.json(cats);
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, category_id, unit_price, cost_price, stock, min_stock, location } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM products');
  const code = `PROD-${String((result.c || 0) + 1).padStart(4, '0')}`;
  await db.run(`INSERT INTO products (id,code,name,description,category_id,unit_price,cost_price,stock,min_stock,location,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`, id, code, name, description, category_id, unit_price, cost_price, stock, min_stock, location, req.user.id);
  const prod = await db.get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', id);
  res.status(201).json(prod);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, category_id, unit_price, cost_price, stock, min_stock, location } = req.body;
  await db.run(`UPDATE products SET name=?,description=?,category_id=?,unit_price=?,cost_price=?,stock=?,min_stock=?,location=? WHERE id=?`,
    name, description, category_id, unit_price, cost_price, stock, min_stock, location, req.params.id);
  const prod = await db.get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', req.params.id);
  res.json(prod);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM products WHERE id = ?', req.params.id);
  res.json({ success: true });
}));

module.exports = router;
