const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath = path.join(__dirname, 'database.sqlite');

// Di lingkungan Vercel, filesystem root read-only, salin ke /tmp agar dapat ditulisi
if (process.env.VERCEL) {
  const tmpDbPath = path.join('/tmp', 'database.sqlite');
  if (!fs.existsSync(tmpDbPath) && fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, tmpDbPath);
  }
  dbPath = tmpDbPath;
}

const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency and integrity
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Create tables if they do not exist yet (idempotent)
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

module.exports = db;
