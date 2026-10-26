import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import db from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

describe('CRUD Operations & Route Parameters Test Suite', () => {
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    await db.ready;

    adminToken = jwt.sign({ id: 1, name: 'Admin JelajahToba', role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    userToken = jwt.sign({ id: 5, name: 'Budi Santoso', role: 'user' }, JWT_SECRET, { expiresIn: '1d' });
  });

  describe('Destinations CRUD', () => {
    let createdDestId = null;

    it('GET /api/destinations with category slug, search, and community_only filter', async () => {
      const res = await request(app).get('/api/destinations?category=alam&search=toba&community_only=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/destinations/:idOrSlug with numeric ID', async () => {
      const res = await request(app).get('/api/destinations/1');
      expect([200, 404]).toContain(res.status);
    });

    it('GET /api/destinations/featured returns top destinations', async () => {
      const res = await request(app).get('/api/destinations/featured');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/destinations creates a new destination (Admin)', async () => {
      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bukit Holbung Uji',
          category_id: 1,
          regency_id: 1,
          description: 'Pemandangan perbukitan hijau spektakuler.',
          price_display: 'Rp 10.000',
          address: 'Desa Janji Martahan',
          is_community_managed: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('id');
      createdDestId = res.body.id;
    });

    it('POST /api/destinations fails when missing name or regency', async () => {
      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/destinations/:id updates destination data', async () => {
      const res = await request(app)
        .put(`/api/destinations/${createdDestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bukit Holbung Diperbarui',
          price_display: 'Rp 15.000'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /api/destinations/:id returns 404 for non-existent destination', async () => {
      const res = await request(app)
        .put('/api/destinations/99999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Tak Ada' });

      expect(res.status).toBe(404);
    });

    it('DELETE /api/destinations/:id deletes destination', async () => {
      const res = await request(app)
        .delete(`/api/destinations/${createdDestId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/destinations/:id returns 404 on already deleted destination', async () => {
      const res = await request(app)
        .delete(`/api/destinations/${createdDestId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Services CRUD', () => {
    let createdServiceId = null;

    it('GET /api/services with search and service_type filter', async () => {
      const res = await request(app).get('/api/services?service_type=homestay&search=toba');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/services creates a new service', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Homestay Bagus Toba',
          category_id: 1,
          regency_id: 1,
          provider_name: 'Pak Sitorus',
          service_type: 'homestay',
          price_min: 150000,
          price_max: 250000,
          price_display: 'Rp 150.000 / malam',
          is_community_managed: false
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('id');
      createdServiceId = res.body.id;
    });

    it('POST /api/services fails when missing fields', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('PUT /api/services/:id updates service', async () => {
      const res = await request(app)
        .put(`/api/services/${createdServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Homestay Bagus Toba Updated'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/services/:id removes service', async () => {
      const res = await request(app)
        .delete(`/api/services/${createdServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Transport CRUD', () => {
    let createdTransId = null;

    it('POST /api/transport creates new transport route', async () => {
      const res = await request(app)
        .post('/api/transport')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rute Dermaga Tigaras - Simanindo',
          transport_type: 'ferry',
          route_direction: 'Tigaras ke Simanindo',
          vehicle_type: 'KMP Julu',
          departure_hours: 'Setiap 2 Jam',
          price_display: 'Rp 12.000'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdTransId = res.body.data.id;
    });

    it('POST /api/transport fails when missing route_direction', async () => {
      const res = await request(app)
        .post('/api/transport')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Rute Tanpa Arah' });

      expect(res.status).toBe(400);
    });

    it('PUT /api/transport/:id updates transport route', async () => {
      const res = await request(app)
        .put(`/api/transport/${createdTransId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rute Tigaras - Simanindo Diperbarui'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/transport/:id deletes transport route', async () => {
      const res = await request(app)
        .delete(`/api/transport/${createdTransId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Culinary CRUD & Restaurants', () => {
    let createdCulId = null;

    it('GET /api/culinary/restaurants returns eateries with pagination', async () => {
      const res = await request(app).get('/api/culinary/restaurants?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/culinary/restaurants with filters for regency, halal, and search', async () => {
      const res = await request(app).get('/api/culinary/restaurants?page=1&limit=5&regency=1&halal=1&search=ikan');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/culinary/items creates culinary menu', async () => {
      const res = await request(app)
        .post('/api/culinary/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Kue Gadong Toba',
          halal_status: 'Halal',
          origin_region: 'Balige',
          description: 'Kue tradisional berbahan ubi kayu khas Batak'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdCulId = res.body.data.id;
    });

    it('PUT /api/culinary/items/:id updates culinary item', async () => {
      const res = await request(app)
        .put(`/api/culinary/items/${createdCulId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kue Gadong Toba Manis' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/culinary/items/:id deletes culinary item', async () => {
      const res = await request(app)
        .delete(`/api/culinary/items/${createdCulId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Articles CRUD', () => {
    let createdArticleId = null;

    it('POST /api/articles creates article', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Legenda Batu Gantung Danau Toba',
          summary: 'Kisah cinta dan kesetiaan seorang gadis Batak.',
          source_url: 'https://jelajahtoba.id/cerita/batu-gantung'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdArticleId = res.body.data.id;
    });

    it('PUT /api/articles/:id updates article', async () => {
      const res = await request(app)
        .put(`/api/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Legenda Batu Gantung Danau Toba (Edisi Lengkap)' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/articles/:id removes article', async () => {
      const res = await request(app)
        .delete(`/api/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Reviews CRUD & Moderation', () => {
    let reviewId = null;

    it('GET /api/reviews returns review list', async () => {
      const res = await request(app).get('/api/reviews');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/reviews with target_type and target_id', async () => {
      const res = await request(app).get('/api/reviews?target_type=destination&target_id=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/reviews with user_id', async () => {
      const res = await request(app).get('/api/reviews?user_id=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/reviews submits a review successfully', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'destination',
          target_id: 1,
          rating: 4.5,
          review_text: 'Pengalaman luar biasa saat berkunjung ke Danau Toba!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      reviewId = res.body.data.id;
    });

    it('POST /api/reviews and DELETE for service target', async () => {
      const postRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'service',
          target_id: 1,
          rating: 5.0,
          review_text: 'Pelayanan homestay sangat ramah dan memuaskan.'
        });
      expect(postRes.status).toBe(201);
      const sRevId = postRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/reviews/${sRevId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(200);
    });

    it('POST /api/reviews rejects invalid rating', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'destination',
          target_id: 1,
          rating: 7.0,
          review_text: 'Rating berlebihan'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('1.0 sampai 5.0');
    });

    it('POST /api/reviews rejects invalid target_type', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          target_type: 'invalid_type',
          target_id: 1,
          rating: 5,
          review_text: 'Test review'
        });

      expect(res.status).toBe(400);
    });

    it('DELETE /api/reviews/:id allows admin to moderate and delete review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
