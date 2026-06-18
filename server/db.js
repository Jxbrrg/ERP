const isSQLite = !process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.VERCEL;
module.exports = require(isSQLite ? './db-sqlite' : './db-pg');
