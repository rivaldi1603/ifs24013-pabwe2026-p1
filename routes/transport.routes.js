const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { createDeleteHandler, sendListQuery } = require('../utils/helpers');

// GET /api/transport
router.get('/', (req, res) => {
    try {
        const { type } = req.query;
        if (type) {
            return sendListQuery(res, db, 'SELECT * FROM transport_routes WHERE transport_type = ? ORDER BY id DESC', [type]);
        }
        return sendListQuery(res, db, 'SELECT * FROM transport_routes ORDER BY id DESC');
    } catch (err) {
        console.error('Error fetching transport:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat jadwal transportasi.' });
    }
});


const requireAdmin = [verifyToken, requireRole('admin')];

// POST /api/transport (Admin only)
router.post('/', ...requireAdmin, (req, res) => {
    try {
        const { name, transport_type, route_direction, vehicle_type, departure_hours, price_display, description, operator, contact } = req.body;

        if (!name?.trim() || !route_direction?.trim()) {
            return res.status(400).json({ success: false, message: 'Nama rute dan arah rute wajib diisi.' });
        }

        const allowedModes = ['ferry', 'land_shuttle', 'traditional_boat'];
        const resolvedType = allowedModes.includes(transport_type) ? transport_type : 'ferry';

        const stmt = db.prepare(`
            INSERT INTO transport_routes (name, transport_type, route_direction, vehicle_type, departure_hours, price_display, description, operator, contact)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertPayload = [
            name.trim(),
            resolvedType,
            route_direction.trim(),
            vehicle_type || 'Kapal Motor Penyeberangan (KMP)',
            departure_hours || 'Setiap 1 Jam',
            price_display || 'Rp 15.000 / orang',
            description || '',
            operator || 'Dishub / Swasta',
            contact || ''
        ];
        const result = stmt.run(...insertPayload);

        return res.status(201).json({
            success: true,
            message: 'Rute transportasi berhasil ditambahkan.',
            data: { id: result.lastInsertRowid, name }
        });
    } catch (err) {
        console.error('Create transport error:', err);
        return res.status(500).json({ success: false, message: 'Gagal menambahkan rute transportasi.' });
    }
});

// PUT /api/transport/:id (Admin only)
router.put('/:id', ...requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const targetRoute = db.prepare('SELECT * FROM transport_routes WHERE id = ?').get(id);
        if (!targetRoute) {
            return res.status(404).json({ success: false, message: 'Rute transportasi tidak ditemukan.' });
        }

        const b = req.body;
        const allowedModes = ['ferry', 'land_shuttle', 'traditional_boat'];
        const resolvedType = allowedModes.includes(b.transport_type) ? b.transport_type : targetRoute.transport_type;

        db.prepare(`
            UPDATE transport_routes
            SET name = ?, transport_type = ?, route_direction = ?, vehicle_type = ?, departure_hours = ?, price_display = ?, description = ?, operator = ?, contact = ?
            WHERE id = ?
        `).run(
            b.name === undefined ? targetRoute.name : b.name.trim(),
            resolvedType,
            b.route_direction === undefined ? targetRoute.route_direction : b.route_direction.trim(),
            b.vehicle_type === undefined ? targetRoute.vehicle_type : b.vehicle_type,
            b.departure_hours === undefined ? targetRoute.departure_hours : b.departure_hours,
            b.price_display === undefined ? targetRoute.price_display : b.price_display,
            b.description === undefined ? targetRoute.description : b.description,
            b.operator === undefined ? targetRoute.operator : b.operator,
            b.contact === undefined ? targetRoute.contact : b.contact,
            id
        );

        return res.json({ success: true, message: 'Rute transportasi berhasil diperbarui.' });
    } catch (err) {
        console.error('Update transport error:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui rute transportasi.' });
    }
});

// DELETE /api/transport/:id (Admin only)
router.delete('/:id', ...requireAdmin, createDeleteHandler(db, 'transport_routes', 'Rute transportasi'));

module.exports = router;

