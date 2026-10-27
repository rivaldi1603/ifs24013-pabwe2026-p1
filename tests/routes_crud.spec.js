import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

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

    it('GET /api/destinations with numeric category, regency, and sort variations', async () => {
      const res1 = await request(app).get('/api/destinations?category=1&regency=1&sort=price_low');
      expect(res1.status).toBe(200);

      const res2 = await request(app).get('/api/destinations?sort=price_high');
      expect(res2.status).toBe(200);

      const res3 = await request(app).get('/api/destinations?sort=reviews');
      expect(res3.status).toBe(200);

      const res4 = await request(app).get('/api/destinations?sort=rating');
      expect(res4.status).toBe(200);
    });

    it('GET /api/destinations/:idOrSlug with numeric ID', async () => {
      const res = await request(app).get('/api/destinations/101');
      expect([200, 404]).toContain(res.status);
    });

    it('GET /api/destinations/:idOrSlug with string slug and 404 handler', async () => {
      const resSlug = await request(app).get('/api/destinations/aek-bath-sitio-tio');
      expect(resSlug.status).toBe(200);
      expect(resSlug.body.success).toBe(true);

      const res404 = await request(app).get('/api/destinations/non-existent-slug-xyz-999');
      expect(res404.status).toBe(404);
      expect(res404.body.success).toBe(false);
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
          price_display: 'Rp 15.000',
          is_community_managed: true
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
      const res = await request(app).get('/api/services?service_type=homestay&search=toba&category=1&regency=1&community_only=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/services/:idOrSlug with numeric ID, slug, and 404', async () => {
      const resNum = await request(app).get('/api/services/42');
      expect([200, 404]).toContain(resNum.status);

      const resSlug = await request(app).get('/api/services/atv-di-kebun-teh-sidamanik');
      expect([200, 404]).toContain(resSlug.status);

      const res404 = await request(app).get('/api/services/non-existent-service-slug-999');
      expect(res404.status).toBe(404);
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
          is_community_managed: true
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
          name: 'Homestay Bagus Toba Updated',
          is_community_managed: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/services/:id removes service and handles 404', async () => {
      const res = await request(app)
        .delete(`/api/services/${createdServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const res404 = await request(app)
        .delete('/api/services/99999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res404.status).toBe(404);
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

    it('GET /api/transport with type query parameter', async () => {
      const res = await request(app).get('/api/transport?type=ferry');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Culinary CRUD & Restaurants', () => {
    let createdCulId = null;

    it('GET /api/culinary with halal=1 and halal=true filters', async () => {
      const res1 = await request(app).get('/api/culinary?halal=1');
      expect(res1.status).toBe(200);
      const res2 = await request(app).get('/api/culinary?halal=true');
      expect(res2.status).toBe(200);
    });

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

    it('POST /api/culinary/items fails when name is missing', async () => {
      const res = await request(app)
        .post('/api/culinary/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });

    it('POST /api/culinary/items creates culinary menu', async () => {
      const res = await request(app)
        .post('/api/culinary/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Kue Gadong Toba',
          halal_status: 'Halal',
          origin_region: 'Balige',
          is_traditional: false,
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
        .send({ name: 'Kue Gadong Toba Manis', is_traditional: false });

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

    it('POST /api/articles fails when title is missing', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/articles/:id updates article', async () => {
      const res = await request(app)
        .put(`/api/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Legenda Batu Gantung Danau Toba (Edisi Lengkap)' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /api/articles/:id fails when title is missing or not found', async () => {
      const resBad = await request(app)
        .put(`/api/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '' });
      expect(resBad.status).toBe(400);

      const res404 = await request(app)
        .put('/api/articles/99999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Judul Baru' });
      expect(res404.status).toBe(404);
    });

    it('DELETE /api/articles/:id removes article and handles 404', async () => {
      const res = await request(app)
        .delete(`/api/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const res404 = await request(app)
        .delete('/api/articles/99999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res404.status).toBe(404);
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

    it('POST /api/reviews rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('wajib diisi');
    });

    it('DELETE /api/reviews/:id allows admin to moderate and delete review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Route Database Error Handlers & Edge Cases', () => {
    it('handles database errors in meta routes', async () => {
      const spy = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on categories');
      });
      const catRes = await request(app).get('/api/meta/categories');
      expect(catRes.status).toBe(500);
      spy.mockRestore();

      const spy2 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on regencies');
      });
      const regRes = await request(app).get('/api/meta/regencies');
      expect(regRes.status).toBe(500);
      spy2.mockRestore();

      const spy3 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on stats');
      });
      const statsRes = await request(app).get('/api/meta/stats');
      expect(statsRes.status).toBe(500);
      spy3.mockRestore();
    });

    it('handles database errors in articles routes', async () => {
      const spy1 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on get articles');
      });
      const getRes = await request(app).get('/api/articles');
      expect(getRes.status).toBe(500);
      spy1.mockRestore();

      const spy2 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on post article');
      });
      const postRes = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test DB Error Article' });
      expect(postRes.status).toBe(500);
      spy2.mockRestore();

      const spy3 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on put article');
      });
      const putRes = await request(app)
        .put('/api/articles/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title Error' });
      expect(putRes.status).toBe(500);
      spy3.mockRestore();
    });

    it('handles database errors and edge cases in transport routes', async () => {
      const spy1 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on transport get');
      });
      const getRes = await request(app).get('/api/transport');
      expect(getRes.status).toBe(500);
      spy1.mockRestore();

      const spy2 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on transport post');
      });
      const postRes = await request(app)
        .post('/api/transport')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Rute Error', route_direction: 'A ke B' });
      expect(postRes.status).toBe(500);
      spy2.mockRestore();

      const spy3 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on transport put');
      });
      const putRes = await request(app)
        .put('/api/transport/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Rute Updated Error' });
      expect(putRes.status).toBe(500);
      spy3.mockRestore();

      // PUT transport not found 404
      const notFoundRes = await request(app)
        .put('/api/transport/99999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Non Existent' });
      expect(notFoundRes.status).toBe(404);
    });

    it('handles database errors and edge cases in culinary routes', async () => {
      const spy1 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on culinary get');
      });
      const getRes = await request(app).get('/api/culinary');
      expect(getRes.status).toBe(500);
      spy1.mockRestore();

      const spy2 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on culinary post');
      });
      const postRes = await request(app)
        .post('/api/culinary/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Makanan DB Error' });
      expect(postRes.status).toBe(500);
      spy2.mockRestore();

      const spy3 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on culinary put');
      });
      const putRes = await request(app)
        .put('/api/culinary/items/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Makanan Update Error' });
      expect(putRes.status).toBe(500);
      spy3.mockRestore();

      const spy4 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on restaurants');
      });
      const restRes = await request(app).get('/api/culinary/restaurants');
      expect(restRes.status).toBe(500);
      spy4.mockRestore();

      // PUT culinary not found 404
      const notFoundRes = await request(app)
        .put('/api/culinary/items/99999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Non Existent Item' });
      expect(notFoundRes.status).toBe(404);
    });

    it('handles database errors and edge cases in destinations routes', async () => {
      const spy1 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on destinations get');
      });
      const getRes = await request(app).get('/api/destinations');
      expect(getRes.status).toBe(500);
      spy1.mockRestore();

      const spy2 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on destinations featured');
      });
      const featRes = await request(app).get('/api/destinations/featured');
      expect(featRes.status).toBe(500);
      spy2.mockRestore();

      const spy3 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on destination detail');
      });
      const detRes = await request(app).get('/api/destinations/1');
      expect(detRes.status).toBe(500);
      spy3.mockRestore();

      const spy4 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on destination create');
      });
      const postRes = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Wisata Error', category_id: 1, regency_id: 1 });
      expect(postRes.status).toBe(500);
      spy4.mockRestore();

      const spy5 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on destination update');
      });
      const putRes = await request(app)
        .put('/api/destinations/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Wisata Update Error' });
      expect(putRes.status).toBe(500);
      spy5.mockRestore();

      // PUT destination not found 404
      const notFoundRes = await request(app)
        .put('/api/destinations/99999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Non Existent' });
      expect(notFoundRes.status).toBe(404);
    });

    it('handles database errors and edge cases in services routes', async () => {
      const spy1 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on services get');
      });
      const getRes = await request(app).get('/api/services');
      expect(getRes.status).toBe(500);
      spy1.mockRestore();

      const spy2 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on service detail');
      });
      const detRes = await request(app).get('/api/services/1');
      expect(detRes.status).toBe(500);
      spy2.mockRestore();

      const spy3 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on service create');
      });
      const postRes = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Jasa Error', category_id: 1, regency_id: 1, provider_name: 'Provider' });
      expect(postRes.status).toBe(500);
      spy3.mockRestore();

      const spy4 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on service update');
      });
      const putRes = await request(app)
        .put('/api/services/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Jasa Update Error' });
      expect(putRes.status).toBe(500);
      spy4.mockRestore();

      // PUT service not found 404
      const notFoundRes = await request(app)
        .put('/api/services/99999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Non Existent' });
      expect(notFoundRes.status).toBe(404);
    });

    it('handles database errors and edge cases in reviews routes', async () => {
      const spy1 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on reviews get');
      });
      const getRes = await request(app).get('/api/reviews');
      expect(getRes.status).toBe(500);
      spy1.mockRestore();

      const spy2 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on reviews post');
      });
      const postRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ target_type: 'destination', target_id: 1, rating: 5, review_text: 'Bagus sekali pemandangannya' });
      expect(postRes.status).toBe(500);
      spy2.mockRestore();

      const spy3 = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('DB error on reviews delete');
      });
      const delRes = await request(app)
        .delete('/api/reviews/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(500);
      spy3.mockRestore();

      // Non-existent review delete -> 404
      const notFoundRes = await request(app)
        .delete('/api/reviews/99999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(notFoundRes.status).toBe(404);
    });
  });

  describe('Complete Route Branch & Fallback Coverage', () => {
    it('covers all optional fallbacks and branches in POST/PUT /api/articles', async () => {
      // 1. POST article with explicit slug, regency_id, published_at, summary, source_url
      const resFull = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Artikel Lengkap Danau Toba',
          slug: 'artikel-lengkap-toba-custom',
          regency_id: 1,
          summary: 'Ringkasan lengkap artikel',
          source_url: 'https://jelajahtoba.id/full',
          published_at: '2026-01-01'
        });
      expect(resFull.status).toBe(201);
      const articleId = resFull.body.data.id;

      // 2. POST article with minimal body (no slug, no regency_id, no published_at, no summary, no source_url)
      const resMin = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Artikel Minimalis Danau Toba'
        });
      expect(resMin.status).toBe(201);

      // 3. PUT article with explicit regency_id, summary, source_url, published_at
      const resPutFull = await request(app)
        .put(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Artikel Lengkap Updated',
          regency_id: 2,
          summary: 'Ringkasan baru',
          source_url: 'https://jelajahtoba.id/updated',
          published_at: '2026-02-02'
        });
      expect(resPutFull.status).toBe(200);

      // 4. PUT article with minimal body (regency_id falsy, summary/source_url/published_at undefined)
      const resPutMin = await request(app)
        .put(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Artikel Tetap Sama'
        });
      expect(resPutMin.status).toBe(200);
    });

    it('covers all optional fallbacks and branches in POST/PUT /api/culinary/items', async () => {
      // 1. POST culinary item with explicit slug, traditional true, description, halal_status, origin_region, image_url
      const resFull = await request(app)
        .post('/api/culinary/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ikan Mas Arsik Istimewa',
          slug: 'ikan-mas-arsik-istimewa-slug',
          description: 'Makanan khas Batak dengan bumbu andaliman',
          halal_status: 'Halal',
          origin_region: 'Samosir',
          is_traditional: true,
          image_url: 'https://example.com/arsik.jpg'
        });
      expect(resFull.status).toBe(201);
      const culId = resFull.body.data.id;

      // 2. POST culinary item with minimal body (slug generated, default fallbacks for description, halal_status, origin_region, image_url, is_traditional undefined)
      const resMin = await request(app)
        .post('/api/culinary/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Kopi Lintong Seduh'
        });
      expect(resMin.status).toBe(201);

      // 3. PUT culinary item with all fields defined including is_traditional: false
      const resPutFull = await request(app)
        .put(`/api/culinary/items/${culId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ikan Mas Arsik Diperbarui',
          description: 'Deskripsi baru',
          halal_status: 'Halal',
          origin_region: 'Toba',
          is_traditional: false,
          image_url: 'https://example.com/new.jpg'
        });
      expect(resPutFull.status).toBe(200);

      // 4. PUT culinary item with is_traditional: true
      const resPutTrad = await request(app)
        .put(`/api/culinary/items/${culId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          is_traditional: true
        });
      expect(resPutTrad.status).toBe(200);

      // 5. PUT culinary item with empty body (all undefined, preserving existing)
      const resPutEmpty = await request(app)
        .put(`/api/culinary/items/${culId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(resPutEmpty.status).toBe(200);
    });

    it('covers all optional fallbacks and branches in POST/PUT /api/transport', async () => {
      // 1. POST transport with allowed mode and all fields
      const resFull = await request(app)
        .post('/api/transport')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Shuttle Bus Kualanamu - Parapat',
          transport_type: 'land_shuttle',
          route_direction: 'Bandara Kualanamu ke Parapat PP',
          vehicle_type: 'Minibus Toyota HiAce',
          departure_hours: 'Setiap 2 Jam',
          price_display: 'Rp 100.000 / kursi',
          description: 'Transportasi darat nyaman ber-AC',
          operator: 'Paradep Trans',
          contact: '08129876543'
        });
      expect(resFull.status).toBe(201);
      const transId = resFull.body.data.id;

      // 2. POST transport with minimal fields and invalid transport_type fallback to 'ferry'
      const resMin = await request(app)
        .post('/api/transport')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Kapal Ferry Tomok',
          route_direction: 'Ajibata ke Tomok',
          transport_type: 'unknown_mode'
        });
      expect(resMin.status).toBe(201);

      // 3. PUT transport with valid transport_type and all fields defined
      const resPutFull = await request(app)
        .put(`/api/transport/${transId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Shuttle Bus HiAce VIP',
          transport_type: 'traditional_boat',
          route_direction: 'Parapat ke Tomok',
          vehicle_type: 'Kapal Kayu Tradisional',
          departure_hours: 'Setiap 30 Menit',
          price_display: 'Rp 20.000',
          description: 'Pemandangan danau indah',
          operator: 'Koperasi Kapal Tomok',
          contact: '08130000000'
        });
      expect(resPutFull.status).toBe(200);

      // 4. PUT transport with empty body (preserving all existing fields)
      const resPutEmpty = await request(app)
        .put(`/api/transport/${transId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(resPutEmpty.status).toBe(200);
    });

    it('covers all optional fallbacks and branches in POST/PUT /api/destinations', async () => {
      // 1. POST destination with minimal body (fallbacks taken for lat, lng, price, contact, etc.)
      const resMin = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pantai Pasir Putih Parbaba Minimal',
          category_id: 1,
          regency_id: 1
        });
      expect(resMin.status).toBe(201);
      const destId = resMin.body.id;

      // 2. POST destination with all numeric and string fields provided
      const resFull = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Air Terjun Sipiso Piso Eksklusif',
          category_id: 1,
          regency_id: 1,
          description: 'Air terjun megah di ujung utara Danau Toba',
          address: 'Tongging, Merek, Kabupaten Karo',
          latitude: 2.915,
          longitude: 98.528,
          price_min: 10000,
          price_max: 25000,
          price_display: 'Rp 10.000 / orang',
          operational_hours: '08.00 - 17.00 WIB',
          contact_phone: '08123456789',
          contact_wa: '08123456789',
          is_community_managed: true,
          image_url: 'https://example.com/sipiso.jpg'
        });
      expect(resFull.status).toBe(201);

      // 3. PUT destination with all numeric and string fields provided
      const resPutFull = await request(app)
        .put(`/api/destinations/${destId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pantai Pasir Putih Parbaba Updated',
          category_id: 2,
          regency_id: 2,
          description: 'Pemandangan pasir putih danau',
          address: 'Jl. Danau No. 1',
          latitude: 2.6,
          longitude: 98.7,
          price_min: 5000,
          price_max: 15000,
          price_display: 'Rp 5.000',
          operational_hours: '07.00 - 19.00 WIB',
          contact_phone: '0812999999',
          contact_wa: '0812999999',
          is_community_managed: true,
          status: 'verified',
          image_url: 'https://example.com/parbaba.jpg'
        });
      expect(resPutFull.status).toBe(200);

      // 4. PUT destination with empty body (name, category_id, regency_id falsy; lat, lng, price undefined)
      const resPutMin = await request(app)
        .put(`/api/destinations/${destId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(resPutMin.status).toBe(200);
    });

    it('covers all optional fallbacks and branches in POST/PUT /api/services', async () => {
      // 1. POST service with minimal body (fallbacks for service_type, prices, contact, etc.)
      const resMin = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pemandu Lokal Wisata Danau Toba',
          category_id: 1,
          regency_id: 1,
          provider_name: 'Pak Pardede'
        });
      expect(resMin.status).toBe(201);
      const serviceId = resMin.body.id;

      // 2. POST service with all fields provided
      const resFull = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sewa Speedboat Danau Toba',
          category_id: 1,
          regency_id: 1,
          provider_name: 'PT Toba Bahari',
          service_type: 'rental_gear',
          description: 'Keliling pulau Samosir dengan speedboat cepat',
          price_min: 300000,
          price_max: 600000,
          price_unit: 'per jam',
          price_display: 'Rp 300.000 / jam',
          facilities: 'Life vest, captain',
          address: 'Pelabuhan Ajibata',
          latitude: 2.66,
          longitude: 98.93,
          contact_phone: '081377778888',
          contact_wa: '081377778888',
          is_community_managed: true
        });
      expect(resFull.status).toBe(201);

      // 3. PUT service with all fields provided
      const resPutFull = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pemandu Lokal Wisata Danau Toba VIP',
          category_id: 2,
          regency_id: 2,
          provider_name: 'Pak Pardede S.Pd',
          service_type: 'tour_guide',
          description: 'Pemandu ramah berlisensi resmi',
          price_min: 250000,
          price_max: 400000,
          price_unit: 'per hari',
          price_display: 'Rp 250.000 / hari',
          facilities: 'Fotografi, transportasi',
          address: 'Balige',
          latitude: 2.33,
          longitude: 99.06,
          contact_phone: '081233334444',
          contact_wa: '081233334444',
          is_community_managed: true,
          status: 'verified'
        });
      expect(resPutFull.status).toBe(200);

      // 4. PUT service with empty body (name, category_id, regency_id, provider_name falsy; prices and coordinates undefined)
      const resPutMin = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(resPutMin.status).toBe(200);
    });
  });
});
