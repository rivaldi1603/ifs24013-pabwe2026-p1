/**
 * Shared utility functions for JelajahToba Backend REST API.
 * Eliminates duplication across route handlers.
 */

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Extracts and clamps pagination parameters from express req.query.
 * @param {object} query
 * @param {number} [defaultLimit=20]
 * @returns {{ page: number, limit: number, offset: number }}
 */
function getPagination(query = {}, defaultLimit = 20) {
    const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), 100);
    const page = Math.max(Number(query.page) || 1, 1);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

/**
 * Creates a generic delete controller for SQLite tables.
 * @param {object} db
 * @param {string} table
 * @param {string} entityLabel
 * @param {string} [successMessage]
 */
function createDeleteHandler(db, table, entityLabel, successMessage) {
    return (req, res) => {
        try {
            const { id } = req.params;
            const existing = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: `${entityLabel} tidak ditemukan.` });
            }

            db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
            return res.json({
                success: true,
                message: successMessage || `${entityLabel} berhasil dihapus.`
            });
        } catch (err) {
            console.error(`Delete ${table} error:`, err);
            return res.status(500).json({ success: false, message: `Gagal menghapus ${entityLabel.toLowerCase()}.` });
        }
    };
}

module.exports = {
    slugify,
    getPagination,
    createDeleteHandler
};
