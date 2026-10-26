const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { slugify, createDeleteHandler } = require('../utils/helpers');

// GET /api/articles
router.get('/', (req, res) => {
    try {
        const query = `
            SELECT a.*, r.name as regency_name, r.short_name as regency_short
            FROM articles a
            LEFT JOIN regencies r ON a.regency_id = r.id
            ORDER BY a.id DESC
        `;
        const data = db.prepare(query).all();
        return res.json({ success: true, total: data.length, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Gagal memuat artikel.' });
    }
});

// POST /api/articles (Admin only)
router.post('/', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { title, slug, regency_id, summary, source_url, published_at } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Judul artikel wajib diisi.' });
        }

        const articleSlug = slug && slug.trim() ? slugify(slug.trim()) : `${slugify(title)}-${Date.now().toString().slice(-4)}`;
        const regencyId = regency_id ? Number(regency_id) : null;
        const pubDate = published_at || new Date().toISOString().split('T')[0];

        const stmt = db.prepare(`
            INSERT INTO articles (title, slug, regency_id, summary, source_url, published_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(title.trim(), articleSlug, regencyId, summary || '', source_url || '', pubDate);

        return res.status(201).json({
            success: true,
            message: 'Cerita / artikel berhasil ditambahkan.',
            data: { id: result.lastInsertRowid, title, slug: articleSlug }
        });
    } catch (err) {
        console.error('Create article error:', err);
        return res.status(500).json({ success: false, message: 'Gagal menambahkan artikel.', error: err.message });
    }
});

// PUT /api/articles/:id (Admin only)
router.put('/:id', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const { title, regency_id, summary, source_url, published_at } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Judul artikel wajib diisi.' });
        }

        const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
        }

        const regencyId = regency_id ? Number(regency_id) : null;

        db.prepare(`
            UPDATE articles
            SET title = ?, regency_id = ?, summary = ?, source_url = ?, published_at = ?
            WHERE id = ?
        `).run(
            title.trim(),
            regencyId,
            summary !== undefined ? summary : existing.summary,
            source_url !== undefined ? source_url : existing.source_url,
            published_at || existing.published_at,
            id
        );

        return res.json({ success: true, message: 'Artikel berhasil diperbarui.' });
    } catch (err) {
        console.error('Update article error:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui artikel.' });
    }
});

// DELETE /api/articles/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), createDeleteHandler(db, 'articles', 'Artikel'));

module.exports = router;
