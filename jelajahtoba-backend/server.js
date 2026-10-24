require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const destinationsRoutes = require('./routes/destinations.routes');
const servicesRoutes = require('./routes/services.routes');
const transportRoutes = require('./routes/transport.routes');
const culinaryRoutes = require('./routes/culinary.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const metaRoutes = require('./routes/meta.routes');
const articlesRoutes = require('./routes/articles.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for development
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

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

// Register API Routes (support both /api/* and root /* for flexible reverse proxy / rewrites)
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
    res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan.' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.', error: err.message });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`======================================================`);
        console.log(` JelajahToba Backend API is running on port ${PORT}`);
        console.log(` URL: http://localhost:${PORT}`);
        console.log(` Database: SQLite (database.sqlite)`);
        console.log(`======================================================`);
    });
}

module.exports = app;

