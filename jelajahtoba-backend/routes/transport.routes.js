const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/transport
router.get('/', (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM transport_routes WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND transport_type = ?';
            params.push(type);
        }

        query += ' ORDER BY id DESC';
        const data = db.prepare(query).all(...params);

        return res.json({
            success: true,
            total: data.length,
            data
        });
    } catch (err) {
        console.error('Error fetching transport:', err);
        return res.status(500).json({ success: false, message: 'Gagal memuat jadwal transportasi.' });
    }
});

// POST /api/transport (Admin only)
router.post('/', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { name, transport_type, route_direction, vehicle_type, departure_hours, price_display, description, operator, contact } = req.body;

        if (!name || !route_direction) {
            return res.status(400).json({ success: false, message: 'Nama rute dan arah rute wajib diisi.' });
        }

        const validTypes = ['ferry', 'land_shuttle', 'traditional_boat'];
        const type = validTypes.includes(transport_type) ? transport_type : 'ferry';

        const stmt = db.prepare(`
            INSERT INTO transport_routes (name, transport_type, route_direction, vehicle_type, departure_hours, price_display, description, operator, contact)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            name.trim(),
            type,
            route_direction.trim(),
            vehicle_type || 'Kapal Motor Penyeberangan (KMP)',
            departure_hours || 'Setiap 1 Jam',
            price_display || 'Rp 15.000 / orang',
            description || '',
            operator || 'Dishub / Swasta',
            contact || ''
        );

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

        const validTypes = ['ferry', 'land_shuttle', 'traditional_boat'];
        const type = validTypes.includes(transport_type) ? transport_type : existing.transport_type;

        db.prepare(`
            UPDATE transport_routes
            SET name = ?, transport_type = ?, route_direction = ?, vehicle_type = ?, departure_hours = ?, price_display = ?, description = ?, operator = ?, contact = ?
            WHERE id = ?
        `).run(
            name !== undefined ? name.trim() : existing.name,
            type,
            route_direction !== undefined ? route_direction.trim() : existing.route_direction,
            vehicle_type !== undefined ? vehicle_type : existing.vehicle_type,
            departure_hours !== undefined ? departure_hours : existing.departure_hours,
            price_display !== undefined ? price_display : existing.price_display,
            description !== undefined ? description : existing.description,
            operator !== undefined ? operator : existing.operator,
            contact !== undefined ? contact : existing.contact,
            id
        );

        return res.json({ success: true, message: 'Rute transportasi berhasil diperbarui.' });
    } catch (err) {
        console.error('Update transport error:', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui rute transportasi.' });
    }
});

// DELETE /api/transport/:id (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const existing = db.prepare('SELECT * FROM transport_routes WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Rute transportasi tidak ditemukan.' });
        }

        db.prepare('DELETE FROM transport_routes WHERE id = ?').run(id);
        return res.json({ success: true, message: 'Rute transportasi berhasil dihapus.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus rute transportasi.' });
    }
});

module.exports = router;
