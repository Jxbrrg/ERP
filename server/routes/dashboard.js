const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE status = ?').get('active');
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status != ?').get('cancelled');
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  const lowStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock').get();

  const monthlySales = db.prepare(`
    SELECT strftime('%m', created_at) as month, SUM(total) as total
    FROM orders WHERE status != 'cancelled'
    AND created_at >= date('now', '-12 months')
    GROUP BY month ORDER BY month
  `).all();

  const orderStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all();

  const deptEmployees = db.prepare(`
    SELECT department, COUNT(*) as count FROM employees WHERE status = 'active' GROUP BY department
  `).all();

  const recentOrders = db.prepare(`
    SELECT o.*, c.name as customer_name FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  const recentTransactions = db.prepare(`
    SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5
  `).all();

  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status IN ('active','planning')").get();
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get();
  const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('completed','review')").get();

  const salesByDay = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count, SUM(total) as total
    FROM orders WHERE status != 'cancelled' AND created_at >= date('now', '-30 days')
    GROUP BY day ORDER BY day
  `).all();

  res.json({
    totalEmployees: totalEmployees.count,
    totalProducts: totalProducts.count,
    totalOrders: totalOrders.count,
    totalCustomers: totalCustomers.count,
    lowStock: lowStock.count,
    monthlySales,
    orderStatus,
    deptEmployees,
    recentOrders,
    recentTransactions,
    activeProjects: activeProjects.count,
    completedTasks: completedTasks.count,
    pendingTasks: pendingTasks.count,
    salesByDay
  });
});

module.exports = router;
