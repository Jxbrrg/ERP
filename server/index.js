require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('./auth');
const db = require('./db');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = !!process.env.VERCEL;
const JWT_SECRET = process.env.SESSION_SECRET || 'synex-jwt-secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
      req.user = await db.get('SELECT * FROM users WHERE email = ?', decoded.email);
    } catch (_) {}
  }
  next();
}

app.use(authMiddleware);

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Attach company scope to all /api/* requests
app.use('/api', (req, res, next) => {
  if (req.user) {
    req.companyId = req.user.company_id;
    req.isSuperAdmin = req.user.role === 'superadmin';
  }
  next();
});

// Subscription check middleware (blocks expired trials)
app.use('/api', async (req, res, next) => {
  if (!req.user || req.isSuperAdmin) return next();
  if (req.path.startsWith('/billing/')) return next();
  if (req.path.startsWith('/company/branding')) return next();
  if (req.path.startsWith('/company/api-key')) return next();
  if (req.path.startsWith('/api-keys')) return next();

  try {
    const company = await db.get('SELECT plan, plan_expires_at, id FROM companies WHERE id = ?', req.companyId);
    if (!company) return next();
    const sub = await db.get("SELECT status FROM company_subscriptions WHERE company_id = ? AND status IN ('active','past_due') ORDER BY created_at DESC LIMIT 1", req.companyId);
    if (sub && sub.status === 'active') return next();
    if (company.plan_expires_at && new Date(company.plan_expires_at) > new Date()) return next();
    if (company.plan === 'cancelled' || company.plan === 'free') {
      return res.status(402).json({ error: 'Suscripción vencida', code: 'subscription_expired' });
    }
    return res.status(402).json({ error: 'Tu período de prueba ha terminado. Selecciona un plan en Configuración para continuar.', code: 'trial_expired' });
  } catch (e) {
    console.error('Subscription check error:', e);
    next();
  }
});

app.get('/auth/me', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const company = await db.get('SELECT name, slug, logo_url, primary_color, secondary_color, plan, plan_expires_at FROM companies WHERE id = ?', req.user.company_id);
  const sub = await db.get("SELECT status FROM company_subscriptions WHERE company_id = ? AND status IN ('active','past_due','cancelled') ORDER BY created_at DESC LIMIT 1", req.user.company_id);
  const subscriptionStatus = sub?.status || (company.plan === 'trial' ? 'trial' : 'none');
  const expired = company.plan_expires_at && new Date(company.plan_expires_at) < new Date();
  res.json({ ...req.user, company: { ...company, subscriptionStatus, expired } });
}));

app.post('/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Debug: check DB state and force backfill
app.post('/auth/forgot-password', ah(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  const user = await db.get('SELECT id, email, name FROM users WHERE email = ?', email);
  const { sendEmail } = require('./services/email');
  if (!user) {
    await sendEmail({ to: email, subject: 'Restablecer contraseña - Synex', html: `<p>Si existe una cuenta con este correo, recibirás instrucciones.</p>` });
    return res.json({ success: true });
  }
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await db.run('INSERT INTO password_reset_tokens (id, email, token, expires_at) VALUES (?,?,?,?)', require('uuid').v4(), email, token, expiresAt);
  const resetLink = `${process.env.APP_URL || 'https://erp-teal-phi.vercel.app'}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Restablece tu contraseña - Synex',
    html: `<h2>Hola ${user.name || 'usuario'}</h2><p>Recibimos una solicitud para restablecer tu contraseña.</p><p>Haz clic en el enlace para crear una nueva contraseña (válido por 1 hora):</p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">Restablecer contraseña</a><p>Si no solicitaste esto, ignora este mensaje.</p>`
  });
  res.json({ success: true });
}));

app.post('/auth/reset-password', ah(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
  const record = await db.get('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime(\'now\')', token);
  if (!record) return res.status(400).json({ error: 'Token inválido o expirado' });
  const { createHash } = require('crypto');
  const salt = require('crypto').randomBytes(16).toString('hex');
  const hash = require('crypto').pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  await db.run('UPDATE users SET password_hash = ? WHERE email = ?', salt + ':' + hash, record.email);
  await db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', record.id);
  res.json({ success: true });
}));

app.get('/auth/debug', ah(async (req, res) => {
  const crypto = require('crypto');
  const demoHash = crypto.pbkdf2Sync('admin123', 'demo', 1000, 64, 'sha512').toString('hex');
  const result = await db.run('UPDATE users SET password_hash = ? WHERE password_hash IS NULL', 'demo:' + demoHash);
  const users = await db.all('SELECT email, password_hash IS NOT NULL as has_pw, substr(password_hash,1,20) as pw_prefix FROM users');
  const cols = await db.all("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
  res.json({ backfill_affected: result?.changes ?? result?.rowCount ?? 0, users, columns: cols });
}));

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (!user.password_hash) return res.status(401).json({ error: 'Sin contraseña asignada. Usa "Establecer contraseña"' });
    const parts = user.password_hash.split(':');
    const salt = parts[0];
    const hash = parts.slice(1).join(':');
    const inputHash = require('crypto').pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== inputHash) return res.status(401).json({ error: 'Contraseña incorrecta' });
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Error al iniciar sesión' });
  }
});

// === Registration ===
// === Password reset for legacy users (registered before password auth) ===
app.post('/auth/set-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', salt + ':' + passwordHash, user.id);
    res.json({ success: true, message: 'Contraseña establecida. Ahora puedes iniciar sesión.' });
  } catch (err) {
    console.error('Set-password error:', err);
    res.status(500).json({ error: err.message || 'Error al establecer contraseña' });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { companyName, name, email, password, phone, nit, logoBase64, primary_color, secondary_color } = req.body;
    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (!email.toLowerCase().endsWith('@synex.com')) {
      return res.status(400).json({ error: 'Solo correos @synex.com pueden registrarse' });
    }
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
    if (existingUser) return res.status(409).json({ error: 'El email ya está registrado' });

    const companyId = require('uuid').v4();
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    const expires = new Date(); expires.setDate(expires.getDate() + 14);
    await db.run('INSERT INTO companies (id, name, slug, plan, owner_id, plan_expires_at, logo_url, primary_color, secondary_color, phone, nit) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      companyId, companyName, slug, 'trial', null, expires.toISOString(), logoBase64 || null, primary_color || '#6366f1', secondary_color || '#06b6d4', phone || null, nit || null);

    const userId = require('uuid').v4();
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    await db.run('INSERT INTO users (id, company_id, email, name, role, password_hash) VALUES (?,?,?,?,?,?)',
      userId, companyId, email, name, 'admin', salt + ':' + passwordHash);

    await db.run('UPDATE companies SET owner_id = ? WHERE id = ?', userId, companyId);

    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ user, token, companyId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Error al registrar empresa' });
  }
});

// === Super Admin routes ===
app.get('/api/admin/companies', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  // Exclude the superadmin's own company (platform owner)
  const companies = await db.all(`
    SELECT c.*, (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count
    FROM companies c 
    WHERE c.id != ? 
    ORDER BY c.created_at DESC
  `, req.companyId);
  res.json(companies);
}));

app.get('/api/admin/companies/:id', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const company = await db.get('SELECT * FROM companies WHERE id = ?', req.params.id);
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });
  const users = await db.all('SELECT id, name, email, role FROM users WHERE company_id = ?', req.params.id);
  res.json({ ...company, users });
}));

app.put('/api/admin/companies/:id/plan', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const { plan } = req.body;
  await db.run('UPDATE companies SET plan = ? WHERE id = ?', plan, req.params.id);
  res.json({ success: true });
}));

app.put('/api/admin/companies/:id', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const { name, slug } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  await db.run('UPDATE companies SET name = ?, slug = COALESCE(?, slug) WHERE id = ?', name, slug || null, req.params.id);
  res.json({ success: true });
}));

app.delete('/api/admin/companies/:id', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const companyId = req.params.id;
  const company = await db.get('SELECT id, name FROM companies WHERE id = ?', companyId);
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

  // Delete all related data (cascade delete)
  await db.run('DELETE FROM payment_history WHERE company_id = ?', companyId);
  await db.run('DELETE FROM company_subscriptions WHERE company_id = ?', companyId);
  await db.run('DELETE FROM notifications WHERE company_id = ?', companyId);
  await db.run('DELETE FROM tasks WHERE company_id = ?', companyId);
  await db.run('DELETE FROM projects WHERE company_id = ?', companyId);
  await db.run('DELETE FROM interactions WHERE company_id = ?', companyId);
  await db.run('DELETE FROM transactions WHERE company_id = ?', companyId);
  await db.run('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE company_id = ?)', companyId);
  await db.run('DELETE FROM orders WHERE company_id = ?', companyId);
  await db.run('DELETE FROM products WHERE company_id = ?', companyId);
  await db.run('DELETE FROM customers WHERE company_id = ?', companyId);
  await db.run('DELETE FROM categories WHERE company_id = ?', companyId);
  await db.run('DELETE FROM attendance WHERE employee_id IN (SELECT id FROM employees WHERE company_id = ?)', companyId);
  await db.run('DELETE FROM employees WHERE company_id = ?', companyId);
  await db.run('DELETE FROM users WHERE company_id = ?', companyId);
  await db.run('DELETE FROM companies WHERE id = ?', companyId);

  res.json({ success: true, message: `Empresa "${company.name}" eliminada` });
}));

app.get('/api/admin/alerts', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const expiringSoon = await db.all(`
    SELECT id, name, slug, plan, plan_expires_at,
    (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count
    FROM companies c WHERE plan_expires_at IS NOT NULL
    AND datetime(plan_expires_at) <= datetime('now', '+7 days')
    AND plan != 'cancelled' ORDER BY plan_expires_at ASC
  `);
  res.json({ expiringSoon });
}));

app.post('/auth/impersonate/:companyId', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const admin = await db.get('SELECT * FROM users WHERE company_id = ? AND role = ? LIMIT 1', req.params.companyId, 'admin');
  if (!admin) return res.status(404).json({ error: 'No se encontró un administrador para esta empresa' });
  const token = jwt.sign({ email: admin.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ user: admin, token });
}));

app.post('/auth/unimpersonate', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  res.json({ success: true });
}));

// === Admin: Seed demo data for a company (superadmin) ===
app.post('/api/admin/companies/:id/seed', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const companyId = req.params.id;
  const company = await db.get('SELECT id FROM companies WHERE id = ?', companyId);
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

  const { seedData } = require('./db');
  await seedData(companyId);

  res.json({ success: true, message: 'Datos de prueba generados' });
}));

// === Company Admin: Seed demo data for own company ===
app.post('/api/company/seed', ah(async (req, res) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado' });
  const companyId = req.companyId;
  const company = await db.get('SELECT id FROM companies WHERE id = ?', companyId);
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

  const { seedData } = require('./db');
  await seedData(companyId);

  res.json({ success: true, message: 'Datos de prueba generados para tu empresa' });
}));

// === Recreate CEO Superadmin (emergency) ===
app.post('/api/setup/create-ceo', ah(async (req, res) => {
  const { email, password, name } = req.body;
  const targetEmail = email || 'ceo@synex.com';
  const targetPassword = password || 'J032902112006';
  const targetName = name || 'CEO Synex';

  const crypto = require('crypto');
  const { v4: uuidv4 } = require('uuid');

  // Find or create Synex Demo company
  let company = await db.get("SELECT id FROM companies WHERE slug = 'synex' OR slug LIKE 'synex-demo%' LIMIT 1");
  if (!company) {
    const companyId = uuidv4();
    await db.run('INSERT INTO companies (id, name, slug, plan) VALUES (?,?,?,?)',
      companyId, 'Synex Demo', 'synex', 'enterprise');
    company = { id: companyId };
  }

  const companyId = company.id;

  // Delete existing CEO if exists
  await db.run('DELETE FROM users WHERE email = ?', targetEmail);

  // Create CEO superadmin
  const userId = uuidv4();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(targetPassword, salt, 1000, 64, 'sha512').toString('hex');
  await db.run('INSERT INTO users (id, company_id, email, name, role, password_hash) VALUES (?,?,?,?,?,?)',
    userId, companyId, targetEmail, targetName, 'superadmin', salt + ':' + passwordHash);

  const token = jwt.sign({ email: targetEmail }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, message: 'CEO superadmin creado', user: { email: targetEmail, name: targetName, role: 'superadmin' }, token });
}));

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/accounting', require('./routes/accounting'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/company', require('./routes/backup'));
app.use('/api/company', require('./routes/invoice-templates'));
app.use('/api', require('./routes/api'));

app.post('/api/leads', ah(async (req, res) => {
  const { name, company, phone, email, plan_name } = req.body;
  if (!name || !phone || !plan_name) return res.status(400).json({ error: 'Nombre, teléfono y plan requeridos' });
  const id = require('uuid').v4();
  await db.run('INSERT INTO leads (id, name, company, phone, email, plan_name) VALUES (?,?,?,?,?,?)', id, name, company || '', phone, email || '', plan_name);
  res.status(201).json({ success: true });
}));

app.get('/api/admin/leads', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const leads = await db.all('SELECT * FROM leads ORDER BY created_at DESC LIMIT 100');
  res.json(leads);
}));

app.put('/api/admin/leads/:id', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const { status, notes } = req.body;
  await db.run('UPDATE leads SET status=?, notes=? WHERE id=?', status || 'new', notes || '', req.params.id);
  res.json({ success: true });
}));

app.post('/api/contact', ah(async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Nombre, email y mensaje requeridos' });
  const id = require('uuid').v4();
  await db.run('INSERT INTO contacts (id, name, email, phone, message) VALUES (?,?,?,?,?)', id, name, email, phone || '', message);
  const { sendEmail } = require('./services/email');
  await sendEmail({
    to: process.env.NOTIFY_EMAIL || 'Synex@synex.com',
    subject: `Nuevo contacto: ${name}`,
    html: `<h2>Nuevo mensaje de contacto</h2><p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Teléfono:</strong> ${phone || '—'}</p><p><strong>Mensaje:</strong></p><p>${message}</p>`
  });
  res.status(201).json({ success: true });
}));

app.get('/api/admin/contacts', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const contacts = await db.all('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100');
  res.json(contacts);
}));

app.get('/api/notifications', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const notifs = await db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', req.user.id);
  res.json(notifs);
}));

app.post('/api/notifications/:id/read', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  await db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  res.json({ success: true });
}));

// === Branding ===
app.get('/api/company/branding', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const company = await db.get('SELECT name, slug, logo_url, primary_color, secondary_color FROM companies WHERE id = ?', req.companyId);
  res.json(company);
}));

app.put('/api/company/branding', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { logo_url, primary_color, secondary_color } = req.body;
  await db.run('UPDATE companies SET logo_url=?, primary_color=?, secondary_color=? WHERE id=?',
    logo_url, primary_color || '#6366f1', secondary_color || '#06b6d4', req.companyId);
  res.json({ success: true });
}));

// === Admin Branding (Superadmin can edit any company) ===
app.get('/api/admin/companies/:id/branding', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const company = await db.get('SELECT logo_url, primary_color, secondary_color FROM companies WHERE id = ?', req.params.id);
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });
  res.json(company);
}));

app.put('/api/admin/companies/:id/branding', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const { logo_url, primary_color, secondary_color } = req.body;
  await db.run('UPDATE companies SET logo_url=?, primary_color=?, secondary_color=? WHERE id=?',
    logo_url, primary_color || '#6366f1', secondary_color || '#06b6d4', req.params.id);
  res.json({ success: true });
}));

// === API Key ===
app.get('/api/company/api-key', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const company = await db.get('SELECT api_key FROM companies WHERE id = ?', req.companyId);
  res.json({ apiKey: company?.api_key || null });
}));

app.post('/api/company/api-key', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const apiKey = 'synex_' + require('crypto').randomBytes(24).toString('hex');
  await db.run('UPDATE companies SET api_key = ? WHERE id = ?', apiKey, req.companyId);
  res.json({ apiKey });
}));

// API Key auth middleware for external integrations
app.use('/api/external', async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key requerida' });
  const company = await db.get('SELECT id FROM companies WHERE api_key = ?', apiKey);
  if (!company) return res.status(403).json({ error: 'API key inválida' });
  req.companyId = company.id;
  next();
});

app.get('/api/external/companies/me', ah(async (req, res) => {
  const company = await db.get('SELECT id, name, slug, plan FROM companies WHERE id = ?', req.companyId);
  res.json(company);
}));

// Global error handler - must be before static file serving
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(status).json({ error: message });
  }
  res.status(status).send(`<html><body><h1>Error ${status}</h1><p>${message}</p></body></html>`);
});

// Serve built frontend in local dev (production mode)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

if (!isVercel) {
  db.init().then(() => {
    app.listen(PORT, () => {
      console.log(`Synex Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
}

module.exports = app;
