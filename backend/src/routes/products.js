const express = require('express');
const router = express.Router();
const { fetchProducts, fetchProductById } = require('../utils/mockDB');
const { cacheMiddleware } = require('../cache/middleware');

// GET all products
// Uses cache middleware
router.get('/', cacheMiddleware, async (req, res) => {
    try {
        const products = await fetchProducts();
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET single product
router.get('/:id', cacheMiddleware, async (req, res) => {
    try {
        const product = await fetchProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({
            success: true,
            data: product
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
