const express = require('express');
const db = require('../db');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  const totalEmployees = await db.get("SELECT COUNT(*) as count FROM employees WHERE status = 'active' AND company_id = ?", req.companyId);
  const totalProducts = await db.get('SELECT COUNT(*) as count FROM products WHERE company_id = ?', req.companyId);
  const totalOrders = await db.get("SELECT COUNT(*) as count FROM orders WHERE status != 'cancelled' AND company_id = ?", req.companyId);
  const totalCustomers = await db.get('SELECT COUNT(*) as count FROM customers WHERE company_id = ?', req.companyId);
  const lowStock = await db.get('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND company_id = ?', req.companyId);

  const monthlySales = await db.all(`
    SELECT strftime('%m', created_at) as month, SUM(total) as total
    FROM orders WHERE status != 'cancelled' AND company_id = ?
    AND created_at >= date('now', '-12 months')
    GROUP BY month ORDER BY month
  `, req.companyId);

  const orderStatus = await db.all('SELECT status, COUNT(*) as count FROM orders WHERE company_id = ? GROUP BY status', req.companyId);

  const deptEmployees = await db.all("SELECT department, COUNT(*) as count FROM employees WHERE status = 'active' AND company_id = ? GROUP BY department", req.companyId);

  const recentOrders = await db.all(`
    SELECT o.*, c.name as customer_name FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.company_id = ? ORDER BY o.created_at DESC LIMIT 5
  `, req.companyId);

  const recentTransactions = await db.all('SELECT * FROM transactions WHERE company_id = ? ORDER BY created_at DESC LIMIT 5', req.companyId);

  const activeProjects = await db.get("SELECT COUNT(*) as count FROM projects WHERE status IN ('active','planning') AND company_id = ?", req.companyId);
  const completedTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed' AND company_id = ?", req.companyId);
  const pendingTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('completed','review') AND company_id = ?", req.companyId);

  const salesByDay = await db.all(`
    SELECT date(created_at) as day, COUNT(*) as count, SUM(total) as total
    FROM orders WHERE status != 'cancelled' AND company_id = ? AND created_at >= date('now', '-30 days')
    GROUP BY day ORDER BY day
  `, req.companyId);

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
