const results = {};

// Test each module
const modules = ['dotenv','express','cors','jsonwebtoken','passport','passport-google-oauth20','pg','twilio','uuid'];
for (const m of modules) {
  try { require(m); results[m] = 'ok' } catch(e) { results[m] = 'error: ' + e.message }
}

// Try loading server/db
try {
  const db = require('../server/db');
  results['server/db'] = 'ok';
  results['db_type'] = process.env.DATABASE_URL || process.env.POSTGRES_URL ? 'pg' : 'sqlite';
} catch(e) {
  results['server/db'] = 'error: ' + e.message;
}

// Try loading server/auth
try {
  require('../server/auth');
  results['server/auth'] = 'ok';
} catch(e) {
  results['server/auth'] = 'error: ' + e.message;
}

// Try full server/index
try {
  const app = require('../server/index');
  results['server/index'] = 'ok';
  module.exports = app;
} catch(e) {
  results['server/index'] = 'error: ' + e.message;
  results['stack'] = (e.stack || '').split('\n').slice(0, 8).join('\n');
  const express = require('express');
  const app = express();
  app.all('*', (req, res) => res.status(500).json(results));
  module.exports = app;
}
