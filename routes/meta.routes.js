const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/meta/categories
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
        return res.json({ success: true, data: categories });
    } catch (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat kategori.' });
    }
});

// GET /api/meta/regencies
router.get('/regencies', (req, res) => {
    try {
        const regencies = db.prepare(`
            SELECT r.*,
                   (SELECT COUNT(*) FROM destinations WHERE regency_id = r.id) as destination_count,
                   (SELECT COUNT(*) FROM services WHERE regency_id = r.id) as service_count
            FROM regencies r
            ORDER BY r.id ASC
        `).all();
        return res.json({ success: true, data: regencies });
    } catch (err) {
        console.error('Error fetching regencies:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat data kabupaten.' });
    }
});

// GET /api/meta/stats (Dashboard statistics)
router.get('/stats', (req, res) => {
    try {
        const totalDestinations = db.prepare('SELECT COUNT(*) as c FROM destinations').get().c;
        const totalServices = db.prepare('SELECT COUNT(*) as c FROM services').get().c;
        const totalCommunity = db.prepare('SELECT COUNT(*) as c FROM services WHERE is_community_managed = 1').get().c;
        const totalReviews = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
        const totalTransport = db.prepare('SELECT COUNT(*) as c FROM transport_routes').get().c;
        const totalRestaurants = db.prepare('SELECT COUNT(*) as c FROM restaurants').get().c;
        const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

        const topDestinations = db.prepare(`
            SELECT id, name, slug, rating_avg, review_count, price_display
            FROM destinations
            ORDER BY rating_avg DESC, review_count DESC
            LIMIT 5
        `).all();

        const recentReviews = db.prepare(`
            SELECT r.id, r.target_type, r.target_id, r.reviewer_name, r.rating, r.review_text, r.created_at,
                   CASE WHEN r.target_type = 'destination' THEN d.name ELSE s.name END as target_name
            FROM reviews r
            LEFT JOIN destinations d ON r.target_type = 'destination' AND r.target_id = d.id
            LEFT JOIN services s ON r.target_type = 'service' AND r.target_id = s.id
            ORDER BY r.id DESC
            LIMIT 6
        `).all();

        return res.json({
            success: true,
            data: {
                totalDestinations,
                totalServices,
                totalCommunity,
                totalReviews,
                totalTransport,
                totalRestaurants,
                totalUsers,
                topDestinations,
                recentReviews
            }
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat statistik.' });
    }
});

module.exports = router;
