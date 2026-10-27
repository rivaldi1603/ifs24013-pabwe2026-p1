const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    generateUniqueSlug,
    applyCommonCatalogFilters,
    createDeleteHandler,
    sendPaginatedQuery,
    normalizeCommunityFlag,
    createEntityDetailHandler,
    createUpdateHandler
} = require('../utils/helpers');



// GET /api/destinations
router.get('/', (req, res) => {
    try {
        const { search, sort } = req.query;
        const { conditions, params } = applyCommonCatalogFilters(req.query, 'd');
        let whereSql = conditions;

        if (search) {
            whereSql += ` AND (d.name LIKE ? OR d.description LIKE ? OR d.address LIKE ?)`;
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        const SORT_OPTIONS = {
            rating: 'd.rating_avg DESC, d.review_count DESC',
            price_low: 'd.price_min ASC',
            price_high: 'd.price_max DESC',
            reviews: 'd.review_count DESC'
        };
        const orderClause = ` ORDER BY ${SORT_OPTIONS[sort] || 'd.id ASC'}`;


        const countQuery = `
            SELECT COUNT(*) as total
            FROM destinations d
            JOIN categories c ON d.category_id = c.id
            JOIN regencies r ON d.regency_id = r.id
            WHERE 1=1 ${whereSql}
        `;

        const dataQuery = `
            SELECT d.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
            FROM destinations d
            JOIN categories c ON d.category_id = c.id
            JOIN regencies r ON d.regency_id = r.id
            WHERE 1=1 ${whereSql}
            ${orderClause}
        `;

        return sendPaginatedQuery(res, db, countQuery, dataQuery, params, req.query, 20);
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
        console.error('GET /destinations/featured error:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat destinasi unggulan.' });
    }
});

// GET /api/destinations/:idOrSlug
router.get('/:idOrSlug', createEntityDetailHandler({
    db,
    table: 'destinations',
    alias: 'd',
    entityLabel: 'Destinasi wisata',
    reviewTargetType: 'destination',
    relatedQuery: `
        SELECT d.id, d.name, d.slug, d.image_url, d.price_display, d.rating_avg, c.name as category_name, r.name as regency_name
        FROM destinations d
        JOIN categories c ON d.category_id = c.id
        JOIN regencies r ON d.regency_id = r.id
        WHERE (d.regency_id = ? OR d.category_id = ?) AND d.id != ?
        ORDER BY d.rating_avg DESC
        LIMIT 4
    `,
    relatedParams: (dest) => [dest.regency_id, dest.category_id, dest.id]
}));


// POST /api/destinations (Admin / Partner)
router.post('/', verifyToken, requireRole(['admin', 'partner']), (req, res) => {
    try {
        const {
            name, category_id, regency_id, description, address,
            latitude, longitude, price_min, price_max, price_display,
            operational_hours, contact_phone, contact_wa, is_community_managed, image_url
        } = req.body;

        if (!name?.trim() || !category_id || !regency_id) {
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
router.put('/:id', verifyToken, requireRole(['admin', 'partner']), createUpdateHandler({
    db,
    table: 'destinations',
    entityLabel: 'Destinasi',
    buildUpdate: (req) => {
        const b = req.body;
        return {
            sql: `
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
            `,
            params: [
                b.name ? b.name.trim() : null,
                b.category_id ? Number(b.category_id) : null,
                b.regency_id ? Number(b.regency_id) : null,
                b.description, b.address,
                b.latitude === undefined ? null : Number(b.latitude),
                b.longitude === undefined ? null : Number(b.longitude),
                b.price_min === undefined ? null : Number(b.price_min),
                b.price_max === undefined ? null : Number(b.price_max),
                b.price_display, b.operational_hours, b.contact_phone, b.contact_wa,
                normalizeCommunityFlag(b.is_community_managed),
                b.status, b.image_url
            ]
        };
    }
}));

// DELETE /api/destinations/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), createDeleteHandler(db, 'destinations', 'Destinasi wisata', 'destination'));

module.exports = router;
