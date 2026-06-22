const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Middleware to authenticate via API key
async function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key requerida. Usa header X-API-Key' });
  const key = await db.get('SELECT * FROM api_keys WHERE key = ? AND active = 1', apiKey);
  if (!key) return res.status(403).json({ error: 'API key inválida o inactiva' });
  req.companyId = key.company_id;
  await db.run('UPDATE api_keys SET last_used_at = datetime(\'now\') WHERE id = ?', key.id);
  next();
}

// Manage API keys (authenticated via JWT)
router.get('/api-keys', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const keys = await db.all('SELECT id, name, key, active, last_used_at, created_at FROM api_keys WHERE company_id = ? ORDER BY created_at DESC', req.companyId);
  res.json(keys);
}));

router.post('/api-keys', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const id = uuidv4();
  const key = 'sx_' + crypto.randomBytes(24).toString('hex');
  await db.run('INSERT INTO api_keys (id, company_id, name, key) VALUES (?,?,?,?)', id, req.companyId, name, key);
  res.status(201).json({ id, name, key, active: 1, created_at: new Date().toISOString() });
}));

router.delete('/api-keys/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM api_keys WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

// Public API endpoints (authenticated via API key)
router.get('/v1/products', apiKeyAuth, ah(async (req, res) => {
  const products = await db.all('SELECT id, code, name, description, category, unit_price, stock, min_stock, created_at FROM products WHERE company_id = ?', req.companyId);
  res.json({ data: products, count: products.length });
}));

router.get('/v1/customers', apiKeyAuth, ah(async (req, res) => {
  const customers = await db.all('SELECT id, code, name, email, phone, type, credit_limit, created_at FROM customers WHERE company_id = ?', req.companyId);
  res.json({ data: customers, count: customers.length });
}));

router.get('/v1/orders', apiKeyAuth, ah(async (req, res) => {
  const orders = await db.all('SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.company_id = ? ORDER BY o.created_at DESC', req.companyId);
  res.json({ data: orders, count: orders.length });
}));

module.exports = router;
