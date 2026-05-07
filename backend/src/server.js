require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectRedis, isRedisAvailable } = require('./cache/redisClient');
const { connectDB, getIsConnected } = require('./db/connect');

// ─── Route Imports ────────────────────────────────────────────────────────────
const productsRouter   = require('./routes/products');
const usersRouter      = require('./routes/users');
const ordersRouter     = require('./routes/orders');
const analyticsRouter  = require('./routes/analytics');
const simulatorRouter  = require('./routes/simulator');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.url}`);
    next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/products',   productsRouter);
app.use('/api/users',      usersRouter);
app.use('/api/orders',     ordersRouter);
app.use('/api/analytics',  analyticsRouter);
app.use('/api/simulator',  simulatorRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CacheFlow Backend',
        timestamp: new Date().toISOString(),
        port: PORT,
    });
});

// ─── Status Route ─────────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        redis: isRedisAvailable(),
        mongodb: getIsConnected(),
        timestamp: new Date().toISOString(),
    });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
    // Connect MongoDB (graceful fallback to in-memory if unavailable)
    await connectDB();

    // Connect Redis (graceful fallback to L1-only if unavailable)
    await connectRedis();

    app.listen(PORT, () => {
        const dbMode = getIsConnected() ? 'MongoDB (real DB)' : 'In-Memory Mock Data';
        console.log('─────────────────────────────────────────');
        console.log(`  CacheFlow Backend  —  port ${PORT}`);
        console.log(`  Database : ${dbMode}`);
        console.log('─────────────────────────────────────────');
        console.log('  Routes:');
        console.log('    GET  /health');
        console.log('    GET  /api/products');
        console.log('    GET  /api/products/:id');
        console.log('    GET  /api/products/categories');
        console.log('    GET  /api/users');
        console.log('    GET  /api/users/:id');
        console.log('    GET  /api/users/:id/orders');
        console.log('    GET  /api/orders');
        console.log('    GET  /api/orders/:id');
        console.log('    GET  /api/analytics/metrics');
        console.log('    GET  /api/analytics/timeseries');
        console.log('    GET  /api/analytics/endpoints');
        console.log('    GET  /api/analytics/cache-entries');
        console.log('    DEL  /api/analytics/cache');
        console.log('    POST /api/analytics/reset');
        console.log('    POST /api/simulator/run');
        console.log('    GET  /api/simulator/endpoints');
        console.log('─────────────────────────────────────────');
        console.log('  Seed DB: node src/db/seed.js');
        console.log('─────────────────────────────────────────');
    });
};

startServer();

