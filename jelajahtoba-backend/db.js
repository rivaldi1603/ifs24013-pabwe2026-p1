const path = require('path');
const fs = require('fs');

let dbInstance = null;
let dbReady = null;

const dbPath = path.join(__dirname, 'database.sqlite');

function createSqlJsWrapper(wasmDb) {
  return {
    prepare: (sql) => {
      return {
        all: (...args) => {
          const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          const stmt = wasmDb.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        },
        get: (...args) => {
          const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          const stmt = wasmDb.prepare(sql);
          stmt.bind(params);
          let row = undefined;
          if (stmt.step()) {
            row = stmt.getAsObject();
          }
          stmt.free();
          return row;
        },
        run: (...args) => {
          const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          wasmDb.run(sql, params);
          let lastId = 0;
          try {
            const res = wasmDb.exec('SELECT last_insert_rowid()');
            lastId = res[0]?.values[0][0] || 0;
          } catch (e) {}
          const changes = wasmDb.getRowsModified();
          return { lastInsertRowid: lastId, changes };
        }
      };
    },
    transaction: (fn) => (...args) => {
      wasmDb.run('BEGIN TRANSACTION');
      try {
        const res = fn(...args);
        wasmDb.run('COMMIT');
        return res;
      } catch (err) {
        wasmDb.run('ROLLBACK');
        throw err;
      }
    },
    exec: (sql) => wasmDb.exec(sql),
    pragma: (cmd) => {
      try { wasmDb.run(`PRAGMA ${cmd}`); } catch (e) {}
    }
  };
}

// Di lingkungan Vercel serverless, gunakan sql-wasm-inline (WebAssembly inlined)
// Ini 100% bebas dari external .wasm file path error dan native C++ binary error
if (process.env.VERCEL) {
  const initSqlJs = require('sql.js/dist/sql-wasm-inline.js');
  dbReady = (async () => {
    try {
      const SQL = await initSqlJs();
      let buffer = null;
      if (fs.existsSync(dbPath)) {
        buffer = fs.readFileSync(dbPath);
      }
      const wasmDb = buffer ? new SQL.Database(buffer) : new SQL.Database();
      if (!buffer) {
        const seedPath = path.join(__dirname, 'seed.sql');
        if (fs.existsSync(seedPath)) {
          wasmDb.run(fs.readFileSync(seedPath, 'utf8'));
        }
      }
      dbInstance = createSqlJsWrapper(wasmDb);
      console.log('[JelajahToba] Vercel inline WebAssembly SQLite engine initialized.');
    } catch (e) {
      console.error('[JelajahToba] Failed to initialize inline sql.js on Vercel:', e);
    }
  })();
} else {
  // Di lingkungan server persistent (Delcom DWS / Docker / Local), gunakan better-sqlite3 jika tersedia
  try {
    const mod = 'better-sqlite3';
    const Database = require(mod);
    const betterDb = new Database(dbPath);
    betterDb.pragma('foreign_keys = ON');
    betterDb.pragma('journal_mode = WAL');
    dbInstance = betterDb;
  } catch (nativeErr) {
    console.warn('[JelajahToba] better-sqlite3 unavailable, falling back to inline sql.js:', nativeErr.message);
    const initSqlJs = require('sql.js/dist/sql-wasm-inline.js');
    dbReady = (async () => {
      const SQL = await initSqlJs();
      let buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
      const wasmDb = buffer ? new SQL.Database(buffer) : new SQL.Database();
      dbInstance = createSqlJsWrapper(wasmDb);
    })();
  }
}

const db = {
  get ready() {
    return dbReady;
  },
  prepare: (sql) => {
    if (!dbInstance) {
      throw new Error('Database is not initialized yet. Please wait for db.ready.');
    }
    return dbInstance.prepare(sql);
  },
  transaction: (fn) => {
    if (!dbInstance) {
      throw new Error('Database is not initialized yet.');
    }
    return dbInstance.transaction(fn);
  },
  exec: (sql) => {
    if (!dbInstance) return;
    return dbInstance.exec(sql);
  },
  pragma: (cmd) => {
    if (!dbInstance) return;
    return dbInstance.pragma(cmd);
  }
};

module.exports = db;
