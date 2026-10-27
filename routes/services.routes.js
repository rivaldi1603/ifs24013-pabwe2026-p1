const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const db = require('../db');
const {
    generateUniqueSlug,
    applyCommonCatalogFilters,
    createDeleteHandler,
    sendPaginatedQuery,
    normalizeCommunityFlag,
    createEntityDetailHandler,
    createUpdateHandler
} = require('../utils/helpers');
const router = express.Router();



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
        const body = req.body;
        if (!body.name || !body.category_id || !body.regency_id || !body.provider_name) {
            return res.status(400).json({ success: false, message: 'Nama, kategori, kabupaten, dan penyedia jasa wajib diisi.' });
        }

        const generatedSlug = generateUniqueSlug(db, 'services', body.name);
        const serviceRecord = {
            name: body.name.trim(),
            slug: generatedSlug,
            category_id: Number(body.category_id),
            regency_id: Number(body.regency_id),
            provider_name: body.provider_name.trim(),
            service_type: body.service_type || 'cultural_experience',
            description: body.description || '',
            price_min: body.price_min ? Number(body.price_min) : 0,
            price_max: body.price_max ? Number(body.price_max) : 0,
            price_unit: body.price_unit || 'per orang',
            price_display: body.price_display || 'Hubungi Pengelola',
            facilities: body.facilities || '',
            address: body.address || '',
            latitude: body.latitude ? Number(body.latitude) : null,
            longitude: body.longitude ? Number(body.longitude) : null,
            contact_phone: body.contact_phone || null,
            contact_wa: body.contact_wa || null,
            is_community_managed: body.is_community_managed ? 1 : 0
        };

        const cols = Object.keys(serviceRecord);
        const placeholders = cols.map(() => '?').join(', ');
        const insertRes = db.prepare(`INSERT INTO services (${cols.join(', ')}) VALUES (${placeholders})`)
            .run(...Object.values(serviceRecord));

        return res.status(201).json({
            success: true,
            message: 'Jasa / layanan lokal berhasil didaftarkan.',
            id: insertRes.lastInsertRowid,
            slug: generatedSlug
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
        const serviceExists = db.prepare('SELECT id FROM services WHERE id = ?').get(id);
        if (!serviceExists) {
            return res.status(404).json({ success: false, message: 'Layanan lokal tidak ditemukan.' });
        }

        const b = req.body;
        const updateEntries = {
            name: b.name ? b.name.trim() : null,
            category_id: b.category_id ? Number(b.category_id) : null,
            regency_id: b.regency_id ? Number(b.regency_id) : null,
            provider_name: b.provider_name ? b.provider_name.trim() : null,
            service_type: b.service_type,
            description: b.description,
            price_min: b.price_min === undefined ? null : Number(b.price_min),
            price_max: b.price_max === undefined ? null : Number(b.price_max),
            price_unit: b.price_unit,
            price_display: b.price_display,
            facilities: b.facilities,
            address: b.address,
            latitude: b.latitude === undefined ? null : Number(b.latitude),
            longitude: b.longitude === undefined ? null : Number(b.longitude),
            contact_phone: b.contact_phone,
            contact_wa: b.contact_wa,
            is_community_managed: normalizeCommunityFlag(b.is_community_managed),
            status: b.status
        };

        const setSql = Object.keys(updateEntries).map(k => `${k} = COALESCE(?, ${k})`).join(', ');
        db.prepare(`UPDATE services SET ${setSql} WHERE id = ?`).run(...Object.values(updateEntries), id);

        return res.json({ success: true, message: 'Data layanan lokal berhasil diperbarui.' });
    } catch (err) {
        console.error('Error updating service:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui layanan lokal.' });
    }
});

// DELETE /api/services/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), createDeleteHandler(db, 'services', 'Layanan lokal', 'service'));

module.exports = router;
