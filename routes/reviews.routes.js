const express = require('express');
const router = express.Router();
const db = require('../db');
const { optionalAuth, verifyToken, requireRole } = require('../middleware/auth');

// GET /api/reviews
router.get('/', (req, res) => {
    try {
        const { target_type, target_id, user_id, limit = 50 } = req.query;

        if (target_type && target_id) {
            const data = db.prepare(`
                SELECT id, target_type, target_id, reviewer_name, user_id, rating, review_text, created_at
                FROM reviews
                WHERE target_type = ? AND target_id = ?
                ORDER BY id DESC
                LIMIT ?
            `).all(target_type, Number(target_id), Number(limit));

            return res.json({ success: true, total: data.length, data });
        }

        if (user_id) {
            const data = db.prepare(`
                SELECT r.id, r.target_type, r.target_id, r.reviewer_name, r.user_id, r.rating, r.review_text, r.created_at,
                       CASE WHEN r.target_type = 'destination' THEN d.name ELSE s.name END as target_name,
                       CASE WHEN r.target_type = 'destination' THEN d.slug ELSE s.slug END as target_slug
                FROM reviews r
                LEFT JOIN destinations d ON r.target_type = 'destination' AND r.target_id = d.id
                LEFT JOIN services s ON r.target_type = 'service' AND r.target_id = s.id
                WHERE r.user_id = ?
                ORDER BY r.id DESC
                LIMIT ?
            `).all(Number(user_id), Number(limit));

            return res.json({ success: true, total: data.length, data });
        }

        // All reviews (e.g. for Admin Dashboard)
        const data = db.prepare(`
            SELECT r.id, r.target_type, r.target_id, r.reviewer_name, r.user_id, r.rating, r.review_text, r.created_at,
                   CASE WHEN r.target_type = 'destination' THEN d.name ELSE s.name END as target_name,
                   CASE WHEN r.target_type = 'destination' THEN d.slug ELSE s.slug END as target_slug
            FROM reviews r
            LEFT JOIN destinations d ON r.target_type = 'destination' AND r.target_id = d.id
            LEFT JOIN services s ON r.target_type = 'service' AND r.target_id = s.id
            ORDER BY r.id DESC
            LIMIT ?
        `).all(Number(limit));

        return res.json({ success: true, total: data.length, data });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat ulasan.' });
    }
});

// POST /api/reviews (Submit new review - login required)
router.post('/', verifyToken, (req, res) => {
    try {
        const { target_type, target_id, rating, review_text } = req.body;

        if (!target_type || !target_id || rating === undefined || !review_text) {
            return res.status(400).json({ success: false, message: 'Jenis target, ID target, rating, dan ulasan wajib diisi.' });
        }

        if (!['destination', 'service'].includes(target_type)) {
            return res.status(400).json({ success: false, message: 'target_type harus bernilai destination atau service.' });
        }

        const parsedRating = Number.parseFloat(rating);
        if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating harus berupa angka antara 1.0 sampai 5.0.' });
        }

        const name = req.user.name;
        const userId = req.user.id;

        const insertStmt = db.prepare(`
            INSERT INTO reviews (target_type, target_id, reviewer_name, user_id, rating, review_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `);

        // Transaction to insert review and recalculate target rating_avg and review_count
        const submitTx = db.transaction(() => {
            const result = insertStmt.run(target_type, Number(target_id), name, userId, parsedRating, review_text.trim());

            // Recalculate stats
            const stats = db.prepare(`
                SELECT COUNT(*) as count, AVG(rating) as avg_rating
                FROM reviews
                WHERE target_type = ? AND target_id = ?
            `).get(target_type, Number(target_id));

            const avg = Math.round(stats.avg_rating * 10) / 10;
            const cnt = stats.count || 1;

            if (target_type === 'destination') {
                db.prepare(`UPDATE destinations SET rating_avg = ?, review_count = ? WHERE id = ?`).run(avg, cnt, Number(target_id));
            } else {
                db.prepare(`UPDATE services SET rating_avg = ?, review_count = ? WHERE id = ?`).run(avg, cnt, Number(target_id));
            }

            return { id: result.lastInsertRowid, avg, cnt };
        });

        const txResult = submitTx();

        return res.status(201).json({
            success: true,
            message: 'Ulasan Anda berhasil dikirimkan. Terima kasih!',
            data: {
                id: txResult.id,
                rating_avg: txResult.avg,
                review_count: txResult.cnt
            }
        });
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).json({ success: false, message: 'Gagal mengirimkan ulasan.' });
    }
});

// DELETE /api/reviews/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Ulasan tidak ditemukan.' });
        }

        const deleteTx = db.transaction(() => {
            db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);

            // Recalculate stats
            const stats = db.prepare(`
                SELECT COUNT(*) as count, AVG(rating) as avg_rating
                FROM reviews
                WHERE target_type = ? AND target_id = ?
            `).get(review.target_type, review.target_id);

            const cnt = stats.count || 0;
            const avg = cnt > 0 ? Math.round(stats.avg_rating * 10) / 10 : 0;

            if (review.target_type === 'destination') {
                db.prepare(`UPDATE destinations SET rating_avg = ?, review_count = ? WHERE id = ?`).run(avg, cnt, review.target_id);
            } else {
                db.prepare(`UPDATE services SET rating_avg = ?, review_count = ? WHERE id = ?`).run(avg, cnt, review.target_id);
            }
        });

        deleteTx();

        return res.json({ success: true, message: 'Ulasan berhasil dihapus oleh Administrator.' });
    } catch (err) {
        console.error('Error deleting review:', err);
        return res.status(500).json({ success: false, message: 'Gagal menghapus ulasan.' });
    }
});

module.exports = router;
