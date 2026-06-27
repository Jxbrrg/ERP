const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Registro de ventas por empleado para Daniel
router.get('/sales-by-employee', ah(async (req, res) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const salesByEmployee = await db.all(`
    SELECT 
      e.name as employee_name,
      COUNT(o.id) as total_ventas,
      SUM(o.total) as valor_vendido,
      SUM(o.daniel_profit) as ganancia_generada
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    WHERE o.company_id = ? AND o.status IN ('delivered', 'confirmed', 'shipped')
    GROUP BY e.id
    ORDER BY valor_vendido DESC
  `, req.companyId);

  res.json(salesByEmployee);
}));

router.get('/dashboard', ah(async (req, res) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  // Ganancias y Costos basados en la tabla de ordenes y sus costos desglosados
  const stats = await db.get(`
    SELECT 
      SUM(total) as total_ventas,
      SUM(cup_cost) as total_vasos,
      SUM(supervisor_cost) as total_supervisor,
      SUM(labor_cost) as total_cocina,
      SUM(transport_cost) as total_transporte,
      SUM(daniel_profit) as ganancia_daniel,
      COUNT(*) as total_unidades_vendidas
    FROM orders 
    WHERE company_id = ? AND status IN ('delivered', 'confirmed', 'shipped')
  `, req.companyId);

  // Cálculo de Inversión por Unidad y Ganancia Real
  const totalCostos = (stats.total_vasos || 0) + (stats.total_supervisor || 0) + (stats.total_cocina || 0) + (stats.total_transporte || 0);
  const inversionPorUnidad = stats.total_unidades_vendidas > 0 ? (totalCostos / stats.total_unidades_vendidas) : 0;
  const gananciaRealPorUnidad = stats.total_unidades_vendidas > 0 ? ((stats.total_ventas || 0) - totalCostos) / stats.total_unidades_vendidas : 0;

  res.json({
    ventas_totales: stats.total_ventas || 0,
    costos_totales: totalCostos,
    ganancia_neta_daniel: stats.ganancia_daniel || 0,
    inversion_promedio_por_unidad: inversionPorUnidad,
    ganancia_neta_por_unidad: gananciaRealPorUnidad,
    detalles: {
      vasos: stats.total_vasos,
      supervisor: stats.total_supervisor,
      cocina: stats.total_cocina,
      transporte: stats.total_transporte
    }
  });
}));

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const txns = await db.all('SELECT * FROM transactions WHERE company_id = ? ORDER BY created_at DESC', req.companyId);
  res.json(txns);
}));

router.get('/summary', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const income = await db.get("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'income' AND company_id = ?", req.companyId);
  const expense = await db.get("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'expense' AND company_id = ?", req.companyId);
  const byMonth = await db.all(`
    SELECT strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
    FROM transactions WHERE company_id = ? GROUP BY month ORDER BY month DESC LIMIT 12
  `, req.companyId);
  const byCategory = await db.all(`
    SELECT category, SUM(amount) as total FROM transactions WHERE type='expense' AND company_id = ?
    GROUP BY category ORDER BY total DESC
  `, req.companyId);
  res.json({ income: income.total, expense: expense.total, balance: income.total - expense.total, byMonth, byCategory });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { type, category, description, amount, payment_method, reference, date } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM transactions WHERE company_id = ?', req.companyId);
  const code = `TXN-${String((result.c || 0) + 1).padStart(4, '0')}`;
  await db.run('INSERT OR IGNORE INTO transactions (id,code,type,category,description,amount,payment_method,reference,date,company_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    id, code, type, category, description, amount, payment_method || 'cash', reference || `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, date, req.companyId, req.user.id);
  const txn = await db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', id, req.companyId);
  res.status(201).json(txn);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM transactions WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

module.exports = router;
