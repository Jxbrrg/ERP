const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isSQLite = !dbUrl || dbUrl === 'null' || dbUrl === '';
module.exports = require(isSQLite ? './db-sqlite' : './db-pg');
