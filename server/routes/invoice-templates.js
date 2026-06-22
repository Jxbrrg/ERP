const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  let tpl = await db.get(`SELECT * FROM invoice_templates WHERE company_id = ?`, req.companyId);
  if (!tpl) {
    const id = uuidv4();
    await db.run(`INSERT INTO invoice_templates (id, company_id) VALUES (?, ?)`, id, req.companyId);
    tpl = await db.get(`SELECT * FROM invoice_templates WHERE company_id = ?`, req.companyId);
  }
  res.json(tpl);
}));

router.put('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { header_text, footer_text, terms_text, font_family, font_size, primary_color, show_logo, show_nit } = req.body;
  let existing = await db.get(`SELECT id FROM invoice_templates WHERE company_id = ?`, req.companyId);
  if (!existing) {
    const id = uuidv4();
    await db.run(`INSERT INTO invoice_templates (id, company_id) VALUES (?, ?)`, id, req.companyId);
    existing = { id };
  }
  await db.run(`UPDATE invoice_templates SET header_text=?, footer_text=?, terms_text=?, font_family=?, font_size=?, primary_color=?, show_logo=?, show_nit=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    header_text || '', footer_text || '', terms_text || '', font_family || 'Inter', font_size || 12, primary_color || '#6366f1', show_logo ?? 1, show_nit ?? 1, existing.id);
  const tpl = await db.get(`SELECT * FROM invoice_templates WHERE id = ?`, existing.id);
  res.json(tpl);
}));

module.exports = router;
