const Database = require('better-sqlite3');
const db = new Database('synex.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
  try {
    const cols = db.prepare('PRAGMA table_info(' + t.name + ')').all();
    const textCols = cols.filter(c => c.type.includes('TEXT') || c.type.includes('CHAR')).map(c => c.name);
    if (textCols.length > 0) {
      textCols.forEach(col => {
        const rows = db.prepare('SELECT ' + col + ' FROM ' + t.name + ' WHERE ' + col + ' LIKE ?').all('%deliwoufles%');
        if (rows.length > 0) console.log('Found in', t.name, '.', col, ':', rows);
      });
    }
  } catch (e) {}
});