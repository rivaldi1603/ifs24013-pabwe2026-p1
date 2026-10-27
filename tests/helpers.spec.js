import { describe, it, expect, beforeAll } from 'vitest';
const db = require('../db');
const {
  slugify,
  generateUniqueSlug,
  getPagination,
  applyCommonCatalogFilters,
  fetchEntityReviews,
  createDeleteHandler,
  sendListQuery,
  sendPaginatedQuery,
  findEntityByIdOrSlug,
  normalizeCommunityFlag
} = require('../utils/helpers');



describe('Unit Tests for utils/helpers.js and db.js Wrapper', () => {
  beforeAll(async () => {
    await db.ready;
  });

  describe('slugify()', () => {
    it('converts text to lowercase and replaces spaces and symbols with single dashes', () => {
      expect(slugify('Danau Toba Indah & Asri!')).toBe('danau-toba-indah-asri');
      expect(slugify('---Halo   Dunia---')).toBe('halo-dunia');
      expect(slugify('Multiple---Dashes--Test')).toBe('multiple-dashes-test');
    });
  });

  describe('generateUniqueSlug()', () => {
    it('returns standard slug when no conflict exists', () => {
      const slug = generateUniqueSlug(db, 'destinations', 'Destinasi Benar-Benar Baru Unik 987');
      expect(slug).toBe('destinasi-benar-benar-baru-unik-987');
    });

    it('appends timestamp suffix when slug already exists in table', () => {
      // First insert temporary destination
      const existingSlug = 'aek-bath-sitio-tio'; // Already seeded in destinations
      const uniqueSlug = generateUniqueSlug(db, 'destinations', 'Aek Bath Sitio Tio');
      expect(uniqueSlug.startsWith('aek-bath-sitio-tio-')).toBe(true);
    });
  });

  describe('getPagination()', () => {
    it('uses default limits and values when query is empty', () => {
      const def = getPagination();
      expect(def.page).toBe(1);
      expect(def.limit).toBe(20);
      expect(def.offset).toBe(0);

      const customDef = getPagination({}, 10);
      expect(customDef.limit).toBe(10);
    });

    it('clamps limit between 1 and 100', () => {
      const low = getPagination({ limit: -5, page: -2 });
      expect(low.limit).toBe(1);
      expect(low.page).toBe(1);
      expect(low.offset).toBe(0);

      const high = getPagination({ limit: 500, page: 3 });
      expect(high.limit).toBe(100);
      expect(high.page).toBe(3);
      expect(high.offset).toBe(200);
    });
  });

  describe('applyCommonCatalogFilters()', () => {
    it('returns empty conditions and params for empty queryObj', () => {
      const res = applyCommonCatalogFilters();
      expect(res.conditions).toBe('');
      expect(res.params).toEqual([]);
    });

    it('handles numeric category and string slug category', () => {
      const numRes = applyCommonCatalogFilters({ category: '5' }, 'd');
      expect(numRes.conditions).toContain('d.category_id = ?');
      expect(numRes.params).toEqual([5]);

      const slugRes = applyCommonCatalogFilters({ category: 'alam-budaya' }, 's');
      expect(slugRes.conditions).toContain('c.slug = ?');
      expect(slugRes.params).toEqual(['alam-budaya']);
    });

    it('handles regency and community_only variations (1 and true)', () => {
      const regRes = applyCommonCatalogFilters({ regency: '3', community_only: '1' }, 'd');
      expect(regRes.conditions).toContain('d.regency_id = ?');
      expect(regRes.conditions).toContain('d.is_community_managed = 1');
      expect(regRes.params).toEqual([3]);

      const boolRes = applyCommonCatalogFilters({ community_only: 'true' }, 's');
      expect(boolRes.conditions).toContain('s.is_community_managed = 1');
    });
  });

  describe('fetchEntityReviews()', () => {
    it('returns reviews array for an entity', () => {
      const reviews = fetchEntityReviews(db, 'destination', 1);
      expect(Array.isArray(reviews)).toBe(true);
    });
  });

  describe('createDeleteHandler()', () => {
    it('returns 404 if entity does not exist', () => {
      const handler = createDeleteHandler(db, 'destinations', 'Destinasi');
      let status = 0;
      let body = null;
      const res = {
        status: (code) => {
          status = code;
          return { json: (data) => { body = data; } };
        }
      };

      handler({ params: { id: 9999999 } }, res);
      expect(status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toContain('tidak ditemukan');
    });

    it('returns 500 when database throws error', () => {
      const brokenDb = {
        prepare: () => {
          throw new Error('Database connection failed');
        }
      };
      const handler = createDeleteHandler(brokenDb, 'destinations', 'Destinasi');
      let status = 0;
      let body = null;
      const res = {
        status: (code) => {
          status = code;
          return { json: (data) => { body = data; } };
        }
      };

      handler({ params: { id: 1 } }, res);
      expect(status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('deletes an existing entity and runs cleanupTargetType if provided', () => {
      const ins = db.prepare(`
        INSERT INTO destinations (name, slug, category_id, regency_id)
        VALUES ('Test Delete Target', 'test-delete-target-helper', 1, 1)
      `).run();
      const newId = ins.lastInsertRowid;

      let jsonBody = null;
      const res = {
        json: (data) => { jsonBody = data; return data; }
      };

      const handler = createDeleteHandler(db, 'destinations', 'Destinasi wisata', 'destination');
      handler({ params: { id: newId } }, res);
      expect(jsonBody.success).toBe(true);
      expect(jsonBody.message).toContain('berhasil dihapus');
    });
  });

  describe('sendListQuery() & sendPaginatedQuery()', () => {
    it('sendListQuery returns formatted json response', () => {
      let result = null;
      const res = { json: (d) => { result = d; return d; } };
      sendListQuery(res, db, 'SELECT 1 as num');
      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.data[0].num).toBe(1);
    });

    it('sendPaginatedQuery formats pagination metadata and handles limits', () => {
      let result = null;
      const res = { json: (d) => { result = d; return d; } };
      sendPaginatedQuery(
        res,
        db,
        'SELECT COUNT(*) as total FROM categories',
        'SELECT * FROM categories ORDER BY id ASC',
        [],
        { page: 1, limit: 2 },
        2
      );
      expect(result.success).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    it('sendPaginatedQuery handles query returning empty count', () => {
      const mockDb = {
        prepare: (sql) => ({
          get: () => undefined,
          all: () => []
        })
      };
      let result = null;
      const res = { json: (d) => { result = d; return d; } };
      sendPaginatedQuery(res, mockDb, 'SELECT 0 as total', 'SELECT 1', [], {}, 10);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findEntityByIdOrSlug()', () => {
    it('finds entity by numeric id', () => {
      const entity = findEntityByIdOrSlug(db, 'destinations', 'd', 1);
      expect(entity).toBeDefined();
      expect(entity.id).toBe(1);
    });

    it('finds entity by string slug', () => {
      const first = db.prepare('SELECT slug FROM destinations LIMIT 1').get();
      if (first?.slug) {
        const entity = findEntityByIdOrSlug(db, 'destinations', 'd', first.slug);
        expect(entity).toBeDefined();
        expect(entity.slug).toBe(first.slug);
      }
    });

    it('falls back to numeric lookup or returns undefined when not found', () => {
      const entity1 = findEntityByIdOrSlug(db, 'destinations', 'd', 'slug-that-does-not-exist-99999');
      expect(entity1).toBeUndefined();

      const entity2 = findEntityByIdOrSlug(db, 'destinations', 'd', 99999999);
      expect(entity2).toBeUndefined();
    });
  });

  describe('db.js parameter normalization and wrapper methods', () => {
    it('normalizes undefined values to null in both array and argument forms', () => {
      // Test get with array and undefined
      const row1 = db.prepare('SELECT ? as val').get([undefined]);
      expect(row1.val).toBeNull();

      // Test get with spread argument
      const row2 = db.prepare('SELECT ? as val').get(undefined);
      expect(row2.val).toBeNull();

      // Test all with array and undefined
      const rows1 = db.prepare('SELECT ? as val').all([undefined]);
      expect(rows1[0].val).toBeNull();

      // Test all with spread arguments
      const rows2 = db.prepare('SELECT ? as val').all(undefined);
      expect(rows2[0].val).toBeNull();

      // Test run with array and spread arguments
      const run1 = db.prepare('SELECT ?').run([undefined]);
      expect(run1).toHaveProperty('changes');

      const run2 = db.prepare('SELECT ?').run(undefined);
      expect(run2).toHaveProperty('changes');
    });

    it('handles transactions, exec, and pragma', () => {
      const tx = db.transaction(() => {
        db.exec('SELECT 1');
        return true;
      });
      expect(tx()).toBe(true);

      expect(() => db.pragma('foreign_keys')).not.toThrow();
    });

    it('rolls back and rethrows error when transaction fails', () => {
      expect(() => {
        db.transaction(() => {
          throw new Error('Simulation of transaction failure');
        })();
      }).toThrow('Simulation of transaction failure');
    });

    it('exercises createSqlJsWrapper directly with an in-memory database', async () => {
      const initSqlJs = require('sql.js/dist/sql-wasm-inline.js');
      const SQL = await initSqlJs();
      const inMemDb = new SQL.Database();
      const wrapper = db.createSqlJsWrapper(inMemDb);

      wrapper.exec('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)');
      const inserted = wrapper.prepare('INSERT INTO test_table (name) VALUES (?)').run('Item A');
      expect(inserted.lastInsertRowid).toBe(1);
      expect(inserted.changes).toBe(1);

      const found = wrapper.prepare('SELECT * FROM test_table WHERE id = ?').get(1);
      expect(found.name).toBe('Item A');

      const all = wrapper.prepare('SELECT * FROM test_table').all();
      expect(all.length).toBe(1);

      wrapper.pragma('foreign_keys = ON');
    });
  });

  describe('normalizeCommunityFlag()', () => {
    it('returns null when value is undefined', () => {
      expect(normalizeCommunityFlag(undefined)).toBeNull();
    });

    it('returns 1 when value is truthy and 0 when falsy', () => {
      expect(normalizeCommunityFlag(true)).toBe(1);
      expect(normalizeCommunityFlag(1)).toBe(1);
      expect(normalizeCommunityFlag('1')).toBe(1);
      expect(normalizeCommunityFlag(false)).toBe(0);
      expect(normalizeCommunityFlag(0)).toBe(0);
      expect(normalizeCommunityFlag('')).toBe(0);
      expect(normalizeCommunityFlag(null)).toBe(0);
    });
  });
});

