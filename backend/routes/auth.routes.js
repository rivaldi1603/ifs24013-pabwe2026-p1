const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, verifyToken, requireRole } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        // Verify password: check SHA256 (seed default) or bcrypt
        const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
        let isValid = (user.password === sha256Hash);
        if (!isValid && user.password.startsWith('$2')) {
            isValid = bcrypt.compareSync(password, user.password);
        }

        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            message: 'Login berhasil.',
            token,
            user: payload
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { name, email, password, phone, organization, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
        }

        // Default role is user, allow partner if organization is provided
        const userRole = (role === 'partner' && organization) ? 'partner' : 'user';
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const stmt = db.prepare(`
            INSERT INTO users (name, email, password, role, phone, organization)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(name.trim(), email.trim().toLowerCase(), hashedPassword, userRole, phone || null, organization || null);
        const newUserId = result.lastInsertRowid;

        const payload = {
            id: newUserId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: userRole,
            organization: organization || null
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil.',
            token,
            user: payload
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, phone, organization, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// GET /api/auth/users (admin only)
router.get('/users', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const users = db.prepare('SELECT id, name, email, role, phone, organization, created_at FROM users ORDER BY id DESC').all();
        return res.json({ success: true, data: users });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
