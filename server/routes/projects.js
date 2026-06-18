const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const projects = db.prepare(`
    SELECT p.*, c.name as customer_name FROM projects p
    LEFT JOIN customers c ON p.customer_id = c.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(projects);
});

router.get('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const proj = db.prepare(`
    SELECT p.*, c.name as customer_name FROM projects p
    LEFT JOIN customers c ON p.customer_id = c.id WHERE p.id = ?
  `).get(req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });
  const tasks = db.prepare(`
    SELECT t.*, e.name as assigned_name FROM tasks t
    LEFT JOIN employees e ON t.assigned_to = e.id
    WHERE t.project_id = ? ORDER BY t.created_at DESC
  `).all(req.params.id);
  res.json({ ...proj, tasks });
});

router.post('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, customer_id, start_date, end_date, budget, priority } = req.body;
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get().c + 1;
  const code = `PROJ-${String(count).padStart(3, '0')}`;
  db.prepare(`INSERT INTO projects (id,code,name,description,customer_id,start_date,end_date,budget,priority,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, code, name, description, customer_id, start_date, end_date, budget, priority || 'medium', req.user.id);
  const proj = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(proj);
});

router.put('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, customer_id, start_date, end_date, budget, status, priority } = req.body;
  db.prepare(`UPDATE projects SET name=?,description=?,customer_id=?,start_date=?,end_date=?,budget=?,status=?,priority=? WHERE id=?`)
    .run(name, description, customer_id, start_date, end_date, budget, status, priority, req.params.id);
  const proj = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(proj);
});

router.delete('/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Tasks
router.post('/:id/tasks', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, assigned_to, priority, due_date, estimated_hours } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO tasks (id,project_id,name,description,assigned_to,priority,due_date,estimated_hours,created_by)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(id, req.params.id, name, description, assigned_to, priority || 'medium', due_date, estimated_hours, req.user.id);
  const task = db.prepare('SELECT t.*, e.name as assigned_name FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.id = ?').get(id);
  res.status(201).json(task);
});

router.put('/tasks/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { name, description, assigned_to, status, priority, due_date, estimated_hours, actual_hours } = req.body;
  db.prepare(`UPDATE tasks SET name=?,description=?,assigned_to=?,status=?,priority=?,due_date=?,estimated_hours=?,actual_hours=? WHERE id=?`)
    .run(name, description, assigned_to, status, priority, due_date, estimated_hours, actual_hours, req.params.id);
  const task = db.prepare('SELECT t.*, e.name as assigned_name FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.id = ?').get(req.params.id);
  res.json(task);
});

router.delete('/tasks/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
