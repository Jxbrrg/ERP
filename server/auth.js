const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email found'));

    let user = await db.get('SELECT * FROM users WHERE google_id = ?', profile.id);

    if (!user) {
      user = await db.get('SELECT * FROM users WHERE email = ?', email);
    }

    if (user) {
      await db.run('UPDATE users SET google_id = ?, avatar = ?, last_login = NOW() WHERE id = ?',
        profile.id, profile.photos?.[0]?.value || null, user.id);
      user = await db.get('SELECT * FROM users WHERE id = ?', user.id);
    } else {
      const id = uuidv4();
      await db.run(`INSERT INTO users (id, google_id, email, name, avatar, role, last_login)
        VALUES (?, ?, ?, ?, ?, 'user', NOW())`,
        id, profile.id, email, profile.displayName, profile.photos?.[0]?.value || null);
      user = await db.get('SELECT * FROM users WHERE id = ?', id);
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

module.exports = passport;
