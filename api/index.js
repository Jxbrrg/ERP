const results = { ok: true, step: 0, node: process.version, vercel: !!process.env.VERCEL };

try {
  results.step = 1;
  const express = require('express');
  results.express = 'ok';

  results.step = 2;
  const cors = require('cors');
  results.cors = 'ok';

  results.step = 3;
  const jwt = require('jsonwebtoken');
  results.jwt = 'ok';

  results.step = 4;
  const passport = require('passport');
  results.passport = 'ok';

  results.step = 5;
  const pg = require('pg');
  results.pg = 'ok';

  results.step = 6;
  const uuid = require('uuid');
  results.uuid = 'ok';

  results.step = 7;
  const dotenv = require('dotenv');
  results.dotenv = 'ok';

  results.step = 8;
  const db = require('../server/db');
  results.db = 'ok';
  results.dbUrl = !!process.env.DATABASE_URL;

  results.step = 9;
  const auth = require('../server/auth');
  results.auth = 'ok';

  results.step = 10;
  const app = require('../server/index');
  results.app = 'ok';
  module.exports = app;

} catch (e) {
  results.error = e.message;
  results.stack = (e.stack || '').split('\n').slice(0, 5).join(' | ');

  const express = require('express');
  const fallback = express();
  fallback.all('*', (req, res) => res.json(results));
  module.exports = fallback;
}
