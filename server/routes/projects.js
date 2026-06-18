const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const projects = await db.all(`
    SELECT p.*, c.name as customer_name FROM projects p
    LEFT JOIN customers c ON p.customer_id = c.id
    ORDER BY p.created_at DESC
  `);
  res.json(projects);
}));

router.get('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const proj = await db.get(`
    SELECT p.*, c.name as customer_name FROM projects p
    LEFT JOIN customers c ON p.customer_id = c.id WHERE p.id = ?
  `, req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });
  const tasks = await db.all(`
    SELECT t.*, e.name as assigned_name FROM tasks t
    LEFT JOIN employees e ON t.assigned_to = e.id
    WHERE t.project_id = ? ORDER BY t.created_at DESC
  `, req.params.id);
  res.json({ ...proj, tasks });
}));

router.post('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, customer_id, start_date, end_date, budget, priority } = req.body;
  const id = uuidv4();
  const result = await db.get('SELECT COUNT(*) as c FROM projects');
  const code = `PROJ-${String((result.c || 0) + 1).padStart(3, '0')}`;
  await db.run(`INSERT INTO projects (id,code,name,description,customer_id,start_date,end_date,budget,priority,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)`, id, code, name, description, customer_id, start_date, end_date, budget, priority || 'medium', req.user.id);
  const proj = await db.get('SELECT * FROM projects WHERE id = ?', id);
  res.status(201).json(proj);
}));

router.put('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, customer_id, start_date, end_date, budget, status, priority } = req.body;
  await db.run(`UPDATE projects SET name=?,description=?,customer_id=?,start_date=?,end_date=?,budget=?,status=?,priority=? WHERE id=?`,
    name, description, customer_id, start_date, end_date, budget, status, priority, req.params.id);
  const proj = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
  res.json(proj);
}));

router.delete('/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM projects WHERE id = ?', req.params.id);
  res.json({ success: true });
}));

router.post('/:id/tasks', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, assigned_to, priority, due_date, estimated_hours } = req.body;
  const id = uuidv4();
  await db.run(`INSERT INTO tasks (id,project_id,name,description,assigned_to,priority,due_date,estimated_hours,created_by)
    VALUES (?,?,?,?,?,?,?,?,?)`, id, req.params.id, name, description, assigned_to, priority || 'medium', due_date, estimated_hours, req.user.id);
  const task = await db.get('SELECT t.*, e.name as assigned_name FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.id = ?', id);
  res.status(201).json(task);
}));

router.put('/tasks/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, assigned_to, status, priority, due_date, estimated_hours, actual_hours } = req.body;
  await db.run(`UPDATE tasks SET name=?,description=?,assigned_to=?,status=?,priority=?,due_date=?,estimated_hours=?,actual_hours=? WHERE id=?`,
    name, description, assigned_to, status, priority, due_date, estimated_hours, actual_hours, req.params.id);
  const task = await db.get('SELECT t.*, e.name as assigned_name FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.id = ?', req.params.id);
  res.json(task);
}));

router.delete('/tasks/:id', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('DELETE FROM tasks WHERE id = ?', req.params.id);
  res.json({ success: true });
}));

module.exports = router;
