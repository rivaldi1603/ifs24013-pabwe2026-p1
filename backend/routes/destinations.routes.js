const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// GET /api/destinations
router.get('/', (req, res) => {
    try {
        const { category, regency, search, community_only, sort, limit = 20, page = 1 } = req.query;
        let query = `
            SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
            FROM destinations d
            JOIN categories c ON d.category_id = c.id
            JOIN regencies r ON d.regency_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            if (isNaN(category)) {
                query += ` AND c.slug = ?`;
                params.push(category);
            } else {
                query += ` AND d.category_id = ?`;
                params.push(Number(category));
            }
        }

        if (regency) {
            query += ` AND d.regency_id = ?`;
            params.push(Number(regency));
        }

        if (community_only === '1' || community_only === 'true') {
            query += ` AND d.is_community_managed = 1`;
        }

        if (search) {
            query += ` AND (d.name LIKE ? OR d.description LIKE ? OR d.address LIKE ?)`;
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        // Sorting
        if (sort === 'rating') {
            query += ` ORDER BY d.rating_avg DESC, d.review_count DESC`;
        } else if (sort === 'price_low') {
            query += ` ORDER BY d.price_min ASC`;
        } else if (sort === 'price_high') {
            query += ` ORDER BY d.price_max DESC`;
        } else if (sort === 'reviews') {
            query += ` ORDER BY d.review_count DESC`;
        } else {
            query += ` ORDER BY d.id ASC`;
        }

        // Count total before pagination
        const countQuery = query.replace('SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short', 'SELECT COUNT(*) as total');
        const total = db.prepare(countQuery).get(...params).total;

        // Pagination
        const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const parsedPage = Math.max(Number(page) || 1, 1);
        const offset = (parsedPage - 1) * parsedLimit;

        query += ` LIMIT ? OFFSET ?`;
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
        console.error('Error fetching destinations:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat data destinasi wisata.' });
    }
});

// GET /api/destinations/featured
router.get('/featured', (req, res) => {
    try {
        const query = `
            SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
            FROM destinations d
            JOIN categories c ON d.category_id = c.id
            JOIN regencies r ON d.regency_id = r.id
            WHERE d.rating_avg >= 4.5
            ORDER BY d.review_count DESC, d.rating_avg DESC
            LIMIT 6
        `;
        const data = db.prepare(query).all();
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Gagal memuat destinasi unggulan.' });
    }
});

// GET /api/destinations/:idOrSlug
router.get('/:idOrSlug', (req, res) => {
    try {
        const { idOrSlug } = req.params;
        let dest;
        if (!isNaN(idOrSlug)) {
            dest = db.prepare(`
                SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
                FROM destinations d
                JOIN categories c ON d.category_id = c.id
                JOIN regencies r ON d.regency_id = r.id
                WHERE d.id = ?
            `).get(Number(idOrSlug));
        } else {
            dest = db.prepare(`
                SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
                FROM destinations d
                JOIN categories c ON d.category_id = c.id
                JOIN regencies r ON d.regency_id = r.id
                WHERE d.slug = ?
            `).get(idOrSlug);
        }

        if (!dest) {
            return res.status(404).json({ success: false, message: 'Destinasi wisata tidak ditemukan.' });
        }

        // Fetch authentic reviews
        const reviews = db.prepare(`
            SELECT id, reviewer_name, rating, review_text, created_at
            FROM reviews
            WHERE target_type = 'destination' AND target_id = ?
            ORDER BY id DESC
        `).all(dest.id);

        // Fetch related destinations in same regency or category
        const related = db.prepare(`
            SELECT d.id, d.name, d.slug, d.image_url, d.price_display, d.rating_avg, c.name as category_name, r.name as regency_name
            FROM destinations d
            JOIN categories c ON d.category_id = c.id
            JOIN regencies r ON d.regency_id = r.id
            WHERE (d.regency_id = ? OR d.category_id = ?) AND d.id != ?
            ORDER BY d.rating_avg DESC
            LIMIT 4
        `).all(dest.regency_id, dest.category_id, dest.id);

        return res.json({
            success: true,
            data: {
                ...dest,
                reviews,
                related
            }
        });
    } catch (err) {
        console.error('Error fetching destination detail:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat detail destinasi.' });
    }
});

// POST /api/destinations (Admin / Partner)
router.post('/', verifyToken, requireRole(['admin', 'partner']), (req, res) => {
    try {
        const {
            name, category_id, regency_id, description, address,
            latitude, longitude, price_min, price_max, price_display,
            operational_hours, contact_phone, contact_wa, is_community_managed, image_url
        } = req.body;

        if (!name || !category_id || !regency_id) {
            return res.status(400).json({ success: false, message: 'Nama, kategori, dan kabupaten wajib diisi.' });
        }

        let slug = slugify(name);
        const existingSlug = db.prepare('SELECT id FROM destinations WHERE slug = ?').get(slug);
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }

        const stmt = db.prepare(`
            INSERT INTO destinations (
                name, slug, category_id, regency_id, description, address,
                latitude, longitude, price_min, price_max, price_display,
                operational_hours, contact_phone, contact_wa, is_community_managed, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            name.trim(), slug, Number(category_id), Number(regency_id),
            description || '', address || '',
            latitude ? Number(latitude) : null,
            longitude ? Number(longitude) : null,
            price_min ? Number(price_min) : 0,
            price_max ? Number(price_max) : 0,
            price_display || 'Gratis',
            operational_hours || '08.00 - 18.00 WIB',
            contact_phone || null,
            contact_wa || null,
            is_community_managed ? 1 : 0,
            image_url || 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80'
        );

        return res.status(201).json({
            success: true,
            message: 'Destinasi wisata berhasil ditambahkan.',
            id: result.lastInsertRowid,
            slug
        });
    } catch (err) {
        console.error('Error creating destination:', err);
        return res.status(500).json({ success: false, message: 'Gagal menambahkan destinasi.' });
    }
});

