const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const employees = await db.all('SELECT * FROM employees ORDER BY created_at DESC');
  res.json(employees);
}));

router.get('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const emp = await db.get('SELECT * FROM employees WHERE id = ?', req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  const attendance = await db.all('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30', req.params.id);
  res.json({ ...emp, attendance });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, position, department, salary, hire_date } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM employees');
  const code = `EMP-${String((result.c || 0) + 1).padStart(3, '0')}`;
  await db.run(`INSERT INTO employees (id,code,name,email,phone,position,department,salary,hire_date,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)`, id, code, name, email, phone, position, department, salary, hire_date, req.user.id);
  const emp = await db.get('SELECT * FROM employees WHERE id = ?', id);
  res.status(201).json(emp);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, position, department, salary, status } = req.body;
  await db.run(`UPDATE employees SET name=?,email=?,phone=?,position=?,department=?,salary=?,status=? WHERE id=?`,
    name, email, phone, position, department, salary, status, req.params.id);
  const emp = await db.get('SELECT * FROM employees WHERE id = ?', req.params.id);
  res.json(emp);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM employees WHERE id = ?', req.params.id);
  res.json({ success: true });
}));

module.exports = router;
