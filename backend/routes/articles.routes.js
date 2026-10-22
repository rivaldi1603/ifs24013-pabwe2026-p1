const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/articles
router.get('/', (req, res) => {
    try {
        const query = `
            SELECT a.*, r.name as regency_name, r.short_name as regency_short
            FROM articles a
            LEFT JOIN regencies r ON a.regency_id = r.id
            ORDER BY a.id ASC
        `;
        const data = db.prepare(query).all();
        return res.json({ success: true, total: data.length, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Gagal memuat artikel.' });
    }
});

module.exports = router;
