const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/transport
router.get('/', (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM transport_routes WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND transport_type = ?';
            params.push(type);
        }

        query += ' ORDER BY transport_type ASC, id ASC';
        const data = db.prepare(query).all(...params);

        return res.json({
            success: true,
            total: data.length,
            data
        });
    } catch (err) {
        console.error('Error fetching transport:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat jadwal transportasi.' });
    }
});

module.exports = router;
