const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.VERCEL ? { rejectUnauthorized: false } : false,
});

let initialized = false;
let initializing = null;

async function ensureInit() {
  if (initialized) return;
  if (initializing) return initializing;
  initializing = doInit();
  return initializing;
}

async function doInit() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
        email_domain TEXT, plan TEXT DEFAULT 'free',
        created_at TIMESTAMPTZ DEFAULT NOW(), owner_id TEXT,
        logo_url TEXT, primary_color TEXT DEFAULT '#6366f1', secondary_color TEXT DEFAULT '#06b6d4', api_key TEXT,
        plan_expires_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        google_id TEXT, email TEXT NOT NULL, name TEXT NOT NULL, avatar TEXT,
        password_hash TEXT,
        role TEXT DEFAULT 'user' CHECK(role IN ('superadmin','admin','manager','user')),
        created_at TIMESTAMPTZ DEFAULT NOW(), last_login TIMESTAMPTZ,
        UNIQUE(company_id, email)
      );
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        code TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
        position TEXT NOT NULL, department TEXT NOT NULL, salary REAL NOT NULL,
        hire_date TEXT NOT NULL, status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','vacation')),
        created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, code), UNIQUE(company_id, email)
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY, employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
        date TEXT NOT NULL, check_in TEXT, check_out TEXT,
        status TEXT DEFAULT 'present' CHECK(status IN ('present','absent','late','vacation','holiday')),
        UNIQUE(employee_id, date)
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        name TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, name)
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        code TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
        category TEXT, unit_price REAL NOT NULL, cost_price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0, min_stock INTEGER DEFAULT 10, location TEXT, image TEXT,
        created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, code)
      );
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        code TEXT NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, address TEXT,
        type TEXT DEFAULT 'regular' CHECK(type IN ('regular','vip','corporate')),
        credit_limit REAL DEFAULT 0, notes TEXT, created_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(company_id, code)
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        code TEXT NOT NULL, customer_id TEXT REFERENCES customers(id),
        employee_id TEXT REFERENCES employees(id), total REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipped','delivered','cancelled')),
        payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash','card','transfer','credit','nequi')),
        notes TEXT, created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, code)
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY, order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id), quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL, subtotal REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        code TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
        category TEXT NOT NULL, description TEXT, amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash', reference TEXT, date TEXT NOT NULL,
        created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, code)
      );
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('call','email','meeting','note','task')),
        subject TEXT NOT NULL, description TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','scheduled')),
        assigned_to TEXT REFERENCES employees(id), due_date TEXT,
        created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        code TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
        customer_id TEXT REFERENCES customers(id), start_date TEXT NOT NULL, end_date TEXT, budget REAL,
        status TEXT DEFAULT 'planning' CHECK(status IN ('planning','active','paused','completed','cancelled')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
        created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, code)
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL, description TEXT, assigned_to TEXT REFERENCES employees(id),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','review','completed')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
        due_date TEXT, estimated_hours REAL, actual_hours REAL DEFAULT 0,
        created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        user_id TEXT REFERENCES users(id), title TEXT NOT NULL, message TEXT,
        type TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','error')),
        read INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Billing tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_plans (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'COP',
        interval TEXT DEFAULT 'month',
        features TEXT,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_subscriptions (
        id TEXT PRIMARY KEY,
        company_id TEXT REFERENCES companies(id),
        plan_id TEXT REFERENCES billing_plans(id),
        epayco_customer_id TEXT,
        epayco_subscription_id TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active','past_due','cancelled','expired')),
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id TEXT PRIMARY KEY,
        company_id TEXT REFERENCES companies(id),
        subscription_id TEXT REFERENCES company_subscriptions(id),
        epayco_ref TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'COP',
        status TEXT DEFAULT 'completed',
        date TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subs_company ON company_subscriptions(company_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subs_epayco ON company_subscriptions(epayco_subscription_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_company ON payment_history(company_id)`);

    // Leads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT NOT NULL,
        email TEXT,
        plan_name TEXT NOT NULL,
        status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','lost')),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Migration: add role column to employees
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'editor'").catch(() => {});
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY, email TEXT NOT NULL, token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL, used INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id),
        name TEXT NOT NULL, key TEXT NOT NULL UNIQUE, active INTEGER DEFAULT 1,
        last_used_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_templates (
        id TEXT PRIMARY KEY, company_id TEXT UNIQUE REFERENCES companies(id),
        header_text TEXT DEFAULT '', footer_text TEXT DEFAULT '',
        terms_text TEXT DEFAULT '', font_family TEXT DEFAULT 'Inter',
        font_size INTEGER DEFAULT 12, primary_color TEXT DEFAULT '#6366f1',
        show_logo INTEGER DEFAULT 1, show_nit INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed / upsert default billing plans
    const epaycoSvc = require('./services/epayco');
    for (const p of epaycoSvc.DEFAULT_PLANS) {
      const existing = await pool.query('SELECT id FROM billing_plans WHERE code = $1', [p.code]);
      if (existing.rows.length > 0) {
        await pool.query(q('UPDATE billing_plans SET name=$1, description=$2, price=$3, currency=$4, interval=$5, features=$6, active=1 WHERE code=$7',
          [p.name, p.description, p.price, p.currency, p.interval, JSON.stringify(p.features), p.code]));
      } else {
        await pool.query(q('INSERT INTO billing_plans (id, code, name, description, price, currency, interval, features, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1)',
          [require('uuid').v4(), p.code, p.name, p.description, p.price, p.currency, p.interval, JSON.stringify(p.features)]));
      }
    }

    // Migrations: add missing columns
    await pool.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price REAL
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price REAL
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS location TEXT
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by TEXT
    `).catch(() => {});

    const companyCount = (await pool.query('SELECT COUNT(*) as c FROM companies')).rows[0].c;
    if (parseInt(companyCount) === 0) {
      const companyId = uuidv4();
      await pool.query(q('INSERT INTO companies (id, name, slug, plan) VALUES ($1,$2,$3,$4)',
        [companyId, 'Synex Demo', 'synex', 'enterprise']));

      const demoPass = crypto.pbkdf2Sync('admin123', 'demo', 1000, 64, 'sha512').toString('hex');
      const passwordHash = 'demo:' + demoPass;
      const users = [
        { google_id: 'demo_admin', email: 'admin@synex.com', name: 'Admin Synex', role: 'admin' },
        { google_id: 'demo_manager', email: 'manager@synex.com', name: 'Gerente Sistema', role: 'manager' },
        { google_id: 'demo_user', email: 'user@synex.com', name: 'Usuario Demo', role: 'user' },
        { google_id: 'demo_ceo', email: 'ceo@synex.com', name: 'CEO Synex', role: 'superadmin' },
      ];
      for (const u of users) {
        await pool.query(q('INSERT INTO users (id, company_id, google_id, email, name, avatar, role, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [uuidv4(), companyId, u.google_id, u.email, u.name, null, u.role, passwordHash]));
      }
      await seedData(companyId);
    }
    initialized = true;
  } catch (e) {
    console.error('DB init error:', e.message);
    initializing = null;
    throw e;
  }
}

const q = (sql, params) => {
  let i = 0;
  let text = sql
    .replace(/\?/g, () => `$${++i}`)
    .replace(/INSERT OR IGNORE INTO/g, 'INSERT INTO')
    .replace(/INSERT OR IGNORE\s+INTO/g, 'INSERT INTO')
    .replace(/strftime\('%m',\s*(\w+)\)/gi, "EXTRACT(MONTH FROM $1::timestamp)")
    .replace(/strftime\('%Y-%m',\s*(\w+)\)/gi, "TO_CHAR($1::timestamp, 'YYYY-MM')")
    .replace(/date\('now',\s*'-?(\d+) months'\)/gi, "CURRENT_DATE - INTERVAL '$1 months'")
    .replace(/date\('now',\s*'-?(\d+) days'\)/gi, "CURRENT_DATE - INTERVAL '$1 days'")
    .replace(/date\((\w+)\)/gi, '$1::date')
    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, "TIMESTAMPTZ DEFAULT NOW()");
  if (/^INSERT INTO/i.test(text) && !/ON CONFLICT/i.test(text)) {
    text += ' ON CONFLICT DO NOTHING';
  }
  return { text, values: params || [] };
};

const seedData = async (companyId) => {
  const dbUsers = (await pool.query(q('SELECT id FROM users WHERE company_id = $1', [companyId]))).rows;
  if (dbUsers.length === 0) return;
  const createdBy = dbUsers[0].id;
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const dateStr = (d) => d.toISOString().split('T')[0];
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dateStr(d); };

  const departamentos = ['TI', 'Ventas', 'Marketing', 'RRHH', 'Finanzas', 'Operaciones', 'Logística'];
  const cargos = ['Analista Senior', 'Coordinador', 'Director', 'Asistente', 'Especialista', 'Jefe de Área', 'Supervisor'];
  const nombres = ['Carlos Mendoza','María García','Juan Pérez','Ana López','Pedro Ramírez','Laura Torres',
    'Diego Castillo','Sofía Herrera','Andrés Vega','Valentina Ríos','Fernando Díaz','Camila Ortiz',
    'Roberto Navarro','Isabel Flores','Luis Morales','Gabriela Ruiz','Javier Santos','Patricia Vega',
    'Miguel Ángel','Daniela Cruz','Alejandro Rojas','Fernanda Medina','Sergio Aguilar','Mariana Campos'];
  const cats = ['Electrónicos','Oficina','Ropa','Alimentos','Herramientas','Muebles','Juguetes','Deportes'];
  const prods = [
    ['Laptop Pro X1','Laptop de alto rendimiento',2500,1800,50],
    ['Monitor 27" 4K','Monitor profesional',800,550,30],
    ['Teclado Mecánico RGB','Teclado gaming',150,90,100],
    ['Mouse Inalámbrico','Mouse ergonómico',80,45,120],
    ['Silla Ejecutiva','Silla ergonómica premium',1200,800,25],
    ['Escritorio Eléctrico','Escritorio ajustable',900,600,15],
    ['Café Premium 1kg','Café colombiano',35,20,200],
    ['Agua Mineral 12pk','Agua embotellada',18,10,300],
    ['Camisa Corporate','Camisa manga larga',55,30,80],
    ['Zapatos Formal','Zapatos cuero',120,70,40],
    ['Audífonos ANC','Audífonos cancelación ruido',300,180,45],
    ['Tablet Pro','Tablet profesional',900,600,35],
    ['Cargador Universal','Cargador multipuerto',45,25,150],
    ['Hub USB-C','Hub 7 puertos',65,35,90],
    ['Webcam 4K','Cámara profesional',200,120,60],
    ['Router WiFi 6','Router alta velocidad',180,110,40]
  ];
  const clientNames = ['TechSolutions SA','Global Corp','Distribuidora XYZ','Innovatech','Servicios Plus',
    'Comercial ABC','Industrias del Norte','Grupo Empresarial Sigma','Corporación Andina','MegaRed'];
  const ciudades = ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Pereira','Bucaramanga'];

  // Use existing IDs if data already seeded, otherwise create
  let employeeIds = (await pool.query(q('SELECT id FROM employees WHERE company_id = $1', [companyId]))).rows.map(r => r.id);
  if (employeeIds.length === 0) {
    for (let i = 0; i < nombres.length; i++) {
      const id = uuidv4();
      const n = nombres[i];
      await pool.query(q(`INSERT INTO employees (id,company_id,code,name,email,phone,position,department,salary,hire_date,status,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
        id, companyId, `EMP-${String(i + 1).padStart(3, '0')}`, n,
        `${n.toLowerCase().replace(' ','.')}@synex.com`,
        `300${rand(1000000, 9999999)}`, pick(cargos), pick(departamentos),
        rand(2000000, 15000000), daysAgo(rand(30, 730)),
        pick(['active','active','active','active','active','inactive','vacation']), createdBy
      ]));
      employeeIds.push(id);
    }
  }

  for (let d = 0; d < 30; d++) {
    for (const eid of employeeIds) {
      const hIn = 7 + rand(0, 2);
      const mIn = rand(0, 59);
      const hOut = 17 + rand(0, 2);
      const mOut = rand(0, 59);
      const est = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent');
      try {
        await pool.query(q(`INSERT INTO attendance (id,employee_id,date,check_in,check_out,status)
          VALUES ($1,$2,$3,$4,$5,$6)`, [
          uuidv4(), eid, daysAgo(d),
          est === 'absent' ? null : `${String(hIn).padStart(2,'0')}:${String(mIn).padStart(2,'0')}`,
          est === 'absent' ? null : `${String(hOut).padStart(2,'0')}:${String(mOut).padStart(2,'0')}`, est
        ]));
      } catch (e) {
        // Skip if FK fails (employee might not exist in this company)
      }
    }
  }

  let catIds = (await pool.query(q('SELECT id FROM categories WHERE company_id = $1', [companyId]))).rows.map(r => r.id);
  if (catIds.length === 0) {
    for (const c of cats) {
      const id = uuidv4();
      catIds.push(id);
      await pool.query(q('INSERT INTO categories (id, company_id, name, description) VALUES ($1,$2,$3,$4)',
        [id, companyId, c, `Categoría de ${c}`]));
    }
  }

  let prodIds = (await pool.query(q('SELECT id FROM products WHERE company_id = $1', [companyId]))).rows.map(r => r.id);
  if (prodIds.length === 0) {
    for (let i = 0; i < prods.length; i++) {
      const id = uuidv4();
      const p = prods[i];
      await pool.query(q(`INSERT INTO products (id,company_id,code,name,description,category,unit_price,cost_price,stock,min_stock,location,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
        id, companyId, `PROD-${String(i + 1).padStart(3, '0')}`, p[0], p[1],
        pick(cats), p[2], p[3], p[4] + rand(-10, 20), rand(5, 20),
        `Bodega-${String.fromCharCode(65 + rand(0,4))}-${rand(1,20)}`, createdBy
      ]));
      prodIds.push(id);
    }
  }

  let custIds = (await pool.query(q('SELECT id FROM customers WHERE company_id = $1', [companyId]))).rows.map(r => r.id);
  if (custIds.length === 0) {
    for (let i = 0; i < clientNames.length; i++) {
      const id = uuidv4();
      const c = clientNames[i];
      await pool.query(q(`INSERT INTO customers (id,company_id,code,name,email,phone,address,type,credit_limit,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
        id, companyId, `CLI-${String(i + 1).padStart(3, '0')}`, c,
        `contacto@${c.toLowerCase().replace(/[^a-z]/g,'')}.com`,
        `3${rand(1000000,9999999)}`,
        `Calle ${rand(1,100)} #${rand(1,20)}-${rand(1,99)}, ${pick(ciudades)}`,
        pick(['regular','regular','vip','corporate']), rand(5000000, 50000000), createdBy
      ]));
      custIds.push(id);
    }
    for (let i = 0; i < 15; i++) {
      const id = uuidv4();
      custIds.push(id);
      await pool.query(q(`INSERT INTO customers (id,company_id,code,name,email,phone,address,type,credit_limit,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
        id, companyId, `CLI-${String(clientNames.length + i + 1).padStart(3, '0')}`,
        `${pick(['Comercial','Distribuidora','Inversiones','Grupo','Corporación'])} ${pick(['Andina','del Sur','del Valle','Nacional','Unida','Global','Prime'])}`,
        `cliente${i}@email.com`, `3${rand(1000000,9999999)}`,
        `Cra ${rand(1,50)} #${rand(1,30)}-${rand(1,99)}, ${pick(ciudades)}`,
        pick(['regular','regular','regular','vip','corporate']), rand(0, 30000000), createdBy
      ]));
    }
  }

  for (let i = 0; i < 50; i++) {
    const oid = uuidv4();
    const totalItems = rand(1, 6);
    let total = 0;
    const items = [];
    for (let j = 0; j < totalItems; j++) {
      const p = prods[rand(0, prods.length - 1)];
      const qty = rand(1, 10);
      total += p[2] * qty;
      items.push({ id: uuidv4(), product_id: prodIds[rand(0, prodIds.length - 1)], quantity: qty, unit_price: p[2], subtotal: p[2] * qty });
    }
    try {
      await pool.query(q(`INSERT INTO orders (id,company_id,code,customer_id,employee_id,total,status,payment_method,notes,created_by,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
        oid, companyId, `ORD-${String(i + 1).padStart(4, '0')}`, pick(custIds), pick(employeeIds), total,
        pick(['pending','pending','confirmed','shipped','delivered','delivered','delivered','cancelled']),
        pick(['cash','card','transfer','credit']), 'Orden generada', createdBy, daysAgo(rand(0, 60))
      ]));
      for (const it of items) {
        try {
          await pool.query(q(`INSERT INTO order_items (id,order_id,product_id,quantity,unit_price,subtotal)
            VALUES ($1,$2,$3,$4,$5,$6)`, [it.id, oid, it.product_id, it.quantity, it.unit_price, it.subtotal]));
        } catch (e) {}
      }
    } catch (e) {
      // Skip order if FK fails
    }
  }

  const txCats = ['Ventas','Servicios','Nómina','Proveedores','Servicios Públicos','Arriendo','Equipos','Marketing','Transporte','Seguros','Impuestos','Consultoría'];
  for (let i = 0; i < 80; i++) {
    const isIncome = Math.random() > 0.4;
    const cat = pick(txCats);
    await pool.query(q(`INSERT INTO transactions (id,company_id,code,type,category,description,amount,payment_method,reference,date,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
      uuidv4(), companyId, `TXN-${String(i + 1).padStart(4, '0')}`,
      isIncome ? 'income' : 'expense', cat,
      `${isIncome ? 'Ingreso por' : 'Pago de'} ${cat}`,
      isIncome ? rand(500000, 25000000) : rand(100000, 8000000),
      pick(['cash','card','transfer','transfer','transfer']),
      `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      daysAgo(rand(0, 90)), createdBy
    ]));
  }

  const subjects = ['Seguimiento cotización','Llamada de bienvenida','Revisión contrato','Propuesta comercial','Soporte técnico','Actualización de datos','Oferta especial','Renovación servicio','Queja','Solicitud información'];
  for (let i = 0; i < 40; i++) {
    try {
      await pool.query(q(`INSERT INTO interactions (id,company_id,customer_id,type,subject,description,status,assigned_to,due_date,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
        uuidv4(), companyId, pick(custIds),
        pick(['call','email','meeting','note','task']),
        pick(subjects), 'Interacción registrada',
        pick(['completed','completed','completed','pending','scheduled']),
        pick(employeeIds), daysAgo(rand(-5, 30)), createdBy
      ]));
    } catch (e) {}
  }

  const projectNames = ['Implementación ERP','Migración Cloud','App Móvil Corporativa','Rediseño Web','Auditoría Seguridad','Campaña Marketing Digital','Optimización Procesos','Data Warehouse','E-commerce Platform','CRM Personalizado'];
  const projIds = [];
  for (let i = 0; i < projectNames.length; i++) {
    const id = uuidv4();
    projIds.push(id);
    const n = projectNames[i];
    try {
      await pool.query(q(`INSERT INTO projects (id,company_id,code,name,description,customer_id,start_date,end_date,budget,status,priority,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
        id, companyId, `PROJ-${String(i + 1).padStart(3, '0')}`, n, `Proyecto: ${n}`,
        pick(custIds), daysAgo(rand(0, 90)), daysAgo(rand(-180, -10)), rand(10000000, 200000000),
        pick(['active','active','active','planning','completed','completed']),
        pick(['low','medium','medium','high','high','critical']), createdBy
      ]));
    } catch (e) {}
  }

  const taskNames = ['Análisis de requisitos','Diseño de solución','Desarrollo backend','Desarrollo frontend','Pruebas QA','Documentación','Despliegue','Capacitación','Revisión de código','Integración APIs','Optimización rendimiento','Seguridad','Testing usuario','Migración datos','Monitoreo'];
  for (const pid of projIds) {
    const numTasks = rand(3, 8);
    for (let t = 0; t < numTasks; t++) {
      try {
        await pool.query(q(`INSERT INTO tasks (id,company_id,project_id,name,description,assigned_to,status,priority,due_date,estimated_hours,actual_hours,created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
          uuidv4(), companyId, pid, pick(taskNames), 'Tarea del proyecto', pick(employeeIds),
          pick(['pending','in_progress','in_progress','review','completed','completed']),
          pick(['low','medium','medium','high','high']), daysAgo(rand(-30, 30)), rand(4, 80), rand(2, 60), createdBy
        ]));
      } catch (e) {}
    }
  }

  const notifs = [
    ['Bienvenido a Synex', 'Has iniciado sesión correctamente', 'success'],
    ['Reporte semanal disponible', 'Los reportes ya están generados', 'info'],
    ['Stock bajo', 'Algunos productos tienen inventario crítico', 'warning'],
    ['Tarea completada', 'La tarea fue finalizada', 'success'],
    ['Recordatorio de nómina', 'La nómina del mes debe ser procesada', 'info'],
    ['Meta del mes', 'Las ventas han alcanzado el 85% de la meta mensual', 'info'],
  ];
  for (const u of dbUsers) {
    for (const n of notifs) {
      await pool.query(q('INSERT INTO notifications (id,company_id,user_id,title,message,type) VALUES ($1,$2,$3,$4,$5,$6)',
        [uuidv4(), companyId, u.id, n[0], n[1], n[2]]));
    }
  }
};

async function get(sql, ...params) {
  await ensureInit();
  const r = await pool.query(q(sql, params));
  return r.rows[0] || null;
}

async function all(sql, ...params) {
  await ensureInit();
  const r = await pool.query(q(sql, params));
  return r.rows;
}

async function run(sql, ...params) {
  await ensureInit();
  const r = await pool.query(q(sql, params));
  return r;
}

async function transaction(fn) {
  await ensureInit();
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
}

module.exports = { get, all, run, transaction, init: ensureInit, seedData };
