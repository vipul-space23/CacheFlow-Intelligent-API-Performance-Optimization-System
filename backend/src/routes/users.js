const express = require('express');
const router = express.Router();
const db = require('../utils/mockDB');
const { cacheMiddleware } = require('../cache/middleware');

// GET /api/users?page=1&limit=20
router.get('/', cacheMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await db.getAllUsers({ page, limit });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Users] GET /:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// GET /api/users/:id
router.get('/:id', cacheMiddleware, async (req, res) => {
    try {
        const user = await db.getUserById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

// GET /api/users/:id/orders
router.get('/:id/orders', cacheMiddleware, async (req, res) => {
    try {
        const user = await db.getUserById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const orders = await db.getOrdersByUser(req.params.id);
        res.json({ success: true, userId: parseInt(req.params.id), total: orders.length, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch user orders' });
    }
});

module.exports = router;
