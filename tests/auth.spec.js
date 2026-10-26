import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import db from '../db.js';
import { JWT_SECRET, optionalAuth, requireRole } from '../middleware/auth.js';

describe('Authentication and Authorization Detailed Tests', () => {
  const testEmail = `auth_tester_${Date.now()}@example.com`;
  const testPass = 'securePassword123';
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    await db.ready;

    // Register test user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Tester Unit',
        email: testEmail,
        password: testPass,
        phone: '081234567890'
      });
    userToken = regRes.body.token;

    // Use deterministic admin token signed with JWT_SECRET for seeded admin (id: 1)
    adminToken = jwt.sign(
      { id: 1, name: 'Admin JelajahToba', email: 'admin@jelajahtoba.id', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
  });

  it('POST /api/auth/login successfully logs in user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPass });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  it('POST /api/auth/register registers a new unique user', async () => {
    const uniqueEmail = `new_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Registered User',
        email: uniqueEmail,
        password: 'password123',
        phone: '081122334455'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('user');
  });

  it('POST /api/auth/register fails with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Tester',
        email: testEmail,
        password: 'password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register fails with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bad Email',
        email: 'invalid-email-no-at',
        password: 'password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register fails with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Pass',
        email: `short_${Date.now()}@example.com`,
        password: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register fails when missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me returns current user info when token is provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
  });

  it('GET /api/auth/me returns 401 without authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me returns 403 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-xyz');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/auth/profile updates profile data for authenticated user', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Tester Updated',
        phone: '089988776655',
        bio: 'Saya pecinta Danau Toba'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Tester Updated');
  });

  it('PUT /api/auth/profile fails when name is empty', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/users allows admin to fetch user list', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/auth/users returns 403 when accessed by regular user', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('auth middleware handles expired tokens properly', async () => {
    const expiredToken = jwt.sign({ id: 1, role: 'user' }, JWT_SECRET, { expiresIn: -10 });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('kedaluwarsa');
  });

  describe('Auth Middleware Unit Tests', () => {
    it('optionalAuth handles missing, valid, and invalid header', () => {
      let nextCalled = false;
      const req1 = { headers: {} };
      optionalAuth(req1, {}, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
      expect(req1.user).toBeUndefined();

      const validToken = jwt.sign({ id: 10, role: 'user' }, JWT_SECRET);
      const req2 = { headers: { authorization: `Bearer ${validToken}` } };
      optionalAuth(req2, {}, () => {});
      expect(req2.user).toBeDefined();
      expect(req2.user.id).toBe(10);

      const req3 = { headers: { authorization: 'Bearer invalid-token' } };
      optionalAuth(req3, {}, () => {});
      expect(req3.user).toBeUndefined();
    });

    it('requireRole rejects when user is not attached or has wrong role', () => {
      const adminOnly = requireRole('admin');
      let status = 0;
      let jsonBody = null;
      const res = {
        status: (code) => {
          status = code;
          return { json: (data) => { jsonBody = data; } };
        }
      };

      adminOnly({ user: null }, res, () => {});
      expect(status).toBe(401);
      expect(jsonBody.success).toBe(false);

      adminOnly({ user: { role: 'user' } }, res, () => {});
      expect(status).toBe(403);
      expect(jsonBody.success).toBe(false);

      let allowed = false;
      adminOnly({ user: { role: 'admin' } }, res, () => { allowed = true; });
      expect(allowed).toBe(true);
    });
  });
});
