const results = {};

function test(label, fn) {
  try { fn(); results[label] = 'ok' } catch(e) { results[label] = e.message }
}

test('require express', () => { const e = require('express'); results['express typeof'] = typeof e });
test('require cors', () => require('cors'));
test('require jsonwebtoken', () => require('jsonwebtoken'));
test('require passport', () => require('passport'));
test('require passport-google-oauth20', () => require('passport-google-oauth20'));
test('require pg', () => { const p = require('pg'); results['pg typeof'] = typeof p.Pool });
test('require twilio', () => require('twilio'));
test('require uuid', () => require('uuid'));
test('require dotenv', () => require('dotenv'));

test('require ./auth', () => require('../server/auth'));
test('require ./db', () => { const db = require('../server/db'); results['db typeof'] = typeof db.get });
test('require passport-strategy', () => require('passport-strategy'));
test('require passport-oauth2', () => require('passport-oauth2'));
test('require oauth', () => require('oauth'));

test('full server/index', () => {
  const app = require('../server/index');
  results['app typeof'] = typeof app;
  results['app routes'] = app.routes ? 'yes' : 'no';
  module.exports = app;
});

results['DATABASE_URL'] = !!process.env.DATABASE_URL;
results['VERCEL'] = !!process.env.VERCEL;
results['NODE'] = process.version;

if (!module.exports || typeof module.exports === 'object' && !module.exports._router) {
  const express = require('express');
  const diag = express();
  diag.all('*', (req, res) => res.json(results));
  module.exports = diag;
}
