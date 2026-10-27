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

/**
 * Executes a simple list query and sends standardized json response.
 * @param {object} res - Express response
 * @param {object} db - Database wrapper
 * @param {string} sql - SQL query
 * @param {Array<any>} [params=[]] - Query parameters
 */
function sendListQuery(res, db, sql, params = []) {
    const data = db.prepare(sql).all(...params);
    return res.json({
        success: true,
        total: data.length,
        data
    });
}

/**
 * Executes a paginated SQL query and sends the standardized JSON response.
 * @param {object} res - Express response
 * @param {object} db - Database wrapper
 * @param {string} countQuery - SQL query returning { total: number }
 * @param {string} dataQuery - SQL query without LIMIT/OFFSET
 * @param {Array<any>} params - Query parameters
 * @param {object} [reqQuery={}] - Express req.query
 * @param {number} [defaultLimit=20]
 */
function sendPaginatedQuery(res, db, countQuery, dataQuery, params, reqQuery = {}, defaultLimit = 20) {
    const countRow = db.prepare(countQuery).get(...params);
    const total = countRow?.total || 0;
    const { page, limit, offset } = getPagination(reqQuery, defaultLimit);
    const data = db.prepare(`${dataQuery} LIMIT ? OFFSET ?`).all(...params, limit, offset);

    return res.json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        data
    });
}

/**
 * Resolves an entity by ID or slug with category and regency joins.
 * @param {object} db - Database wrapper
 * @param {string} table - Table name ('destinations' or 'services')
 * @param {string} alias - Table alias ('d' or 's')
 * @param {string|number} idOrSlug - Entity ID or slug
 * @returns {object|undefined}
 */
function findEntityByIdOrSlug(db, table, alias, idOrSlug) {
    const isNumeric = !Number.isNaN(Number(idOrSlug));
    const condition = isNumeric ? `${alias}.id = ?` : `${alias}.slug = ?`;
    const paramVal = isNumeric ? Number(idOrSlug) : idOrSlug;

    const baseSql = `
        SELECT ${alias}.*, c.name as category_name, c.slug as category_slug, r.name as regency_name, r.short_name as regency_short
        FROM ${table} ${alias}
        JOIN categories c ON ${alias}.category_id = c.id
        JOIN regencies r ON ${alias}.regency_id = r.id
        WHERE
    `;

    let entity = db.prepare(`${baseSql} ${condition}`).get(paramVal);
    if (!entity && !isNumeric) {
        entity = db.prepare(`${baseSql} ${alias}.id = ?`).get(Number(idOrSlug) || 0);
    }
    return entity;
}

module.exports = {
    slugify,
    generateUniqueSlug,
    getPagination,
    applyCommonCatalogFilters,
    fetchEntityReviews,
    createDeleteHandler,
    sendListQuery,
    sendPaginatedQuery,
    findEntityByIdOrSlug
};

