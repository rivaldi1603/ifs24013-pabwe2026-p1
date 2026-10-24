const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;
try {
  let dbPath = path.join(__dirname, 'database.sqlite');

  // Di lingkungan Vercel, filesystem root read-only, salin atau inisialisasi di /tmp agar dapat ditulisi
  if (process.env.VERCEL) {
    const tmpDbPath = path.join('/tmp', 'database.sqlite');
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(dbPath)) {
        try {
          fs.copyFileSync(dbPath, tmpDbPath);
        } catch (e) {
          console.error('Failed to copy database to /tmp:', e);
        }
      }
    }
    dbPath = tmpDbPath;
  }

  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  if (process.env.VERCEL) {
    db.pragma('journal_mode = DELETE');
  } else {
    db.pragma('journal_mode = WAL');
  }

  // Create tables if they do not exist yet (idempotent)
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    try {
      db.exec(fs.readFileSync(schemaPath, 'utf8'));
    } catch (e) {
      console.error('Error executing schema.sql:', e.message);
    }
  }

  // Auto seed if tables are empty
  try {
    const destCheck = db.prepare('SELECT count(*) as count FROM destinations').get();
    if (!destCheck || destCheck.count === 0) {
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        db.exec(fs.readFileSync(seedPath, 'utf8'));
        console.log('Seeded database successfully!');
      }
    }
  } catch (e) {
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      try {
        db.exec(fs.readFileSync(seedPath, 'utf8'));
        console.log('Fallback seeded database successfully!');
      } catch (seedErr) {
        console.error('Auto-seed error:', seedErr.message);
      }
    }
  }
} catch (err) {
  console.error('Critical database initialization error:', err);
  db = {
    prepare: () => ({
      get: () => ({ count: 0 }),
      all: () => [],
      run: () => ({ lastInsertRowid: 1, changes: 1 })
    }),
    exec: () => {},
    pragma: () => {}
  };
}

module.exports = db;

