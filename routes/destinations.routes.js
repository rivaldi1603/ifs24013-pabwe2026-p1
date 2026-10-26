const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    generateUniqueSlug,
    getPagination,
    applyCommonCatalogFilters,
    fetchEntityReviews,
    createDeleteHandler
} = require('../utils/helpers');

// GET /api/destinations
router.get('/', (req, res) => {
    try {
        const { search, sort } = req.query;
        let query = `
            SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
            FROM destinations d
            JOIN categories c ON d.category_id = c.id
            JOIN regencies r ON d.regency_id = r.id
            WHERE 1=1
        `;

        const { conditions, params } = applyCommonCatalogFilters(req.query, 'd');
        query += conditions;

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
        const { page: parsedPage, limit: parsedLimit, offset } = getPagination(req.query, 20);

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
        const isNumeric = !Number.isNaN(Number(idOrSlug));
        const condition = isNumeric ? 'd.id = ?' : 'd.slug = ?';
        const paramVal = isNumeric ? Number(idOrSlug) : idOrSlug;

        const dest = db.prepare(`
            SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
            FROM destinations d
            JOIN categories c ON d.category_id = c.id
            JOIN regencies r ON d.regency_id = r.id
            WHERE ${condition}
        `).get(paramVal);

        if (!dest) {
            return res.status(404).json({ success: false, message: 'Destinasi wisata tidak ditemukan.' });
        }

        const reviews = fetchEntityReviews(db, 'destination', dest.id);

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

        const slug = generateUniqueSlug(db, 'destinations', name);

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

        let communityVal = null;
        if (is_community_managed !== undefined) {
            communityVal = is_community_managed ? 1 : 0;
        }

        stmt.run(
            name ? name.trim() : null,
            category_id ? Number(category_id) : null,
            regency_id ? Number(regency_id) : null,
            description, address,
            latitude === undefined ? null : Number(latitude),
            longitude === undefined ? null : Number(longitude),
            price_min === undefined ? null : Number(price_min),
            price_max === undefined ? null : Number(price_max),
            price_display, operational_hours, contact_phone, contact_wa,
            communityVal,
            status, image_url, id
        );

        return res.json({ success: true, message: 'Data destinasi berhasil diperbarui.' });
    } catch (err) {
        console.error('Error updating destination:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui destinasi.' });
    }
});

// DELETE /api/destinations/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), createDeleteHandler(db, 'destinations', 'Destinasi wisata', 'destination'));

module.exports = router;