// PUT /api/destinations/:id (Admin / Partner)
router.put('/:id', verifyToken, requireRole(['admin', 'partner']), (req, res) => {
    try {
        const { id } = req.params;
        const existing = db.prepare('SELECT * FROM destinations WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Destinasi tidak ditemukan.' });
        }

        const {
            name, category_id, regency_id, description, address,
            latitude, longitude, price_min, price_max, price_display,
            operational_hours, contact_phone, contact_wa, is_community_managed, status, image_url
        } = req.body;

        const stmt = db.prepare(`
            UPDATE destinations SET
                name = COALESCE(?, name),
                category_id = COALESCE(?, category_id),
                regency_id = COALESCE(?, regency_id),
                description = COALESCE(?, description),
                address = COALESCE(?, address),
                latitude = COALESCE(?, latitude),
                longitude = COALESCE(?, longitude),
                price_min = COALESCE(?, price_min),
                price_max = COALESCE(?, price_max),
                price_display = COALESCE(?, price_display),
                operational_hours = COALESCE(?, operational_hours),
                contact_phone = COALESCE(?, contact_phone),
                contact_wa = COALESCE(?, contact_wa),
                is_community_managed = COALESCE(?, is_community_managed),
                status = COALESCE(?, status),
                image_url = COALESCE(?, image_url)
            WHERE id = ?
        `);

        stmt.run(
            name ? name.trim() : null,
            category_id ? Number(category_id) : null,
            regency_id ? Number(regency_id) : null,
            description, address,
            latitude !== undefined ? Number(latitude) : null,
            longitude !== undefined ? Number(longitude) : null,
            price_min !== undefined ? Number(price_min) : null,
            price_max !== undefined ? Number(price_max) : null,
            price_display, operational_hours, contact_phone, contact_wa,
            is_community_managed !== undefined ? (is_community_managed ? 1 : 0) : null,
            status, image_url, id
        );

        return res.json({ success: true, message: 'Data destinasi berhasil diperbarui.' });
    } catch (err) {
        console.error('Error updating destination:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui destinasi.' });
    }
});

// DELETE /api/destinations/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const existing = db.prepare('SELECT id FROM destinations WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Destinasi tidak ditemukan.' });
        }

        // Delete associated reviews first
        db.prepare(`DELETE FROM reviews WHERE target_type = 'destination' AND target_id = ?`).run(id);
        db.prepare('DELETE FROM destinations WHERE id = ?').run(id);

        return res.json({ success: true, message: 'Destinasi wisata berhasil dihapus.' });
    } catch (err) {
        console.error('Error deleting destination:', err);
        return res.status(500).json({ success: false, message: 'Gagal menghapus destinasi.' });
    }
});

module.exports = router;
