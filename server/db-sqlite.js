const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

let db;
let dbPath;

const getDbPath = () => {
  if (dbPath) return dbPath;
  if (process.env.VERCEL) {
    dbPath = path.join(os.tmpdir(), 'synex.db');
  } else {
    dbPath = path.join(__dirname, 'synex.db');
  }
  return dbPath;
};

const seedData = (companyId) => {
  const dbUsers = db.prepare('SELECT id FROM users WHERE company_id = ?').all(companyId);
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

  const employeeIds = [];
  const insertEmp = db.prepare('INSERT OR IGNORE INTO employees (id,company_id,code,name,email,phone,position,department,salary,hire_date,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  nombres.forEach((n, i) => {
    const id = uuidv4();
    employeeIds.push(id);
    insertEmp.run(id, companyId, `EMP-${String(i + 1).padStart(3, '0')}`, n, `${n.toLowerCase().replace(' ','.')}@synex.com`,
      `300${rand(1000000, 9999999)}`, pick(cargos), pick(departamentos),
      rand(2000000, 15000000), daysAgo(rand(30, 730)), pick(['active','active','active','active','active','inactive','vacation']), createdBy);
  });

  const insertAtt = db.prepare('INSERT OR IGNORE INTO attendance (id,employee_id,date,check_in,check_out,status) VALUES (?,?,?,?,?,?)');
  for (let i = 0; i < 30; i++) {
    employeeIds.forEach(id => {
      const hIn = 7 + rand(0, 2);
      const mIn = rand(0, 59);
      const hOut = 17 + rand(0, 2);
      const mOut = rand(0, 59);
      const est = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent');
      insertAtt.run(uuidv4(), id, daysAgo(i),
        est === 'absent' ? null : `${String(hIn).padStart(2,'0')}:${String(mIn).padStart(2,'0')}`,
        est === 'absent' ? null : `${String(hOut).padStart(2,'0')}:${String(mOut).padStart(2,'0')}`, est);
    });
  }

  const catIds = [];
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (id, company_id, name, description) VALUES (?,?,?,?)');
  cats.forEach(c => { const id = uuidv4(); insertCat.run(id, companyId, c, `Categoría de ${c}`); catIds.push(id); });

  const prodIds = [];
  const insertProd = db.prepare('INSERT OR IGNORE INTO products (id,company_id,code,name,description,category,unit_price,cost_price,stock,min_stock,location,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  prods.forEach((p, i) => {
    const id = uuidv4();
    prodIds.push(id);
    insertProd.run(id, companyId, `PROD-${String(i + 1).padStart(3, '0')}`, p[0], p[1], pick(cats), p[2], p[3], p[4] + rand(-10, 20), rand(5, 20), `Bodega-${String.fromCharCode(65 + rand(0,4))}-${rand(1,20)}`, createdBy);
  });

  const custIds = [];
  const insertCust = db.prepare('INSERT OR IGNORE INTO customers (id,company_id,code,name,email,phone,address,type,credit_limit,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)');
  clientNames.forEach((c, i) => {
    const id = uuidv4();
    custIds.push(id);
    insertCust.run(id, companyId, `CLI-${String(i + 1).padStart(3, '0')}`, c, `contacto@${c.toLowerCase().replace(/[^a-z]/g,'')}.com`, `3${rand(1000000,9999999)}`, `Calle ${rand(1,100)} #${rand(1,20)}-${rand(1,99)}, ${pick(ciudades)}`, pick(['regular','regular','vip','corporate']), rand(5000000, 50000000), createdBy);
  });
  for (let i = 0; i < 15; i++) {
    const id = uuidv4();
    custIds.push(id);
    insertCust.run(id, companyId, `CLI-${String(clientNames.length + i + 1).padStart(3, '0')}`, `${pick(['Comercial','Distribuidora','Inversiones','Grupo','Corporación'])} ${pick(['Andina','del Sur','del Valle','Nacional','Unida','Global','Prime'])}`, `cliente${i}@email.com`, `3${rand(1000000,9999999)}`, `Cra ${rand(1,50)} #${rand(1,30)}-${rand(1,99)}, ${pick(ciudades)}`, pick(['regular','regular','regular','vip','corporate']), rand(0, 30000000), createdBy);
  }

  const insertOrder = db.prepare('INSERT OR IGNORE INTO orders (id,company_id,code,customer_id,employee_id,total,status,payment_method,notes,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const insertItem = db.prepare('INSERT OR IGNORE INTO order_items (id,order_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)');
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
    insertOrder.run(oid, companyId, `ORD-${String(i + 1).padStart(4, '0')}`, pick(custIds), pick(employeeIds), total, pick(['pending','pending','confirmed','shipped','delivered','delivered','delivered','cancelled']), pick(['cash','card','transfer','credit']), 'Orden generada', createdBy, daysAgo(rand(0, 60)));
    items.forEach(it => insertItem.run(it.id, oid, it.product_id, it.quantity, it.unit_price, it.subtotal));
  }

  const insertTx = db.prepare('INSERT OR IGNORE INTO transactions (id,company_id,code,type,category,description,amount,payment_method,reference,date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const txCats = ['Ventas','Servicios','Nómina','Proveedores','Servicios Públicos','Arriendo','Equipos','Marketing','Transporte','Seguros','Impuestos','Consultoría'];
  for (let i = 0; i < 80; i++) {
    const isIncome = Math.random() > 0.4;
    const cat = pick(txCats);
    insertTx.run(uuidv4(), companyId, `TXN-${String(i + 1).padStart(4, '0')}`, isIncome ? 'income' : 'expense', cat, `${isIncome ? 'Ingreso por' : 'Pago de'} ${cat}`, isIncome ? rand(500000, 25000000) : rand(100000, 8000000), pick(['cash','card','transfer','transfer','transfer']), `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, daysAgo(rand(0, 90)), createdBy);
  }

  const insertInt = db.prepare('INSERT OR IGNORE INTO interactions (id,company_id,customer_id,type,subject,description,status,assigned_to,due_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const subjects = ['Seguimiento cotización','Llamada de bienvenida','Revisión contrato','Propuesta comercial','Soporte técnico','Actualización de datos','Oferta especial','Renovación servicio','Queja','Solicitud información'];
  for (let i = 0; i < 40; i++) insertInt.run(uuidv4(), companyId, pick(custIds), pick(['call','email','meeting','note','task']), pick(subjects), 'Interacción registrada', pick(['completed','completed','completed','pending','scheduled']), pick(employeeIds), daysAgo(rand(-5, 30)), createdBy);

  const projectNames = ['Implementación ERP','Migración Cloud','App Móvil Corporativa','Rediseño Web','Auditoría Seguridad','Campaña Marketing Digital','Optimización Procesos','Data Warehouse','E-commerce Platform','CRM Personalizado'];
  const projIds = [];
  const insertProj = db.prepare('INSERT OR IGNORE INTO projects (id,company_id,code,name,description,customer_id,start_date,end_date,budget,status,priority,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  projectNames.forEach((n, i) => {
    const id = uuidv4();
    projIds.push(id);
    insertProj.run(id, companyId, `PROJ-${String(i + 1).padStart(3, '0')}`, n, `Proyecto: ${n}`, pick(custIds), daysAgo(rand(0, 90)), daysAgo(rand(-180, -10)), rand(10000000, 200000000), pick(['active','active','active','planning','completed','completed']), pick(['low','medium','medium','high','high','critical']), createdBy);
  });

  const insertTask = db.prepare('INSERT OR IGNORE INTO tasks (id,company_id,project_id,name,description,assigned_to,status,priority,due_date,estimated_hours,actual_hours,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const taskNames = ['Análisis de requisitos','Diseño de solución','Desarrollo backend','Desarrollo frontend','Pruebas QA','Documentación','Despliegue','Capacitación','Revisión de código','Integración APIs','Optimización rendimiento','Seguridad','Testing usuario','Migración datos','Monitoreo'];
  projIds.forEach(pid => { const numTasks = rand(3, 8); for (let i = 0; i < numTasks; i++) insertTask.run(uuidv4(), companyId, pid, pick(taskNames), 'Tarea del proyecto', pick(employeeIds), pick(['pending','in_progress','in_progress','review','completed','completed']), pick(['low','medium','medium','high','high']), daysAgo(rand(-30, 30)), rand(4, 80), rand(2, 60), createdBy); });

  const insertNotif = db.prepare('INSERT OR IGNORE INTO notifications (id,company_id,user_id,title,message,type) VALUES (?,?,?,?,?,?)');
  const notifs = [
    ['Bienvenido a Synex', 'Has iniciado sesión correctamente', 'success'],
    ['Reporte semanal disponible', 'Los reportes ya están generados', 'info'],
    ['Stock bajo', 'Algunos productos tienen inventario crítico', 'warning'],
    ['Tarea completada', 'La tarea fue finalizada', 'success'],
    ['Recordatorio de nómina', 'La nómina del mes debe ser procesada', 'info'],
    ['Meta del mes', 'Las ventas han alcanzado el 85% de la meta mensual', 'info'],
  ];
  dbUsers.forEach(u => { notifs.forEach(n => insertNotif.run(uuidv4(), companyId, u.id, n[0], n[1], n[2])); });
};

const initDb = () => {
  db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
    email_domain TEXT, plan TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, owner_id TEXT,
    logo_url TEXT, primary_color TEXT DEFAULT '#6366f1', secondary_color TEXT DEFAULT '#06b6d4', api_key TEXT,
    plan_expires_at TEXT
    );
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), google_id TEXT, email TEXT NOT NULL, name TEXT NOT NULL, avatar TEXT, password_hash TEXT, role TEXT DEFAULT 'user' CHECK(role IN ('superadmin','admin','manager','user')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME, UNIQUE(company_id, email));
    CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), code TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, position TEXT NOT NULL, department TEXT NOT NULL, salary REAL NOT NULL, hire_date TEXT NOT NULL, status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','vacation')), created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(company_id, code), UNIQUE(company_id, email));
    CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE, date TEXT NOT NULL, check_in TEXT, check_out TEXT, status TEXT DEFAULT 'present' CHECK(status IN ('present','absent','late','vacation','holiday')), UNIQUE(employee_id, date));
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), name TEXT NOT NULL, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(company_id, name));
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, category TEXT, unit_price REAL NOT NULL, cost_price REAL NOT NULL, stock INTEGER NOT NULL DEFAULT 0, min_stock INTEGER DEFAULT 10, location TEXT, image TEXT, created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(company_id, code));
    CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), code TEXT NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, address TEXT, type TEXT DEFAULT 'regular' CHECK(type IN ('regular','vip','corporate')), credit_limit REAL DEFAULT 0, notes TEXT, created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(company_id, code));
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), code TEXT NOT NULL, customer_id TEXT REFERENCES customers(id), employee_id TEXT REFERENCES employees(id), total REAL NOT NULL, status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipped','delivered','cancelled')), payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash','card','transfer','credit','nequi')), notes TEXT, created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(company_id, code));
    CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT REFERENCES orders(id) ON DELETE CASCADE, product_id TEXT REFERENCES products(id), quantity INTEGER NOT NULL, unit_price REAL NOT NULL, subtotal REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), code TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')), category TEXT NOT NULL, description TEXT, amount REAL NOT NULL, payment_method TEXT DEFAULT 'cash', reference TEXT, date TEXT NOT NULL, created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(company_id, code));
    CREATE TABLE IF NOT EXISTS interactions (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK(type IN ('call','email','meeting','note','task')), subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','scheduled')), assigned_to TEXT REFERENCES employees(id), due_date TEXT, created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, customer_id TEXT REFERENCES customers(id), start_date TEXT NOT NULL, end_date TEXT, budget REAL, status TEXT DEFAULT 'planning' CHECK(status IN ('planning','active','paused','completed','cancelled')), priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')), created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(company_id, code));
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, assigned_to TEXT REFERENCES employees(id), status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','review','completed')), priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')), due_date TEXT, estimated_hours REAL, actual_hours REAL DEFAULT 0, created_by TEXT REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), user_id TEXT REFERENCES users(id), title TEXT NOT NULL, message TEXT, type TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','error')), read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS billing_plans (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, price REAL NOT NULL, currency TEXT DEFAULT 'COP', interval TEXT DEFAULT 'month', features TEXT, active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS company_subscriptions (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), plan_id TEXT REFERENCES billing_plans(id), epayco_customer_id TEXT, epayco_subscription_id TEXT, status TEXT DEFAULT 'active' CHECK(status IN ('active','past_due','cancelled','expired')), current_period_start DATETIME, current_period_end DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS payment_history (id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), subscription_id TEXT REFERENCES company_subscriptions(id), epayco_ref TEXT, amount REAL NOT NULL, currency TEXT DEFAULT 'COP', status TEXT DEFAULT 'completed', date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT, phone TEXT NOT NULL, email TEXT, plan_name TEXT NOT NULL, status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','lost')), notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  `);

  // Seed / upsert default billing plans
  const epaycoSvc = require('./services/epayco');
  const upsert = db.prepare('INSERT INTO billing_plans (id, code, name, description, price, currency, interval, features, active) VALUES (?,?,?,?,?,?,?,?,1) ON CONFLICT(code) DO UPDATE SET name=excluded.name, description=excluded.description, price=excluded.price, currency=excluded.currency, interval=excluded.interval, features=excluded.features, active=1');
  for (const p of epaycoSvc.DEFAULT_PLANS) {
    upsert.run(uuidv4(), p.code, p.name, p.description, p.price, p.currency, p.interval, JSON.stringify(p.features));
  }

  // Migration: add columns to existing tables (safe if already exist)
  const migrations = [
    `ALTER TABLE users ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE employees ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE categories ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE products ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE customers ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE orders ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE transactions ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE interactions ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE projects ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE tasks ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE notifications ADD COLUMN company_id TEXT REFERENCES companies(id)`,
    `ALTER TABLE users ADD COLUMN password_hash TEXT`,
    `ALTER TABLE companies ADD COLUMN logo_url TEXT`,
    `ALTER TABLE companies ADD COLUMN primary_color TEXT DEFAULT '#6366f1'`,
    `ALTER TABLE companies ADD COLUMN secondary_color TEXT DEFAULT '#06b6d4'`,
    `ALTER TABLE companies ADD COLUMN api_key TEXT`,
    `ALTER TABLE companies ADD COLUMN plan_expires_at TEXT`,
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (e) { /* column may already exist */ }
  }

  // Backfill password_hash for users who registered before password auth existed
  const demoHash = require('crypto').pbkdf2Sync('admin123', 'demo', 1000, 64, 'sha512').toString('hex');
  db.prepare('UPDATE users SET password_hash = ? WHERE password_hash IS NULL').run('demo:' + demoHash);

  const companyCount = db.prepare('SELECT COUNT(*) as c FROM companies').get();
  if (companyCount.c === 0) {
    const companyId = uuidv4();
    const expires = new Date(); expires.setDate(expires.getDate() + 14);
    db.prepare('INSERT INTO companies (id, name, slug, plan, plan_expires_at) VALUES (?,?,?,?,?)').run(companyId, 'Synex Demo', 'synex', 'enterprise', null);
    console.log('Creating demo users...');
    const users = [
      { google_id: 'demo_admin', email: 'admin@synex.com', name: 'Admin Synex', role: 'admin' },
      { google_id: 'demo_manager', email: 'manager@synex.com', name: 'Gerente Sistema', role: 'manager' },
      { google_id: 'demo_user', email: 'user@synex.com', name: 'Usuario Demo', role: 'user' },
      { google_id: 'demo_ceo', email: 'ceo@synex.com', name: 'CEO Synex', role: 'superadmin' },
    ];
    const demoPass = require('crypto').pbkdf2Sync('admin123', 'demo', 1000, 64, 'sha512').toString('hex');
    const ins = db.prepare('INSERT OR IGNORE INTO users (id, company_id, google_id, email, name, avatar, role, password_hash) VALUES (?,?,?,?,?,?,?,?)');
    for (const u of users) ins.run(uuidv4(), companyId, u.google_id, u.email, u.name, null, u.role, 'demo:' + demoPass);
    try { seedData(companyId); } catch (e) { console.error('Seed extra falló:', e.message); }
  }
};

module.exports = {
  get(sql, ...params) {
    if (!db) initDb();
    return Promise.resolve(db.prepare(sql).get(...params));
  },
  all(sql, ...params) {
    if (!db) initDb();
    return Promise.resolve(db.prepare(sql).all(...params));
  },
  run(sql, ...params) {
    if (!db) initDb();
    return Promise.resolve(db.prepare(sql).run(...params));
  },
  async transaction(fn) {
    if (!db) initDb();
    db.exec('BEGIN IMMEDIATE');
    try {
      const tx = {
        get: (sql, ...params) => Promise.resolve(db.prepare(sql).get(...params)),
        all: (sql, ...params) => Promise.resolve(db.prepare(sql).all(...params)),
        run: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
      };
      await fn(tx);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },
  init() {
    initDb();
    return Promise.resolve();
  },
  seedData
};
