let serverError = null;
let app;

try {
  app = require('../server/index');
} catch (e) {
  serverError = e;
  app = (req, res) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Server load failed',
      message: e.message,
      stack: (e.stack || '').split('\n').slice(0, 10).join('\n')
    }));
  };
  module.exports = app;
  return;
}

try {
  const db = require('../server/db');
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    db.init().catch(err => console.error('DB init failed:', err));
  }
} catch (e) {
  console.error('DB module error:', e.message);
}

module.exports = app;
