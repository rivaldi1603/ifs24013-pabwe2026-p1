const path = require('path');
const fs = require('fs');

let dbInstance = null;
let dbReady = null;

const dbPath = path.join(__dirname, 'database.sqlite');

function createSqlJsWrapper(wasmDb) {
  function normalizeParams(args) {
    const raw = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    return raw.map(p => (p === undefined ? null : p));
  }
  return {
    prepare: (sql) => {
      return {
        all: (...args) => {
          const params = normalizeParams(args);
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
          const params = normalizeParams(args);
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
          const params = normalizeParams(args);
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

// Pure WebAssembly SQLite engine (sql.js inline)
// 100% portable, works across Vercel serverless, Linux, Windows, Docker, and Bun without C++ compilation
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
    console.log('[JelajahToba] SQLite engine (WebAssembly inline) ready. Tables count:', 
      wasmDb.exec("SELECT count(*) FROM sqlite_master WHERE type='table'")[0]?.values[0][0] || 0);
  } catch (e) {
    console.error('[JelajahToba] Failed to initialize SQLite engine:', e);
  }
})();

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
