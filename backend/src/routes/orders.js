const express = require('express');
const router = express.Router();
const db = require('../utils/mockDB');
const { cacheMiddleware } = require('../cache/middleware');

// GET /api/orders?page=1&limit=20&status=shipped
router.get('/', cacheMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const result = await db.getAllOrders({ page, limit, status });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Orders] GET /:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id
router.get('/:id', cacheMiddleware, async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
});

module.exports = router;
