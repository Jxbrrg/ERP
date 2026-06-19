const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://localhost:99999/test', ssl: false });

const exports = {};

const initPromise = (async () => {
  try {
    const r = await pool.query('SELECT 1');
    console.log('query result:', r.rows);
  } catch (e) {
    console.error('DB init error:', e.message);
  }
})();

exports.get = async () => { await initPromise; return 'ok'; };
exports.all = async () => { await initPromise; return 'ok'; };
exports.run = async () => { await initPromise; return 'ok'; };

module.exports = exports;
