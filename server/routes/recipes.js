const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const recipes = await db.all(`
    SELECT p.*, p.category as category_name,
      (SELECT COUNT(*) FROM product_ingredients pi WHERE pi.product_id = p.id) as ingredient_count
    FROM products p WHERE p.company_id = ? AND (p.unit = 'unidad' OR p.unit IS NULL)
    AND p.name NOT IN ('LECHE CONDENSADA','SERVILLETA','CUCHARA','VASOS DARNEL','PAPEL PELE','BOLSA','STICKER')
    ORDER BY p.created_at DESC
  `, req.companyId);
  const result = [];
  for (const r of recipes) {
    const ingredients = await db.all(`
      SELECT pi.*, pr.name as ingredient_name, pr.cost_price as ingredient_cost,
        pr.unit as ingredient_unit, pr.stock as ingredient_stock
      FROM product_ingredients pi
      JOIN products pr ON pr.id = pi.ingredient_id
      WHERE pi.product_id = ? AND pi.company_id = ?
    `, r.id, req.companyId);
    const totalCost = ingredients.reduce((sum, ing) => sum + (ing.grams_quantity * ing.ingredient_cost / 1000), 0);
    result.push({ ...r, ingredients, total_cost: totalCost });
  }
  res.json(result);
}));

router.get('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const product = await db.get('SELECT p.*, p.category as category_name FROM products p WHERE p.id = ? AND p.company_id = ?', req.params.id, req.companyId);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  const ingredients = await db.all(`
    SELECT pi.*, pr.name as ingredient_name, pr.cost_price as ingredient_cost,
      pr.unit as ingredient_unit, pr.stock as ingredient_stock
    FROM product_ingredients pi
    JOIN products pr ON pr.id = pi.ingredient_id
    WHERE pi.product_id = ? AND pi.company_id = ?
  `, req.params.id, req.companyId);
  const totalCost = ingredients.reduce((sum, ing) => sum + (ing.grams_quantity * ing.ingredient_cost / 1000), 0);
  res.json({ ...product, ingredients, total_cost: totalCost });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { product_id, ingredients } = req.body;
  if (!product_id || !ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'product_id e ingredients requeridos' });
  }
  const product = await db.get('SELECT id, name FROM products WHERE id = ? AND company_id = ?', product_id, req.companyId);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  await db.run('DELETE FROM product_ingredients WHERE product_id = ? AND company_id = ?', product_id, req.companyId);
  let inserted = 0, skipped = 0;
  for (const ing of ingredients) {
    if (!ing.ingredient_id || !ing.grams_quantity) { skipped++; continue; }
    const ingredient = await db.get('SELECT id, name, company_id FROM products WHERE id = ?', ing.ingredient_id);
    if (!ingredient || ingredient.company_id !== req.companyId) { skipped++; continue; }
    await db.run('INSERT INTO product_ingredients (id, company_id, product_id, ingredient_id, grams_quantity) VALUES (?,?,?,?,?)',
      uuidv4(), req.companyId, product_id, ing.ingredient_id, ing.grams_quantity);
    inserted++;
  }
  res.json({ success: true, message: `Receta guardada (${inserted} ingredientes, ${skipped} omitidos)` });
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM product_ingredients WHERE product_id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

module.exports = router;
