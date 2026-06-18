const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

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

async function main() {
  console.log('Seeding NEXUS ERP...\n');

  await db.init();
  console.log('Tables created');

  const users = [
    { id: uuidv4(), google_id: 'demo_admin', email: 'admin@nexus.com', name: 'Admin Nexus', avatar: null, role: 'admin' },
    { id: uuidv4(), google_id: 'demo_manager', email: 'manager@nexus.com', name: 'Gerente Sistema', avatar: null, role: 'manager' },
    { id: uuidv4(), google_id: 'demo_user', email: 'user@nexus.com', name: 'Usuario Demo', avatar: null, role: 'user' },
  ];
  for (const u of users) {
    await db.run(`INSERT INTO users (id, google_id, email, name, avatar, role) VALUES (?,?,?,?,?,?) ON CONFLICT (email) DO NOTHING`,
      u.id, u.google_id, u.email, u.name, u.avatar, u.role);
  }
  console.log(`Users: ${users.length}`);

  const employeeIds = [];
  for (const [i, n] of nombres.entries()) {
    const id = uuidv4();
    const code = `EMP-${String(i + 1).padStart(3, '0')}`;
    await db.run(`INSERT INTO employees (id,code,name,email,phone,position,department,salary,hire_date,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (email) DO NOTHING`,
      id, code, n, `${n.toLowerCase().replace(' ','.')}@nexus.com`,
      `300${rand(1000000, 9999999)}`, pick(cargos), pick(departamentos),
      rand(2000000, 15000000), daysAgo(rand(30, 730)), pick(['active','active','active','active','active','inactive','vacation']),
      users[0].id);
    employeeIds.push(id);
  }
  console.log(`Employees: ${nombres.length}`);

  for (let i = 0; i < 30; i++) {
    for (const eid of employeeIds) {
      const hIn = 7 + rand(0, 2);
      const mIn = rand(0, 59);
      const hOut = 17 + rand(0, 2);
      const mOut = rand(0, 59);
      const est = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent');
      await db.run(`INSERT INTO attendance (id,employee_id,date,check_in,check_out,status) VALUES (?,?,?,?,?,?) ON CONFLICT (employee_id, date) DO NOTHING`,
        uuidv4(), eid, daysAgo(i),
        est === 'absent' ? null : `${String(hIn).padStart(2,'0')}:${String(mIn).padStart(2,'0')}`,
        est === 'absent' ? null : `${String(hOut).padStart(2,'0')}:${String(mOut).padStart(2,'0')}`,
        est);
    }
  }
  console.log('Attendance: 30 days');

  const catIds = [];
  for (const c of cats) {
    const id = uuidv4();
    await db.run(`INSERT INTO categories (id, name, description) VALUES (?,?,?) ON CONFLICT (name) DO NOTHING`, id, c, `Categoría de ${c}`);
    catIds.push(id);
  }
  console.log(`Categories: ${cats.length}`);

  const prodIds = [];
  for (const [i, p] of prods.entries()) {
    const id = uuidv4();
    const code = `PROD-${String(i + 1).padStart(3, '0')}`;
    await db.run(`INSERT INTO products (id,code,name,description,category_id,unit_price,cost_price,stock,min_stock,location,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (code) DO NOTHING`,
      id, code, p[0], p[1], pick(catIds), p[2], p[3], p[4] + rand(-10, 20),
      rand(5, 20), `Bodega-${String.fromCharCode(65 + rand(0,4))}-${rand(1,20)}`, users[0].id);
    prodIds.push(id);
  }
  console.log(`Products: ${prods.length}`);

  const custIds = [];
  for (const [i, c] of clientNames.entries()) {
    const id = uuidv4();
    await db.run(`INSERT INTO customers (id,code,name,email,phone,address,type,credit_limit,created_by) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT (code) DO NOTHING`,
      id, `CLI-${String(i + 1).padStart(3, '0')}`, c,
      `contacto@${c.toLowerCase().replace(/[^a-z]/g,'')}.com`,
      `3${rand(1000000,9999999)}`, `Calle ${rand(1,100)} #${rand(1,20)}-${rand(1,99)}, ${pick(ciudades)}`,
      pick(['regular','regular','vip','corporate']), rand(5000000, 50000000), users[0].id);
    custIds.push(id);
  }
  for (let i = 0; i < 15; i++) {
    const id = uuidv4();
    await db.run(`INSERT INTO customers (id,code,name,email,phone,address,type,credit_limit,created_by) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT (code) DO NOTHING`,
      id, `CLI-${String(clientNames.length + i + 1).padStart(3, '0')}`,
      `${pick(['Comercial','Distribuidora','Inversiones','Grupo','Corporación'])} ${pick(['Andina','del Sur','del Valle','Nacional','Unida','Global','Prime'])}`,
      `cliente${i}@email.com`, `3${rand(1000000,9999999)}`,
      `Cra ${rand(1,50)} #${rand(1,30)}-${rand(1,99)}, ${pick(ciudades)}`,
      pick(['regular','regular','regular','vip','corporate']), rand(0, 30000000), users[0].id);
    custIds.push(id);
  }
  console.log(`Customers: ${custIds.length}`);

  let ordCount = 0;
  for (let i = 0; i < 50; i++) {
    const oid = uuidv4();
    const totalItems = rand(1, 6);
    let total = 0;
    const items = [];
    for (let j = 0; j < totalItems; j++) {
      const p = prods[rand(0, prods.length - 1)];
      const qty = rand(1, 10);
      const subtotal = p[2] * qty;
      total += subtotal;
      items.push({ id: uuidv4(), product_id: prodIds[rand(0, prodIds.length - 1)], quantity: qty, unit_price: p[2], subtotal });
    }
    await db.run(`INSERT INTO orders (id,code,customer_id,employee_id,total,status,payment_method,notes,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT (code) DO NOTHING`,
      oid, `ORD-${String(i + 1).padStart(4, '0')}`, pick(custIds), pick(employeeIds), total,
      pick(['pending','pending','confirmed','shipped','delivered','delivered','delivered','cancelled']),
      pick(['cash','card','transfer','credit']), 'Orden generada automáticamente',
      users[0].id, daysAgo(rand(0, 60)));
    for (const it of items) {
      await db.run(`INSERT INTO order_items (id,order_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)`, it.id, oid, it.product_id, it.quantity, it.unit_price, it.subtotal);
    }
    ordCount++;
  }
  console.log(`Orders: ${ordCount}`);

  const txCats = ['Ventas','Servicios','Nómina','Proveedores','Servicios Públicos','Arriendo','Equipos','Marketing','Transporte','Seguros','Impuestos','Consultoría'];
  let txCount = 0;
  for (let i = 0; i < 80; i++) {
    const isIncome = Math.random() > 0.4;
    const cat = pick(txCats);
    await db.run(`INSERT INTO transactions (id,code,type,category,description,amount,payment_method,reference,date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT (code) DO NOTHING`,
      uuidv4(), `TXN-${String(i + 1).padStart(4, '0')}`,
      isIncome ? 'income' : 'expense', cat, `${isIncome ? 'Ingreso por' : 'Pago de'} ${cat}`,
      isIncome ? rand(500000, 25000000) : rand(100000, 8000000),
      pick(['cash','card','transfer','transfer','transfer']), `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      daysAgo(rand(0, 90)), users[0].id);
    txCount++;
  }
  console.log(`Transactions: ${txCount}`);

  const subjects = ['Seguimiento cotización','Llamada de bienvenida','Revisión contrato','Propuesta comercial','Soporte técnico',
    'Actualización de datos','Oferta especial','Renovación servicio','Queja','Solicitud información'];
  for (let i = 0; i < 40; i++) {
    await db.run(`INSERT INTO interactions (id,customer_id,type,subject,description,status,assigned_to,due_date,created_by) VALUES (?,?,?,?,?,?,?,?,?)`,
      uuidv4(), pick(custIds), pick(['call','email','meeting','note','task']),
      pick(subjects), 'Interacción registrada para seguimiento comercial',
      pick(['completed','completed','completed','pending','scheduled']),
      pick(employeeIds), daysAgo(rand(-5, 30)), users[0].id);
  }
  console.log('Interactions: 40');

  const projectNames = ['Implementación ERP','Migración Cloud','App Móvil Corporativa','Rediseño Web','Auditoría Seguridad',
    'Campaña Marketing Digital','Optimización Procesos','Data Warehouse','E-commerce Platform','CRM Personalizado'];
  const projIds = [];
  for (const [i, n] of projectNames.entries()) {
    const id = uuidv4();
    await db.run(`INSERT INTO projects (id,code,name,description,customer_id,start_date,end_date,budget,status,priority,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (code) DO NOTHING`,
      id, `PROJ-${String(i + 1).padStart(3, '0')}`, n, `Proyecto: ${n} - Transformación digital integral`,
      pick(custIds), daysAgo(rand(0, 90)), daysAgo(rand(-180, -10)),
      rand(10000000, 200000000),
      pick(['active','active','active','planning','completed','completed']),
      pick(['low','medium','medium','high','high','critical']), users[0].id);
    projIds.push(id);
  }
  console.log(`Projects: ${projIds.length}`);

  const taskNames = ['Análisis de requisitos','Diseño de solución','Desarrollo backend','Desarrollo frontend','Pruebas QA',
    'Documentación','Despliegue','Capacitación','Revisión de código','Integración APIs',
    'Optimización rendimiento','Seguridad','Testing usuario','Migración datos','Monitoreo'];
  for (const pid of projIds) {
    const numTasks = rand(3, 8);
    for (let i = 0; i < numTasks; i++) {
      await db.run(`INSERT INTO tasks (id,project_id,name,description,assigned_to,status,priority,due_date,estimated_hours,actual_hours,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        uuidv4(), pid, pick(taskNames), 'Tarea del proyecto asignada al equipo',
        pick(employeeIds),
        pick(['pending','in_progress','in_progress','review','completed','completed']),
        pick(['low','medium','medium','high','high']),
        daysAgo(rand(-30, 30)), rand(4, 80), rand(2, 60), users[0].id);
    }
  }
  console.log('Tasks generated');

  const notifs = [
    ['Bienvenido a NEXUS ERP', 'Has iniciado sesión correctamente en el sistema', 'success'],
    ['Reporte semanal disponible', 'Los reportes de esta semana ya están generados', 'info'],
    ['Stock bajo', 'Algunos productos tienen inventario crítico', 'warning'],
    ['Tarea completada', 'La tarea de actualización de datos fue finalizada', 'success'],
    ['Recordatorio de nómina', 'La nómina del mes debe ser procesada', 'info'],
    ['Meta del mes', 'Las ventas han alcanzado el 85% de la meta mensual', 'info'],
  ];
  for (const u of users) {
    for (const n of notifs) {
      await db.run(`INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)`,
        uuidv4(), u.id, n[0], n[1], n[2]);
    }
  }
  console.log('Notifications created');
  console.log('\nSeed completed!');
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
