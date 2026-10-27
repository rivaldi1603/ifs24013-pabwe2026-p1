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


// POST /api/transport (Admin only)
router.post('/', verifyToken, requireRole('admin'), (req, res) => {
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
router.put('/:id', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const { name, transport_type, route_direction, vehicle_type, departure_hours, price_display, description, operator, contact } = req.body;

        const existing = db.prepare('SELECT * FROM transport_routes WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Rute transportasi tidak ditemukan.' });
        }

        const allowedModes = ['ferry', 'land_shuttle', 'traditional_boat'];
        const resolvedType = allowedModes.includes(transport_type) ? transport_type : existing.transport_type;

        const updateFields = [
            name === undefined ? existing.name : name.trim(),
            resolvedType,
            route_direction === undefined ? existing.route_direction : route_direction.trim(),
            vehicle_type === undefined ? existing.vehicle_type : vehicle_type,
            departure_hours === undefined ? existing.departure_hours : departure_hours,
            price_display === undefined ? existing.price_display : price_display,
            description === undefined ? existing.description : description,
            operator === undefined ? existing.operator : operator,
            contact === undefined ? existing.contact : contact,
            id
        ];

        db.prepare(`
            UPDATE transport_routes
            SET name = ?, transport_type = ?, route_direction = ?, vehicle_type = ?, departure_hours = ?, price_display = ?, description = ?, operator = ?, contact = ?
            WHERE id = ?
        `).run(...updateFields);

        return res.json({ success: true, message: 'Rute transportasi berhasil diperbarui.' });
    } catch (err) {
        console.error('Update transport error:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui rute transportasi.' });
    }
});

// DELETE /api/transport/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), createDeleteHandler(db, 'transport_routes', 'Rute transportasi'));

module.exports = router;

