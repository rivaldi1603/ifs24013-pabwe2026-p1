import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatRating,
  formatServiceType,
  truncateText,
  slugify,
  getEstimatedPrice,
  generateSessionId
} from '../utils/formatters.js';

describe('formatters utility unit tests', () => {
  describe('formatCurrency', () => {
    it('formats valid numbers to Indonesian Rupiah', () => {
      expect(formatCurrency(100000)).toBe('Rp 100.000');
      expect(formatCurrency('250000')).toBe('Rp 250.000');
      expect(formatCurrency(0)).toBe('Rp 0');
    });

    it('handles null, undefined, and NaN gracefully', () => {
      expect(formatCurrency(null)).toBe('Rp 0');
      expect(formatCurrency(undefined)).toBe('Rp 0');
      expect(formatCurrency('invalid')).toBe('Rp 0');
    });
  });

  describe('formatRating', () => {
    it('formats valid rating to 1 decimal place', () => {
      expect(formatRating(4.86)).toBe('4.9');
      expect(formatRating(5)).toBe('5.0');
      expect(formatRating('4.2')).toBe('4.2');
    });

    it('handles null, undefined, or invalid rating', () => {
      expect(formatRating(null)).toBe('0.0');
      expect(formatRating(undefined)).toBe('0.0');
      expect(formatRating('abc')).toBe('0.0');
    });
  });

  describe('formatServiceType', () => {
    it('maps known service types correctly', () => {
      expect(formatServiceType('homestay')).toBe('Homestay Warga');
      expect(formatServiceType('cultural_experience')).toBe('Workshop & Budaya');
      expect(formatServiceType('tour_guide')).toBe('Pemandu Lokal');
      expect(formatServiceType('adventure')).toBe('Petualangan Air/Alam');
      expect(formatServiceType('boat_rental')).toBe('Sewa Solu / Perahu');
    });

    it('returns default fallback for unknown service type', () => {
      expect(formatServiceType('unknown_type')).toBe('Layanan Lokal');
      expect(formatServiceType('')).toBe('Layanan Lokal');
    });
  });

  describe('truncateText', () => {
    it('truncates text that exceeds max length', () => {
      const text = 'JelajahToba adalah platform pariwisata Danau Toba yang memberdayakan masyarakat lokal dan budaya Batak.';
      expect(truncateText(text, 20)).toBe('JelajahToba adalah p...');
    });

    it('keeps short text intact', () => {
      expect(truncateText('Danau Toba', 20)).toBe('Danau Toba');
    });

    it('handles falsy or non-string input', () => {
      expect(truncateText('')).toBe('');
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
      expect(truncateText(123456789, 5)).toBe('12345...');
    });
  });

  describe('slugify', () => {
    it('converts title string to clean url slug', () => {
      expect(slugify('Danau Toba Indah!')).toBe('danau-toba-indah');
      expect(slugify('Homestay & Wisata Lokal 2026')).toBe('homestay-wisata-lokal-2026');
      expect(slugify('  Trekking Geosite Huta Ginjang  ')).toBe('trekking-geosite-huta-ginjang');
    });

    it('handles empty or non-string values', () => {
      expect(slugify('')).toBe('');
      expect(slugify(null)).toBe('');
      expect(slugify(undefined)).toBe('');
      expect(slugify(123)).toBe('');
    });

    it('handles underscores, hyphens, and whitespace correctly', () => {
      expect(slugify('Danau_Toba---Samosir\t2026\nIsland')).toBe('danau-toba-samosir-2026-island');
      expect(slugify('---leading-and-trailing---')).toBe('leading-and-trailing');
    });

    it('is immune to catastrophic backtracking (ReDoS safe)', () => {
      const longInput = 'a'.repeat(10000) + '---' + 'b'.repeat(10000);
      const start = performance.now();
      const result = slugify(longInput);
      const elapsed = performance.now() - start;
      expect(result).toBe(`${'a'.repeat(10000)}-${'b'.repeat(10000)}`);
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('getEstimatedPrice', () => {
    it('returns formatted range if min and max are different', () => {
      expect(getEstimatedPrice(50000, 100000, 'orang')).toBe('Rp 50.000 – Rp 100.000 / orang');
    });

    it('returns single price if min and max are equal', () => {
      expect(getEstimatedPrice(75000, 75000, 'malam')).toBe('Rp 75.000 / malam');
    });

    it('handles only min or only max provided without unit', () => {
      expect(getEstimatedPrice(50000, 0)).toBe('Rp 50.000');
      expect(getEstimatedPrice(0, 80000)).toBe('Rp 80.000');
    });

    it('returns contact message when neither price is provided', () => {
      expect(getEstimatedPrice(0, 0)).toBe('Hubungi Pengelola');
      expect(getEstimatedPrice(null, null)).toBe('Hubungi Pengelola');
    });
  });

  describe('generateSessionId', () => {
    it('generates a session id with jt_ prefix', () => {
      const id = generateSessionId();
      expect(typeof id).toBe('string');
      expect(id.startsWith('jt_')).toBe(true);
    });
  });
});
