const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  let records;
  if (req.isEmployee) {
    records = await db.all(`
      SELECT p.*, e.name as employee_name, e.position, e.salary as employee_salary
      FROM payroll p JOIN employees e ON p.employee_id = e.id
      WHERE p.company_id = ? AND e.email = ? ORDER BY p.created_at DESC
    `, req.companyId, req.user.email);
  } else {
    records = await db.all(`
      SELECT p.*, e.name as employee_name, e.position, e.salary as employee_salary
      FROM payroll p JOIN employees e ON p.employee_id = e.id
      WHERE p.company_id = ? ORDER BY p.created_at DESC
    `, req.companyId);
  }
  res.json(records);
}));

router.get('/summary', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.isEmployee) {
    const emp = await db.get('SELECT id, name, position, department, salary, status FROM employees WHERE company_id = ? AND email = ?', req.companyId, req.user.email);
    const employees = emp ? [emp] : [];
    return res.json({ employees, totalPayroll: emp ? Number(emp.salary || 0) : 0, activeCount: emp && emp.status === 'active' ? 1 : 0 });
  }
  const employees = await db.all(`
    SELECT id, name, position, department, salary, status FROM employees
    WHERE company_id = ? ORDER BY name
  `, req.companyId);
  const totalPayroll = employees.reduce((s, e) => s + Number(e.salary || 0), 0);
  res.json({ employees, totalPayroll, activeCount: employees.filter(e => e.status === 'active').length });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { employee_id, amount, period, payment_date, notes } = req.body;
  const id = uuidv4();
  await db.run(`INSERT INTO payroll (id,company_id,employee_id,amount,period,payment_date,notes,created_by)
    VALUES (?,?,?,?,?,?,?,?)`, id, req.companyId, employee_id, amount, period, payment_date, notes, req.user.id);
  const record = await db.get(`
    SELECT p.*, e.name as employee_name FROM payroll p
    JOIN employees e ON p.employee_id = e.id WHERE p.id = ?
  `, id);
  res.status(201).json(record);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { status, payment_date, notes } = req.body;
  await db.run('UPDATE payroll SET status=?, payment_date=?, notes=? WHERE id=? AND company_id=?',
    status, payment_date, notes, req.params.id, req.companyId);
  const record = await db.get(`
    SELECT p.*, e.name as employee_name FROM payroll p
    JOIN employees e ON p.employee_id = e.id WHERE p.id = ?
  `, req.params.id);
  res.json(record);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM payroll WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

module.exports = router;
