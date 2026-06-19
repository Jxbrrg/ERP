require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('./auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = !!process.env.VERCEL;
const JWT_SECRET = process.env.SESSION_SECRET || 'nexus-jwt-secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

function parseCookies(req) {
  const c = {};
  if (req.headers?.cookie) {
    req.headers.cookie.split(';').forEach(s => {
      const p = s.indexOf('=');
      if (p > 0) c[s.slice(0, p).trim()] = s.slice(p + 1).trim();
    });
  }
  return c;
}

async function authMiddleware(req, res, next) {
  const token = parseCookies(req).nexus_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await db.get('SELECT * FROM users WHERE id = ?', decoded.id);
    } catch (_) {}
  }
  next();
}

app.use(authMiddleware);

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const cookieOpts = [
  'nexus_token=TOKEN',
  'HttpOnly',
  'Path=/',
  'SameSite=Lax',
  isVercel ? 'Secure' : '',
  'Max-Age=86400'
].filter(Boolean).join('; ');

if (process.env.GOOGLE_CLIENT_ID) {
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: CLIENT_URL + '/login?error=true' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.setHeader('Set-Cookie', cookieOpts.replace('TOKEN', token));
    res.redirect(CLIENT_URL + '/dashboard');
  }
);
}

app.get('/auth/me', (req, res) => {
  if (req.user) return res.json(req.user);
  res.status(401).json({ error: 'No autenticado' });
});

app.post('/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'nexus_token=; HttpOnly; Path=/; SameSite=Lax; MaxAge=0' + (isVercel ? '; Secure' : ''));
  res.json({ success: true });
});

app.post('/auth/demo', ah(async (req, res) => {
  const { email } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.status(401).json({ error: 'No encontrado. Usa: admin@synexerp.com, 1044619997@synexerp.com' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
  res.setHeader('Set-Cookie', cookieOpts.replace('TOKEN', token));
  req.user = user;
  res.json(user);
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
