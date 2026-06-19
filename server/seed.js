const db = require('./db');

async function main() {
  console.log('Seeding Synex...\n');

  // Wipe data then re-init so auto-seed triggers
  const tables = ['notifications','tasks','projects','interactions','transactions','order_items','orders','customers','products','categories','attendance','employees','users'];
  for (const t of tables) {
    try { await db.run(`DELETE FROM ${t}`); } catch (e) { /* skip if table missing */ }
  }

  await db.init();

  const counts = {};
  for (const t of tables) {
    const row = await db.get(`SELECT COUNT(*) as c FROM ${t}`);
    counts[t] = row.c;
  }
  for (const [k, v] of Object.entries(counts)) {
    console.log(`${k}: ${v}`);
  }
  console.log('\nSeed completed!');
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
