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

app.get('/auth/me', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const company = await db.get('SELECT name, slug, logo_url, primary_color, secondary_color, plan FROM companies WHERE id = ?', req.user.company_id);
  res.json({ ...req.user, company });
}));

app.post('/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Debug: check DB state and force backfill
app.get('/auth/debug', ah(async (req, res) => {
  const crypto = require('crypto');
  const demoHash = crypto.pbkdf2Sync('admin123', 'demo', 1000, 64, 'sha512').toString('hex');
  const result = db.prepare('UPDATE users SET password_hash = ? WHERE password_hash IS NULL').run('demo:' + demoHash);
  const users = await db.all('SELECT email, password_hash IS NOT NULL as has_pw, substr(password_hash,1,20) as pw_prefix FROM users');
  const cols = await db.all("PRAGMA table_info('users')");
  res.json({ backfill_affected: result.changes, users, columns: cols });
}));

app.post('/auth/login', ah(async (req, res) => {
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
}));

// === Registration ===
// === Password reset for legacy users (registered before password auth) ===
app.post('/auth/set-password', ah(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', salt + ':' + passwordHash, user.id);
  res.json({ success: true, message: 'Contraseña establecida. Ahora puedes iniciar sesión.' });
}));

app.post('/auth/register', ah(async (req, res) => {
  const { companyName, name, email, password } = req.body;
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
  await db.run('INSERT INTO companies (id, name, slug, plan, owner_id, plan_expires_at) VALUES (?,?,?,?,?,?)',
    companyId, companyName, slug, 'trial', null, expires.toISOString());

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
}));

// === Super Admin routes ===
app.get('/api/admin/companies', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const companies = await db.all(`
    SELECT c.*, (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count
    FROM companies c ORDER BY c.created_at DESC
  `);
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

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/accounting', require('./routes/accounting'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/projects', require('./routes/projects'));

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
  const company = await db.get('SELECT logo_url, primary_color, secondary_color FROM companies WHERE id = ?', req.companyId);
  res.json(company);
}));

app.put('/api/company/branding', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { logo_url, primary_color, secondary_color } = req.body;
  await db.run('UPDATE companies SET logo_url=?, primary_color=?, secondary_color=? WHERE id=?',
    logo_url, primary_color || '#6366f1', secondary_color || '#06b6d4', req.companyId);
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
