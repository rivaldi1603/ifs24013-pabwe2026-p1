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
        const rawIdentifier = req.body.email || req.body.username || '';
        const password = req.body.password || '';
        if (!rawIdentifier || !password) {
            return res.status(400).json({ success: false, message: 'Email/username dan password wajib diisi.' });
        }

        const identifier = rawIdentifier.trim().toLowerCase();
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(identifier);
        
        // Allow login using username 'admin' matching the admin account
        if (!user && (identifier === 'admin' || identifier === 'administrator')) {
            user = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        // Verify password: check SHA256 (seed default) or bcrypt
        const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
        let isValid = false;
        if (user.password.startsWith('$2')) {
            isValid = bcrypt.compareSync(password, user.password);
        } else if (user.password === sha256Hash) {
            isValid = true;
            // Migrate legacy unsalted SHA256 hash to bcrypt
            db.prepare('UPDATE users SET password = ? WHERE id = ?')
                .run(bcrypt.hashSync(password, 10), user.id);
        }

        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            organization: user.organization,
            avatar_url: user.avatar_url,
            bio: user.bio
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
        const { name, email, password, phone, organization } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
        }

        const userRole = 'user';
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const stmt = db.prepare(`
            INSERT INTO users (name, email, password, role, phone, organization, avatar_url, bio)
            VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)
        `);

        const result = stmt.run(name.trim(), email.trim().toLowerCase(), hashedPassword, userRole, phone || null, organization || null);
        const newUserId = result.lastInsertRowid;

        const payload = {
            id: newUserId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: userRole,
            phone: phone || null,
            organization: organization || null,
            avatar_url: null,
            bio: null
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
        const user = db.prepare('SELECT id, name, email, role, phone, organization, avatar_url, bio, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// PUT /api/auth/profile (Update profile: name, phone, bio, avatar_url)
router.put('/profile', verifyToken, (req, res) => {
    try {
        const { name, phone, bio, avatar_url } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
        }

        db.prepare(`
            UPDATE users
            SET name = ?, phone = ?, bio = ?, avatar_url = ?
            WHERE id = ?
        `).run(
            name.trim(),
            phone ? phone.trim() : null,
            bio ? bio.trim() : null,
            avatar_url || null,
            req.user.id
        );

        const updated = db.prepare('SELECT id, name, email, role, phone, organization, avatar_url, bio, created_at FROM users WHERE id = ?').get(req.user.id);

        return res.json({
            success: true,
            message: 'Profil Anda berhasil diperbarui!',
            user: updated
        });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
    }
});

// GET /api/auth/users (admin only)
router.get('/users', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const users = db.prepare('SELECT id, name, email, role, phone, organization, avatar_url, bio, created_at FROM users ORDER BY id DESC').all();
        return res.json({ success: true, data: users });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
