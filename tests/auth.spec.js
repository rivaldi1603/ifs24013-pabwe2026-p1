import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';
const db = require('../db');
const { JWT_SECRET, verifyToken, optionalAuth, requireRole } = require('../middleware/auth');

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

  it('POST /api/auth/register fails when missing required fields or invalid types', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: '   ', email: 'valid_whitespace_check@example.com', password: 'password123' });
    expect(res2.status).toBe(400);
    expect(res2.body.message).toContain('Data registrasi tidak valid');
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

  describe('Auth Middleware & Edge Case Unit Tests', () => {
    it('optionalAuth handles missing, valid, and invalid header with and without Bearer prefix', () => {
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

      // Without Bearer prefix
      const req2b = { headers: { authorization: validToken } };
      optionalAuth(req2b, {}, () => {});
      expect(req2b.user).toBeDefined();
      expect(req2b.user.id).toBe(10);

      const req3 = { headers: { authorization: 'Bearer invalid-token' } };
      optionalAuth(req3, {}, () => {});
      expect(req3.user).toBeUndefined();
    });

    it('verifyToken accepts raw token without Bearer prefix', () => {
      const validToken = jwt.sign({ id: 10, role: 'user' }, JWT_SECRET);
      const req = { headers: { authorization: validToken } };
      let nextCalled = false;
      verifyToken(req, {}, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
      expect(req.user.id).toBe(10);
    });

    it('requireRole handles array of roles and single role', () => {
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

      // Test with array of roles
      const multiRole = requireRole(['editor', 'admin']);
      let multiAllowed = false;
      multiRole({ user: { role: 'admin' } }, res, () => { multiAllowed = true; });
      expect(multiAllowed).toBe(true);
    });

    it('login with admin username and sha256 legacy password migration', async () => {
      // Login with admin username
      const adminLog = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      expect(adminLog.status).toBe(200);
      expect(adminLog.body.success).toBe(true);

      // Legacy SHA256 migration
      const legacyEmail = `legacy_${Date.now()}@example.com`;
      const legacyPass = 'legacyPassword123';
      const sha256Hash = require('node:crypto').createHash('sha256').update(legacyPass).digest('hex');
      db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Legacy User', legacyEmail, sha256Hash, 'user');

      // Empty password check
      const emptyPass = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jelajahtoba.id', password: '' });
      expect(emptyPass.status).toBe(400);

      // Non-existent user check
      const noUser = await request(app)
        .post('/api/auth/login')
        .send({ email: 'completely_unknown_user_999@example.com', password: 'password123' });
      expect(noUser.status).toBe(401);

      // Wrong legacy password check
      const wrongLeg = await request(app)
        .post('/api/auth/login')
        .send({ email: legacyEmail, password: 'wrongPasswordHere' });
      expect(wrongLeg.status).toBe(401);

      // Login with correct password triggers migration to bcrypt
      const legRes = await request(app)
        .post('/api/auth/login')
        .send({ email: legacyEmail, password: legacyPass });
      expect(legRes.status).toBe(200);
      expect(legRes.body.success).toBe(true);

      // Verify the password in DB is now a bcrypt hash ($2...)
      const updatedUser = db.prepare('SELECT password FROM users WHERE email = ?').get(legacyEmail);
      expect(updatedUser.password.startsWith('$2')).toBe(true);
    });

    it('GET /api/auth/me returns 404 when user token has non-existent user ID', async () => {
      const ghostToken = jwt.sign({ id: 99999999, role: 'user' }, JWT_SECRET);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ghostToken}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('handles unexpected database errors in auth routes gracefully', async () => {
      const spy = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });
      const loginErr = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jelajahtoba.com', password: 'password' });
      expect(loginErr.status).toBe(500);
      spy.mockRestore();

      const regSpy = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('Database error on register');
      });
      const regErr = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Error Reg', email: 'err_reg@example.com', password: 'password123' });
      expect(regErr.status).toBe(500);
      regSpy.mockRestore();

      const meSpy = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('Database error on me');
      });
      const meErr = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(meErr.status).toBe(500);
      meSpy.mockRestore();

      const profSpy = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('Database error on profile');
      });
      const profErr = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin New Name' });
      expect(profErr.status).toBe(500);
      profSpy.mockRestore();

      const usersSpy = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
        throw new Error('Database error on users');
      });
      const usersErr = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(usersErr.status).toBe(500);
      usersSpy.mockRestore();
    });
  });
});
