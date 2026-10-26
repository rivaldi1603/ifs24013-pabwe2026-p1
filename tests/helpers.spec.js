import { describe, it, expect, beforeAll } from 'vitest';
import db from '../db.js';
import {
  slugify,
  generateUniqueSlug,
  getPagination,
  applyCommonCatalogFilters,
  fetchEntityReviews,
  createDeleteHandler
} from '../utils/helpers.js';

describe('Unit Tests for utils/helpers.js and db.js Wrapper', () => {
  beforeAll(async () => {
    await db.ready;
  });

  describe('slugify()', () => {
    it('converts text to lowercase and replaces spaces and symbols with single dashes', () => {
      expect(slugify('Danau Toba Indah & Asri!')).toBe('danau-toba-indah-asri');
      expect(slugify('---Halo   Dunia---')).toBe('halo-dunia');
      expect(slugify('Multiple---Dashes__Test')).toBe('multiple-dashes_test');
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
  });
});
