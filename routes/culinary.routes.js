const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { slugify, getPagination, createDeleteHandler } = require('../utils/helpers');

// GET /api/culinary (Traditional Batak culinary items)
router.get('/', (req, res) => {
    try {
        const { halal } = req.query;
        let query = 'SELECT * FROM culinary_items WHERE 1=1';
        const params = [];

        if (halal === '1' || halal === 'true') {
            query += ' AND halal_status = "Halal"';
        }

        query += ' ORDER BY id DESC';
        const data = db.prepare(query).all(...params);

        return res.json({
            success: true,
            total: data.length,
            data
        });
    } catch (err) {
        console.error('Error fetching culinary items:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat kuliner khas Batak.' });
    }
});

// POST /api/culinary/items (Admin only: add culinary item)
router.post('/items', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { name, slug, description, halal_status, origin_region, is_traditional, image_url } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: 'Nama makanan/kuliner wajib diisi.' });
        }

        const culinarySlug = slug?.trim() ? slugify(slug.trim()) : `${slugify(name)}-${Date.now().toString().slice(-4)}`;

        let traditionalFlag = 1;
        if (is_traditional !== undefined) {
            traditionalFlag = is_traditional ? 1 : 0;
        }

        const stmt = db.prepare(`
            INSERT INTO culinary_items (name, slug, description, halal_status, origin_region, is_traditional, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            name.trim(),
            culinarySlug,
            description || '',
            halal_status || 'Halal',
            origin_region || 'Kawasan Danau Toba',
            traditionalFlag,
            image_url || ''
        );

        return res.status(201).json({
            success: true,
            message: 'Menu kuliner khas berhasil ditambahkan.',
            data: { id: result.lastInsertRowid, name }
        });
    } catch (err) {
        console.error('Create culinary error:', err);
        return res.status(500).json({ success: false, message: 'Gagal menambahkan menu kuliner.' });
    }
});

// PUT /api/culinary/items/:id (Admin only)
router.put('/items/:id', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, halal_status, origin_region, is_traditional, image_url } = req.body;

        const existing = db.prepare('SELECT * FROM culinary_items WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Menu kuliner tidak ditemukan.' });
        }

        let updatedTraditional = existing.is_traditional;
        if (is_traditional !== undefined) {
            updatedTraditional = is_traditional ? 1 : 0;
        }

        db.prepare(`
            UPDATE culinary_items
            SET name = ?, description = ?, halal_status = ?, origin_region = ?, is_traditional = ?, image_url = ?
            WHERE id = ?
        `).run(
            name === undefined ? existing.name : name.trim(),
            description === undefined ? existing.description : description,
            halal_status === undefined ? existing.halal_status : halal_status,
            origin_region === undefined ? existing.origin_region : origin_region,
            updatedTraditional,
            image_url === undefined ? existing.image_url : image_url,
            id
        );

        return res.json({ success: true, message: 'Menu kuliner berhasil diperbarui.' });
    } catch (err) {
        console.error('Update culinary error:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui menu kuliner.' });
    }
});

// DELETE /api/culinary/items/:id (Admin only)
router.delete('/items/:id', verifyToken, requireRole('admin'), createDeleteHandler(db, 'culinary_items', 'Menu kuliner'));

// GET /api/culinary/restaurants (Eateries & restaurants around Lake Toba)
router.get('/restaurants', (req, res) => {
    try {
        const { regency, halal, search, limit = 20, page = 1 } = req.query;
        let query = `
            SELECT res.*, r.name as regency_name, r.short_name as regency_short
            FROM restaurants res
            JOIN regencies r ON res.regency_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (regency) {
            query += ' AND res.regency_id = ?';
            params.push(Number(regency));
        }

        if (halal === '1' || halal === 'true') {
            query += ' AND res.is_halal_certified = 1';
        }

        if (search) {
            query += ' AND (res.name LIKE ? OR res.recommended_menu LIKE ? OR res.address LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        query += ' ORDER BY res.rating_avg DESC, res.id ASC';

        const countQuery = query.replace('SELECT res.*, r.name as regency_name, r.short_name as regency_short', 'SELECT COUNT(*) as total');
        const total = db.prepare(countQuery).get(...params).total;

        const { page: parsedPage, limit: parsedLimit, offset } = getPagination(req.query, 20);

        query += ' LIMIT ? OFFSET ?';
        params.push(parsedLimit, offset);

        const data = db.prepare(query).all(...params);

        return res.json({
            success: true,
            total,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(total / parsedLimit),
            data
        });
    } catch (err) {
        console.error('Error fetching restaurants:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat daftar tempat makan.' });
    }
});

module.exports = router;
