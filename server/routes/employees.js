const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const employees = await db.all('SELECT * FROM employees WHERE company_id = ? ORDER BY created_at DESC', req.companyId);
  res.json(employees);
}));

router.get('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const emp = await db.get('SELECT * FROM employees WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  const attendance = await db.all('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30', req.params.id);
  res.json({ ...emp, attendance });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, position, department, salary, hire_date, role } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM employees WHERE company_id = ?', req.companyId);
  const code = `EMP-${String((result.c || 0) + 1).padStart(3, '0')}`;
  await db.run(`INSERT INTO employees (id,code,name,email,phone,position,department,salary,hire_date,company_id,created_by,role)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, id, code, name, email, phone, position, department, salary, hire_date, req.companyId, req.user.id, role || 'editor');
  const emp = await db.get('SELECT * FROM employees WHERE id = ? AND company_id = ?', id, req.companyId);
  res.status(201).json(emp);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, position, department, salary, status, role } = req.body;
  await db.run(`UPDATE employees SET name=?,email=?,phone=?,position=?,department=?,salary=?,status=?,role=? WHERE id=? AND company_id=?`,
    name, email, phone, position, department, salary, status, role || 'editor', req.params.id, req.companyId);
  const emp = await db.get('SELECT * FROM employees WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json(emp);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM employees WHERE id = ? AND company_id = ?', req.params.id, req.companyId);
  res.json({ success: true });
}));

module.exports = router;
