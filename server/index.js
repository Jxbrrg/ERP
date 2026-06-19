require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const passport = require('./auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = !!process.env.VERCEL;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieSession({
  name: 'nexus-session',
  secret: process.env.SESSION_SECRET || 'nexus-secret',
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: 'lax',
  secure: isVercel,
}));
app.use(passport.initialize());
app.use(passport.session());

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

if (process.env.GOOGLE_CLIENT_ID) {
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=true` }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`);
  }
);
}

app.get('/auth/me', (req, res) => {
  if (req.user) return res.json(req.user);
  res.status(401).json({ error: 'No autenticado' });
});

app.post('/auth/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    req.session = null;
    res.json({ success: true });
  });
});

app.post('/auth/demo', ah(async (req, res) => {
  const { email } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) return res.status(401).json({ error: 'No encontrado. Usa: admin@nexus.com, 1044619997@nexus.com' });
  req.login(user, err => {
    if (err) return res.status(500).json({ error: 'Error al iniciar sesión' });
    res.json(user);
  });
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

// Initialize DB tables on first start
if (!isVercel) {
  db.init().then(() => {
    app.listen(PORT, () => {
      console.log(`NEXUS ERP Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
}

module.exports = app;
