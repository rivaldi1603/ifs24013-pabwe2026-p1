const express = require('express');
const app = express();

let initError = null;

try {
    require('dotenv').config();
    const cors = require('cors');

    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    const db = require('./db');

    app.use(async (req, res, next) => {
        if (db.ready) {
            try {
                await db.ready;
            } catch (e) {
                console.error('Error awaiting db.ready:', e);
            }
        }
        next();
    });

    // Request logger for development
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });

    const authRoutes = require('./routes/auth.routes');
    const destinationsRoutes = require('./routes/destinations.routes');
    const servicesRoutes = require('./routes/services.routes');
    const transportRoutes = require('./routes/transport.routes');
    const culinaryRoutes = require('./routes/culinary.routes');
    const reviewsRoutes = require('./routes/reviews.routes');
    const metaRoutes = require('./routes/meta.routes');
    const articlesRoutes = require('./routes/articles.routes');

    // Health check
    app.get(['/', '/api', '/api/health', '/health'], (req, res) => {
        res.json({
            name: 'JelajahToba API',
            version: '1.0.0',
            description: 'REST API Direktori Wisata dan Jasa Lokal Kawasan Danau Toba',
            status: 'online',
            endpoints: [
                '/api/destinations',
                '/api/services',
                '/api/transport',
                '/api/culinary',
                '/api/reviews',
                '/api/meta/categories',
                '/api/meta/regencies',
                '/api/meta/stats',
                '/api/articles',
                '/api/auth/login'
            ]
        });
    });

    const registerRoutes = (prefix = '') => {
        app.use(`${prefix}/auth`, authRoutes);
        app.use(`${prefix}/destinations`, destinationsRoutes);
        app.use(`${prefix}/services`, servicesRoutes);
        app.use(`${prefix}/transport`, transportRoutes);
        app.use(`${prefix}/culinary`, culinaryRoutes);
        app.use(`${prefix}/reviews`, reviewsRoutes);
        app.use(`${prefix}/meta`, metaRoutes);
        app.use(`${prefix}/articles`, articlesRoutes);
    };

    registerRoutes('/api');
    registerRoutes('');

    // 404 Handler
    app.use((req, res) => {
        res.status(404).json({ success: false, message: `Endpoint ${req.url} tidak ditemukan.` });
    });

    // Error Handler
    app.use((err, req, res, next) => {
        console.error('Unhandled server error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.', error: err.message });
    });
} catch (e) {
    initError = e;
    console.error('CRITICAL INITIALIZATION ERROR:', e);
}

// Fallback error handler if initialization failed
app.use((req, res) => {
    res.status(500).json({
        success: false,
        error: 'Backend initialization failed',
        message: initError ? initError.message : 'Unknown error',
        stack: initError ? initError.stack : null
    });
});

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`======================================================`);
        console.log(` JelajahToba Backend API is running on port ${PORT}`);
        console.log(` URL: http://localhost:${PORT}`);
        console.log(` Database: SQLite (database.sqlite)`);
        console.log(`======================================================`);
    });
}

module.exports = app;
