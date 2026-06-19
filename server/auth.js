const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
