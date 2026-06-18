const express = require('express');
const db = require('../db');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  const totalEmployees = await db.get("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
  const totalProducts = await db.get('SELECT COUNT(*) as count FROM products');
  const totalOrders = await db.get("SELECT COUNT(*) as count FROM orders WHERE status != 'cancelled'");
  const totalCustomers = await db.get('SELECT COUNT(*) as count FROM customers');
  const lowStock = await db.get('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock');

  const monthlySales = await db.all(`
    SELECT EXTRACT(MONTH FROM created_at) as month, SUM(total) as total
    FROM orders WHERE status != 'cancelled'
    AND created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY month ORDER BY month
  `);

  const orderStatus = await db.all('SELECT status, COUNT(*) as count FROM orders GROUP BY status');

  const deptEmployees = await db.all("SELECT department, COUNT(*) as count FROM employees WHERE status = 'active' GROUP BY department");

  const recentOrders = await db.all(`
    SELECT o.*, c.name as customer_name FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC LIMIT 5
  `);

  const recentTransactions = await db.all('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5');

  const activeProjects = await db.get("SELECT COUNT(*) as count FROM projects WHERE status IN ('active','planning')");
  const completedTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'");
  const pendingTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('completed','review')");

  const salesByDay = await db.all(`
    SELECT created_at::date as day, COUNT(*) as count, SUM(total) as total
    FROM orders WHERE status != 'cancelled' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY day ORDER BY day
  `);

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
}));

module.exports = router;
