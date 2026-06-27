const express = require('express');
const app = express();

// Health & diagnose BEFORE loading server
app.get('/api/health', (req, res) => res.json({ ok: true, node: process.version }));
app.get('/api/diagnose', (req, res) => {
  const mods = {};
  for (const m of ['dotenv','express','cors','jsonwebtoken','passport','passport-google-oauth20','pg','twilio','uuid']) {
    try { require(m); mods[m] = 'ok' } catch(e) { mods[m] = 'error: ' + e.message }
  }
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  res.json({ modules: mods, DATABASE_URL_set: !!dbUrl, DB_URL_length: dbUrl ? dbUrl.length : 0 });
});

// Try loading server app
try {
  const serverApp = require('../server/index');
  app.use(serverApp);
} catch (e) {
  console.error('Server load failed:', e.message);
  app.all('*', (req, res) => res.status(500).json({ error: 'Server load failed', message: e.message }));
}

module.exports = app;
