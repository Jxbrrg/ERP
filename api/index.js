const app = require('../server/index');
const db = require('../server/db');

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  db.init().then(() => console.log('DB initialized')).catch(err => console.error('DB init failed:', err));
}

module.exports = app;
