const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const employees = db.prepare('SELECT * FROM employees ORDER BY created_at DESC').all();
  res.json(employees);
});

router.get('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  const attendance = db.prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30').all(req.params.id);
  res.json({ ...emp, attendance });
});

router.post('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, position, department, salary, hire_date } = req.body;
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM employees').get().c + 1;
  const code = `EMP-${String(count).padStart(3, '0')}`;
  db.prepare(`INSERT INTO employees (id,code,name,email,phone,position,department,salary,hire_date,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, code, name, email, phone, position, department, salary, hire_date, req.user.id);
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  res.status(201).json(emp);
});

router.put('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, email, phone, position, department, salary, status } = req.body;
  db.prepare(`UPDATE employees SET name=?,email=?,phone=?,position=?,department=?,salary=?,status=? WHERE id=?`)
    .run(name, email, phone, position, department, salary, status, req.params.id);
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  res.json(emp);
});

router.delete('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
