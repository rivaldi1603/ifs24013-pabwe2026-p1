const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { slugify, generateUniqueSlug, createDeleteHandler, sendListQuery, sendPaginatedQuery } = require('../utils/helpers');

// GET /api/culinary (Traditional Batak culinary items)
router.get('/', (req, res) => {
    try {
        const isHalal = req.query.halal === '1' || req.query.halal === 'true';
        const sql = isHalal
            ? 'SELECT * FROM culinary_items WHERE halal_status = "Halal" ORDER BY id DESC'
            : 'SELECT * FROM culinary_items ORDER BY id DESC';
        return sendListQuery(res, db, sql);
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

        const culinarySlug = slug?.trim() ? slugify(slug.trim()) : generateUniqueSlug(db, 'culinary_items', name);

        let traditionalFlag = 1;
        if (is_traditional !== undefined) {
            traditionalFlag = is_traditional ? 1 : 0;
        }

        const insertRecord = [
            name.trim(),
            culinarySlug,
            description || '',
            halal_status || 'Halal',
            origin_region || 'Kawasan Danau Toba',
            traditionalFlag,
            image_url || ''
        ];

        const stmt = db.prepare(`
            INSERT INTO culinary_items (name, slug, description, halal_status, origin_region, is_traditional, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(...insertRecord);

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
        const item = db.prepare('SELECT * FROM culinary_items WHERE id = ?').get(id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Menu kuliner tidak ditemukan.' });
        }

        const b = req.body;
        const traditional = b.is_traditional !== undefined
            ? (b.is_traditional ? 1 : 0)
            : item.is_traditional;

        db.prepare(`
            UPDATE culinary_items
            SET name = ?, description = ?, halal_status = ?, origin_region = ?, is_traditional = ?, image_url = ?
            WHERE id = ?
        `).run(
            b.name === undefined ? item.name : b.name.trim(),
            b.description === undefined ? item.description : b.description,
            b.halal_status === undefined ? item.halal_status : b.halal_status,
            b.origin_region === undefined ? item.origin_region : b.origin_region,
            traditional,
            b.image_url === undefined ? item.image_url : b.image_url,
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
        const { regency, halal, search } = req.query;
        let whereFilter = '';
        const params = [];

        if (regency) {
            whereFilter += ' AND res.regency_id = ?';
            params.push(Number(regency));
        }

        if (halal === '1' || halal === 'true') {
            whereFilter += ' AND res.is_halal_certified = 1';
        }

        if (search) {
            whereFilter += ' AND (res.name LIKE ? OR res.recommended_menu LIKE ? OR res.address LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        const countQuery = `
            SELECT COUNT(*) as total
            FROM restaurants res
            JOIN regencies r ON res.regency_id = r.id
            WHERE 1=1 ${whereFilter}
        `;
        const dataQuery = `
            SELECT res.*, r.name as regency_name, r.short_name as regency_short
            FROM restaurants res
            JOIN regencies r ON res.regency_id = r.id
            WHERE 1=1 ${whereFilter}
            ORDER BY res.rating_avg DESC, res.id ASC
        `;

        return sendPaginatedQuery(res, db, countQuery, dataQuery, params, req.query, 20);
    } catch (err) {
        console.error('Error fetching restaurants:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat daftar tempat makan.' });
    }
});

module.exports = router;

