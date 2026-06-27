let serverError = null;
let app;

try {
  app = require('../server/index');
} catch (e) {
  serverError = e;
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Server load failed',
      message: e.message,
      stack: (e.stack || '').split('\n').slice(0, 10).join('\n')
    });
  });
  module.exports = app;
}

if (!serverError) {
  try {
    const db = require('../server/db');
    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      db.init().catch(err => console.error('DB init failed:', err));
    }
  } catch (e) {
    console.error('DB module error:', e.message);
  }
  module.exports = app;
}
