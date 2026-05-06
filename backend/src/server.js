require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectRedis } = require('./cache/redisClient');
const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/products', productsRouter);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'CacheFlow Backend is running' });
});

// Start Server
const startServer = async () => {
    try {
        await connectRedis();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
