const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.VERCEL ? { rejectUnauthorized: false } : false,
});

const q = (sql, params) => {
  let i = 0;
  let text = sql
    .replace(/\?/g, () => `$${++i}`)
    .replace(/INSERT OR IGNORE INTO/g, 'INSERT INTO')
    .replace(/strftime\('%m',\s*(\w+)\)/gi, "EXTRACT(MONTH FROM $1)")
    .replace(/strftime\('%Y-%m',\s*(\w+)\)/gi, "TO_CHAR($1, 'YYYY-MM')")
    .replace(/date\('now',\s*'(-?\d+) months'\)/gi, "CURRENT_DATE - INTERVAL '$1 months'")
    .replace(/date\('now',\s*'(-?\d+) days'\)/gi, "CURRENT_DATE - INTERVAL '$1 days'")
    .replace(/date\((\w+)\)/gi, '$1::date')
    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, "TIMESTAMPTZ DEFAULT NOW()");
  if (/^INSERT INTO/i.test(text) && !/ON CONFLICT/i.test(text)) {
    text += ' ON CONFLICT DO NOTHING';
  }
  return { text, values: params || [] };
};

module.exports = {
  get: async (sql, ...params) => {
    const r = await pool.query(q(sql, params));
    return r.rows[0] || null;
  },
  all: async (sql, ...params) => {
    const r = await pool.query(q(sql, params));
    return r.rows;
  },
  run: async (sql, ...params) => {
    const r = await pool.query(q(sql, params));
    return r;
  },
  transaction: async (fn) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tx = {
        get: async (sql, ...params) => {
          const r = await client.query(q(sql, params));
          return r.rows[0] || null;
        },
        all: async (sql, ...params) => {
          const r = await client.query(q(sql, params));
          return r.rows;
        },
        run: async (sql, ...params) => {
          const r = await client.query(q(sql, params));
          return r;
        },
      };
      await fn(tx);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin','manager','user')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        position TEXT NOT NULL,
        department TEXT NOT NULL,
        salary REAL NOT NULL,
        hire_date TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','vacation')),
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        check_in TEXT,
        check_out TEXT,
        status TEXT DEFAULT 'present' CHECK(status IN ('present','absent','late','vacation','holiday')),
        UNIQUE(employee_id, date)
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category_id TEXT REFERENCES categories(id),
        unit_price REAL NOT NULL,
        cost_price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER DEFAULT 10,
        location TEXT,
        image TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        type TEXT DEFAULT 'regular' CHECK(type IN ('regular','vip','corporate')),
        credit_limit REAL DEFAULT 0,
        notes TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        customer_id TEXT REFERENCES customers(id),
        employee_id TEXT REFERENCES employees(id),
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipped','delivered','cancelled')),
        payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash','card','transfer','credit')),
        notes TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        reference TEXT,
        date TEXT NOT NULL,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('call','email','meeting','note','task')),
        subject TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','scheduled')),
        assigned_to TEXT REFERENCES employees(id),
        due_date TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        customer_id TEXT REFERENCES customers(id),
        start_date TEXT NOT NULL,
        end_date TEXT,
        budget REAL,
        status TEXT DEFAULT 'planning' CHECK(status IN ('planning','active','paused','completed','cancelled')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT REFERENCES employees(id),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','review','completed')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
        due_date TEXT,
        estimated_hours REAL,
        actual_hours REAL DEFAULT 0,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','error')),
        read INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }
};
