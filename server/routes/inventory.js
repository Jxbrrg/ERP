const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Listar solo insumos (ingredientes)
router.get('/ingredients', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const ingredients = await db.all(`
    SELECT p.*, p.category as category_name FROM products p
    WHERE p.company_id = ? AND p.is_ingredient = 1
  `, req.companyId);
  res.json(ingredients);
}));

// Listar solo productos terminados (waffles/granizados)
router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const products = await db.all(`
    SELECT p.*, p.category as category_name FROM products p
    WHERE p.company_id = ? AND (p.is_ingredient = 0 OR p.is_ingredient IS NULL)
  `, req.companyId);
  res.json(products);
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, category, unit_price, cost_price, stock, min_stock, location } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM products WHERE company_id = ?', req.companyId);
  const code = `PROD-${String((result.c || 0) + 1).padStart(4, '0')}`;
  await db.run(`INSERT INTO products (id,code,name,description,category,unit_price,cost_price,stock,min_stock,location,company_id,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, id, code, name, description, category, unit_price, cost_price, stock, min_stock, location, req.companyId, req.user.id);
  const prod = await db.get('SELECT p.*, p.category as category_name FROM products p WHERE p.id = ? AND p.company_id = ?', id, req.companyId);
  res.status(201).json(prod);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, category, unit_price, cost_price, stock, min_stock, location } = req.body;
  await db.run(`UPDATE products SET name=?,description=?,category=?,unit_price=?,cost_price=?,stock=?,min_stock=?,location=? WHERE id=? AND company_id=?`,
    name, description, category, unit_price, cost_price, stock, min_stock, location, req.params.id, req.companyId);
  const prod = await db.get('SELECT p.*, p.category as category_name FROM products p WHERE p.id = ? AND p.company_id = ?', req.params.id, req.companyId);
  res.json(prod);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM products WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

module.exports = router;
