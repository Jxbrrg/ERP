const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user || null);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email found'));

    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
    
    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    if (user) {
      db.prepare('UPDATE users SET google_id = ?, avatar = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .run(profile.id, profile.photos?.[0]?.value || null, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      const id = uuidv4();
      db.prepare(`INSERT INTO users (id, google_id, email, name, avatar, role, last_login) 
        VALUES (?, ?, ?, ?, ?, 'user', CURRENT_TIMESTAMP)`)
        .run(id, profile.id, email, profile.displayName, profile.photos?.[0]?.value || null);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

module.exports = passport;
