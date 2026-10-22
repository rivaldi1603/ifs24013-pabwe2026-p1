const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/culinary (Traditional Batak culinary items)
router.get('/', (req, res) => {
    try {
        const { halal } = req.query;
        let query = 'SELECT * FROM culinary_items WHERE 1=1';
        const params = [];

        if (halal === '1' || halal === 'true') {
            query += ' AND halal_status = "Halal"';
        }

        query += ' ORDER BY id ASC';
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

        const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const parsedPage = Math.max(Number(page) || 1, 1);
        const offset = (parsedPage - 1) * parsedLimit;

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
