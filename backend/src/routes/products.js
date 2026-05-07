const express = require('express');
const router = express.Router();
const db = require('../utils/mockDB');
const { cacheMiddleware, invalidateCache } = require('../cache/middleware');

// GET /api/products?page=1&limit=20&category=Electronics
router.get('/', cacheMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        const result = await db.getAllProducts({ page, limit, category });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Products] GET /:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
});

// GET /api/products/categories
router.get('/categories', cacheMiddleware, async (req, res) => {
    try {
        const categories = await db.getProductCategories();
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

// GET /api/products/:id
router.get('/:id', cacheMiddleware, async (req, res) => {
    try {
        const product = await db.getProductById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
});

// DELETE /api/products/:id/cache — manually invalidate cache for a product
router.delete('/:id/cache', async (req, res) => {
    try {
        await invalidateCache(`/api/products/${req.params.id}`);
        await invalidateCache('/api/products');
        res.json({ success: true, message: `Cache cleared for product ${req.params.id}` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to invalidate cache' });
    }
});

module.exports = router;
