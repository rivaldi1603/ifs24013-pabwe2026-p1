const jwt = require('jsonwebtoken');

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable wajib diatur di production.');
    }
    JWT_SECRET = require('crypto').randomBytes(48).toString('hex');
    console.warn('[WARN] JWT_SECRET belum diatur (lihat .env.example). Memakai secret acak sementara; token lama tidak valid setelah restart.');
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' });
    }
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            // ignore invalid token in optionalAuth
        }
    }
    next();
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        }
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk tindakan ini.' });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    verifyToken,
    optionalAuth,
    requireRole
};
