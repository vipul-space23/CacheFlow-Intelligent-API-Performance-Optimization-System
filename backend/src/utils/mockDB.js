/**
 * Data Layer — Database Abstraction
 *
 * Strategy:
 *   1. If MongoDB is connected  → query MongoDB (real DB, real delays)
 *   2. If MongoDB not available → use in-memory mock data (still has artificial delays)
 *
 * This means the caching layer is always meaningful —
 * whether you're running with or without MongoDB.
 */

const { getIsConnected } = require('../db/connect');
const Product = require('../models/Product');
const User    = require('../models/User');
const Order   = require('../models/Order');

// ─── In-Memory Fallback Data ──────────────────────────────────────────────────

const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'];
const brands     = ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Generic', 'Amazon Basics'];
const roles      = ['admin', 'customer', 'seller'];
const statuses   = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const MOCK_PRODUCTS = Array.from({ length: 100 }, (_, i) => ({
    _id: String(i + 1),
    name: `${brands[i % brands.length]} Product ${i + 1}`,
    price: parseFloat((Math.random() * 990 + 10).toFixed(2)),
    category: categories[i % categories.length],
    brand: brands[i % brands.length],
    stock: Math.floor(Math.random() * 500),
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
    reviews: Math.floor(Math.random() * 5000),
    description: `High quality ${categories[i % categories.length].toLowerCase()} item.`,
    createdAt: new Date(Date.now() - Math.random() * 1e10).toISOString(),
}));

const MOCK_USERS = Array.from({ length: 50 }, (_, i) => ({
    _id: String(i + 1),
    name: `User ${i + 1}`,
    email: `user${i + 1}@cacheflow.dev`,
    role: roles[i % roles.length],
    orders: Math.floor(Math.random() * 20),
    active: Math.random() > 0.2,
    createdAt: new Date(Date.now() - Math.random() * 3e10).toISOString(),
}));

const MOCK_ORDERS = Array.from({ length: 200 }, (_, i) => {
    const userId    = Math.floor(Math.random() * 50) + 1;
    const productId = Math.floor(Math.random() * 100) + 1;
    const qty       = Math.floor(Math.random() * 5) + 1;
    return {
        _id: String(i + 1),
        userId: String(userId),
        productId: String(productId),
        quantity: qty,
        total: parseFloat((MOCK_PRODUCTS[productId - 1].price * qty).toFixed(2)),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.random() * 5e9).toISOString(),
    };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

function paginate(arr, page, limit) {
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 20;
    const start = (p - 1) * l;
    return { total: arr.length, page: p, limit: l, data: arr.slice(start, start + l) };
}

// ─── Products ─────────────────────────────────────────────────────────────────

async function getAllProducts({ page = 1, limit = 20, category } = {}) {
    if (getIsConnected()) {
        const filter = category ? { category } : {};
        const [data, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).lean(),
            Product.countDocuments(filter),
        ]);
        return { total, page: parseInt(page), limit: parseInt(limit), data };
    }
    // Fallback
    await delay(600 + Math.random() * 400);
    let results = category ? MOCK_PRODUCTS.filter(p => p.category === category) : MOCK_PRODUCTS;
    return paginate(results, page, limit);
}

async function getProductById(id) {
    if (getIsConnected()) {
        return Product.findById(id).lean();
    }
    await delay(300 + Math.random() * 200);
    return MOCK_PRODUCTS.find(p => p._id === String(id)) || null;
}

async function getProductCategories() {
    if (getIsConnected()) {
        return Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { _id: 0, name: '$_id', count: 1 } },
            { $sort: { count: -1 } },
        ]);
    }
    await delay(200);
    const counts = {};
    MOCK_PRODUCTS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function getAllUsers({ page = 1, limit = 20 } = {}) {
    if (getIsConnected()) {
        const [data, total] = await Promise.all([
            User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).lean(),
            User.countDocuments(),
        ]);
        return { total, page: parseInt(page), limit: parseInt(limit), data };
    }
    await delay(500 + Math.random() * 300);
    return paginate(MOCK_USERS, page, limit);
}

async function getUserById(id) {
    if (getIsConnected()) {
        return User.findById(id).lean();
    }
    await delay(250 + Math.random() * 150);
    return MOCK_USERS.find(u => u._id === String(id)) || null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

async function getAllOrders({ page = 1, limit = 20, status } = {}) {
    if (getIsConnected()) {
        const filter = status ? { status } : {};
        const [data, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
                 .populate('userId', 'name email')
                 .populate('productId', 'name price category')
                 .lean(),
            Order.countDocuments(filter),
        ]);
        return { total, page: parseInt(page), limit: parseInt(limit), data };
    }
    await delay(700 + Math.random() * 300);
    let results = status ? MOCK_ORDERS.filter(o => o.status === status) : MOCK_ORDERS;
    return paginate(results, page, limit);
}

async function getOrderById(id) {
    if (getIsConnected()) {
        return Order.findById(id)
            .populate('userId', 'name email role')
            .populate('productId', 'name price category brand')
            .lean();
    }
    await delay(300 + Math.random() * 200);
    return MOCK_ORDERS.find(o => o._id === String(id)) || null;
}

async function getOrdersByUser(userId) {
    if (getIsConnected()) {
        return Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate('productId', 'name price category')
            .lean();
    }
    await delay(400 + Math.random() * 200);
    return MOCK_ORDERS.filter(o => o.userId === String(userId));
}

module.exports = {
    getAllProducts,
    getProductById,
    getProductCategories,
    getAllUsers,
    getUserById,
    getAllOrders,
    getOrderById,
    getOrdersByUser,
};
