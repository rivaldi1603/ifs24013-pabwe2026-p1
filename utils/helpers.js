/**
 * Shared utility functions for JelajahToba Backend REST API.
 * Eliminates duplication across route handlers and implements clean code standards.
 */

function slugify(text) {
    return text.toString().toLowerCase()
        .replaceAll(/\s+/g, '-')
        .replaceAll(/[^\w-]+/g, '')
        .replaceAll(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Generates a unique slug for a given table and title/name.
 * @param {object} db - Database wrapper
 * @param {string} table - Table name
 * @param {string} name - Entity name or title
 * @returns {string} Unique slug
 */
function generateUniqueSlug(db, table, name) {
    let slug = slugify(name);
    const existing = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug);
    if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    return slug;
}

/**
 * Extracts and clamps pagination parameters from express req.query.
 * @param {object} query - Express req.query
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
 * Builds reusable SQL filter conditions for catalog endpoints (category, regency, community_only).
 * @param {object} queryObj - Express req.query
 * @param {string} tableAlias - SQL table alias ('d', 's', etc.)
 * @returns {{ conditions: string, params: Array<any> }}
 */
function applyCommonCatalogFilters(queryObj = {}, tableAlias = 'd') {
    let conditions = '';
    const params = [];
    const { category, regency, community_only } = queryObj;

    if (category) {
        if (Number.isNaN(Number(category))) {
            conditions += ` AND c.slug = ?`;
            params.push(category);
        } else {
            conditions += ` AND ${tableAlias}.category_id = ?`;
            params.push(Number(category));
        }
    }

    if (regency) {
        conditions += ` AND ${tableAlias}.regency_id = ?`;
        params.push(Number(regency));
    }

    if (community_only === '1' || community_only === 'true') {
        conditions += ` AND ${tableAlias}.is_community_managed = 1`;
    }

    return { conditions, params };
}

/**
 * Fetches authentic user reviews for a destination or service target.
 * @param {object} db - Database wrapper
 * @param {string} targetType - 'destination' | 'service'
 * @param {number} targetId - Entity ID
 * @returns {Array<object>}
 */
function fetchEntityReviews(db, targetType, targetId) {
    return db.prepare(`
        SELECT id, reviewer_name, rating, review_text, created_at
        FROM reviews
        WHERE target_type = ? AND target_id = ?
        ORDER BY id DESC
    `).all(targetType, targetId);
}

/**
 * Creates a generic delete controller for SQLite tables with optional cascade review cleanup.
 * @param {object} db - Database wrapper
 * @param {string} table - Table name
 * @param {string} entityLabel - Human readable label (e.g. 'Destinasi wisata')
 * @param {string} [cleanupTargetType] - Optional review target type to cascade delete
 */
function createDeleteHandler(db, table, entityLabel, cleanupTargetType) {
    return (req, res) => {
        try {
            const { id } = req.params;
            const existing = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: `${entityLabel} tidak ditemukan.` });
            }

            if (cleanupTargetType) {
                db.prepare(`DELETE FROM reviews WHERE target_type = ? AND target_id = ?`).run(cleanupTargetType, id);
            }
            db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
            return res.json({
                success: true,
                message: `${entityLabel} berhasil dihapus.`
            });
        } catch (err) {
            console.error(`Delete ${table} error:`, err);
            return res.status(500).json({ success: false, message: `Gagal menghapus ${entityLabel.toLowerCase()}.` });
        }
    };
}

module.exports = {
    slugify,
    generateUniqueSlug,
    getPagination,
    applyCommonCatalogFilters,
    fetchEntityReviews,
    createDeleteHandler
};
