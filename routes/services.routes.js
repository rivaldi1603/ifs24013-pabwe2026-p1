const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    generateUniqueSlug,
    applyCommonCatalogFilters,
    fetchEntityReviews,
    createDeleteHandler,
    sendPaginatedQuery,
    findEntityByIdOrSlug,
    normalizeCommunityFlag,
    createEntityDetailHandler
} = require('../utils/helpers');



// GET /api/services
router.get('/', (req, res) => {
    try {
        const { service_type, search } = req.query;
        const { conditions, params } = applyCommonCatalogFilters(req.query, 's');
        let extraWhere = conditions;

        if (service_type) {
            extraWhere += ` AND s.service_type = ?`;
            params.push(service_type);
        }

        if (search) {
            extraWhere += ` AND (s.name LIKE ? OR s.description LIKE ? OR s.provider_name LIKE ? OR s.address LIKE ?)`;
            const term = `%${search.trim()}%`;
            params.push(term, term, term, term);
        }

        const countQuery = `
            SELECT COUNT(*) as total
            FROM services s
            JOIN categories c ON s.category_id = c.id
            JOIN regencies r ON s.regency_id = r.id
            WHERE 1=1 ${extraWhere}
        `;

        const dataQuery = `
            SELECT s.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
            FROM services s
            JOIN categories c ON s.category_id = c.id
            JOIN regencies r ON s.regency_id = r.id
            WHERE 1=1 ${extraWhere}
            ORDER BY s.is_community_managed DESC, s.rating_avg DESC, s.id ASC
        `;

        return sendPaginatedQuery(res, db, countQuery, dataQuery, params, req.query, 20);
    } catch (err) {
        console.error('Error fetching services:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat direktori jasa dan pengalaman lokal.' });
    }
});

// GET /api/services/:idOrSlug
router.get('/:idOrSlug', createEntityDetailHandler({
    db,
    table: 'services',
    alias: 's',
    entityLabel: 'Layanan / jasa lokal',
    reviewTargetType: 'service',
    relatedQuery: `
        SELECT s.id, s.name, s.slug, s.provider_name, s.price_display, s.rating_avg, s.service_type, r.name as regency_name
        FROM services s
        JOIN regencies r ON s.regency_id = r.id
        WHERE (s.regency_id = ? OR s.service_type = ?) AND s.id != ?
        ORDER BY s.rating_avg DESC
        LIMIT 4
    `,
    relatedParams: (srv) => [srv.regency_id, srv.service_type, srv.id]
}));


// POST /api/services (Admin / Partner)
router.post('/', verifyToken, requireRole(['admin', 'partner']), (req, res) => {
    try {
        const {
            name, category_id, regency_id, provider_name, service_type,
            description, price_min, price_max, price_unit, price_display,
            facilities, address, latitude, longitude, contact_phone, contact_wa, is_community_managed
        } = req.body;

        if (!name || !category_id || !regency_id || !provider_name) {
            return res.status(400).json({ success: false, message: 'Nama, kategori, kabupaten, dan penyedia jasa wajib diisi.' });
        }

        const slug = generateUniqueSlug(db, 'services', name);

        const stmt = db.prepare(`
            INSERT INTO services (
                name, slug, category_id, regency_id, provider_name, service_type,
                description, price_min, price_max, price_unit, price_display,
                facilities, address, latitude, longitude, contact_phone, contact_wa, is_community_managed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            name.trim(), slug, Number(category_id), Number(regency_id),
            provider_name.trim(), service_type || 'cultural_experience',
            description || '', price_min ? Number(price_min) : 0, price_max ? Number(price_max) : 0,
            price_unit || 'per orang', price_display || 'Hubungi Pengelola',
            facilities || '', address || '',
            latitude ? Number(latitude) : null,
            longitude ? Number(longitude) : null,
            contact_phone || null,
            contact_wa || null,
            is_community_managed ? 1 : 0
        );

        return res.status(201).json({
            success: true,
            message: 'Jasa / layanan lokal berhasil didaftarkan.',
            id: result.lastInsertRowid,
            slug
        });
    } catch (err) {
        console.error('Error creating service:', err);
        return res.status(500).json({ success: false, message: 'Gagal menambahkan layanan lokal.' });
    }
});

// PUT /api/services/:id (Admin / Partner)
router.put('/:id', verifyToken, requireRole(['admin', 'partner']), (req, res) => {
    try {
        const { id } = req.params;
        const existing = db.prepare('SELECT id FROM services WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Layanan lokal tidak ditemukan.' });
        }

        const {
            name, category_id, regency_id, provider_name, service_type,
            description, price_min, price_max, price_unit, price_display,
            facilities, address, latitude, longitude, contact_phone, contact_wa, is_community_managed, status
        } = req.body;

        const stmt = db.prepare(`
            UPDATE services SET
                name = COALESCE(?, name),
                category_id = COALESCE(?, category_id),
                regency_id = COALESCE(?, regency_id),
                provider_name = COALESCE(?, provider_name),
                service_type = COALESCE(?, service_type),
                description = COALESCE(?, description),
                price_min = COALESCE(?, price_min),
                price_max = COALESCE(?, price_max),
                price_unit = COALESCE(?, price_unit),
                price_display = COALESCE(?, price_display),
                facilities = COALESCE(?, facilities),
                address = COALESCE(?, address),
                latitude = COALESCE(?, latitude),
                longitude = COALESCE(?, longitude),
                contact_phone = COALESCE(?, contact_phone),
                contact_wa = COALESCE(?, contact_wa),
                is_community_managed = COALESCE(?, is_community_managed),
                status = COALESCE(?, status)
            WHERE id = ?
        `);

        const communityVal = normalizeCommunityFlag(is_community_managed);



        stmt.run(
            name ? name.trim() : null,
            category_id ? Number(category_id) : null,
            regency_id ? Number(regency_id) : null,
            provider_name ? provider_name.trim() : null,
            service_type, description,
            price_min === undefined ? null : Number(price_min),
            price_max === undefined ? null : Number(price_max),
            price_unit, price_display, facilities, address,
            latitude === undefined ? null : Number(latitude),
            longitude === undefined ? null : Number(longitude),
            contact_phone, contact_wa,
            communityVal,
            status, id
        );

        return res.json({ success: true, message: 'Data layanan lokal berhasil diperbarui.' });
    } catch (err) {
        console.error('Error updating service:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui layanan lokal.' });
    }
});

// DELETE /api/services/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), createDeleteHandler(db, 'services', 'Layanan lokal', 'service'));

module.exports = router;
