let app;
try {
  app = require('../server/index');
} catch (e) {
  console.error('Failed to load server:', e.message, e.stack);
  const express = require('express');
  app = express();
  app.all('*', (req, res) => res.status(500).json({ 
    error: 'Server load failed',
    message: e.message,
    stack: (e.stack || '').split('\n').slice(0, 5).join('\n')
  }));
}

if (app) {
  const db = require('../server/db');
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    db.init().then(() => console.log('DB initialized')).catch(err => console.error('DB init failed:', err));
  }
}

module.exports = app;
