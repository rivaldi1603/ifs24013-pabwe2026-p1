import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import db from '../db.js';

describe('JelajahToba Backend REST API Unit & Integration Tests', () => {
  beforeAll(async () => {
    if (db.ready) {
      await db.ready;
    }
  });

  describe('Health Check & Meta Endpoints', () => {
    it('GET /health returns 200 and API status online', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'online');
      expect(res.body).toHaveProperty('name', 'JelajahToba API');
    });

    it('GET /api returns 200 with list of endpoints', async () => {
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('endpoints');
      expect(Array.isArray(res.body.endpoints)).toBe(true);
    });

    it('GET /api/meta/categories returns all destination categories', async () => {
      const res = await request(app).get('/api/meta/categories');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/meta/regencies returns all 8 regencies of Lake Toba region', async () => {
      const res = await request(app).get('/api/meta/regencies');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(8);
    });

    it('GET /api/meta/stats returns system statistics overview', async () => {
      const res = await request(app).get('/api/meta/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalDestinations');
      expect(res.body.data).toHaveProperty('totalServices');
    });
  });

  describe('Destinations Endpoints', () => {
    it('GET /api/destinations returns list of destinations', async () => {
      const res = await request(app).get('/api/destinations');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/destinations with query params filters correctly', async () => {
      const res = await request(app).get('/api/destinations?regency=1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/destinations/:idOrSlug returns 404 for invalid destination', async () => {
      const res = await request(app).get('/api/destinations/slug-tidak-akan-pernah-ada-99999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Services & Local Homestay Endpoints', () => {
    it('GET /api/services returns community services list', async () => {
      const res = await request(app).get('/api/services');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/services/:idOrSlug returns 404 for unknown service', async () => {
      const res = await request(app).get('/api/services/jasa-palsu-999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Transport, Culinary & Articles Endpoints', () => {
    it('GET /api/transport returns ferry and boat routes', async () => {
      const res = await request(app).get('/api/transport');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/culinary returns traditional Batak dishes catalog', async () => {
      const res = await request(app).get('/api/culinary');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/articles returns cultural articles', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/login fails when email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('POST /api/auth/login fails with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'salah@example.com', password: 'passwordSalah123' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('404 Not Found Handler', () => {
    it('returns 404 for non-existent route', async () => {
      const res = await request(app).get('/api/endpoint-acak-tidak-ada');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
