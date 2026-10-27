const path = require('node:path');
const fs = require('node:fs');

let dbInstance = null;
let dbReady = null;

const dbPath = path.join(__dirname, 'database.sqlite');

function normalizeParams(args) {
  const raw = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  return raw.map(p => (p === undefined ? null : p));
}

function createSqlJsWrapper(wasmDb) {
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
          let row;
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
          } catch (e) {
            /* v8 ignore start */
            console.debug('Failed to fetch last_insert_rowid:', e);
            /* v8 ignore stop */
          }
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
      try {
        wasmDb.run(`PRAGMA ${cmd}`);
      } catch (e) {
        /* v8 ignore start */
        console.debug(`Failed to execute PRAGMA ${cmd}:`, e);
        /* v8 ignore stop */
      }
    }
  };
}

// Pure WebAssembly SQLite engine (sql.js inline)
// 100% portable, works across Vercel serverless, Linux, Windows, Docker, and Bun without C++ compilation
const initSqlJs = require('sql.js/dist/sql-wasm-inline.js');
async function initDatabase() {
  try {
    const SQL = await initSqlJs();
    /* v8 ignore start */
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
    /* v8 ignore stop */

    dbInstance = createSqlJsWrapper(wasmDb);
    console.log('[JelajahToba] SQLite engine (WebAssembly inline) ready. Tables count:', 
      wasmDb.exec("SELECT count(*) FROM sqlite_master WHERE type='table'")[0]?.values[0][0] || 0);
  } catch (e) {
    /* v8 ignore start */
    console.error('[JelajahToba] Failed to initialize SQLite engine:', e);
    /* v8 ignore stop */
  }
}

function getDbReady() {

  if (!dbReady) {
    dbReady = initDatabase();
  }
  return dbReady;
}

const db = {
  get ready() {
    return getDbReady();
  },
  prepare: (sql) => {
    getDbReady();
    return dbInstance.prepare(sql);
  },
  transaction: (fn) => {
    getDbReady();
    return dbInstance.transaction(fn);
  },
  exec: (sql) => {
    getDbReady();
    return dbInstance.exec(sql);
  },
  pragma: (cmd) => {
    getDbReady();
    return dbInstance.pragma(cmd);
  },
  createSqlJsWrapper
};


module.exports = db;
