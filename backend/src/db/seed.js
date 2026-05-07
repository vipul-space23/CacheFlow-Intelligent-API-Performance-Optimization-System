/**
 * Seed Script
 * Populates MongoDB with 100 products, 50 users, and 200 orders.
 * Run: node src/db/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');
const Order    = require('../models/Order');

const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'];
const brands     = ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Generic', 'Amazon Basics'];
const roles      = ['admin', 'customer', 'seller'];
const statuses   = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

async function seed() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cacheflow';

    console.log('Connecting to MongoDB…');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected.');

    // ── Clear existing data ──────────────────────────────────────────────────
    console.log('Clearing existing data…');
    await Promise.all([Product.deleteMany(), User.deleteMany(), Order.deleteMany()]);

    // ── Seed Products ────────────────────────────────────────────────────────
    console.log('Seeding 100 products…');
    const productDocs = Array.from({ length: 100 }, (_, i) => ({
        name:        `${brands[i % brands.length]} Product ${i + 1}`,
        price:       parseFloat((Math.random() * 990 + 10).toFixed(2)),
        category:    categories[i % categories.length],
        brand:       brands[i % brands.length],
        stock:       Math.floor(Math.random() * 500),
        rating:      parseFloat((Math.random() * 2 + 3).toFixed(1)),
        reviews:     Math.floor(Math.random() * 5000),
        description: `High quality ${categories[i % categories.length].toLowerCase()} product from ${brands[i % brands.length]}.`,
    }));
    const products = await Product.insertMany(productDocs);
    console.log(`  ✔ ${products.length} products inserted`);

    // ── Seed Users ───────────────────────────────────────────────────────────
    console.log('Seeding 50 users…');
    const userDocs = Array.from({ length: 50 }, (_, i) => ({
        name:   `User ${i + 1}`,
        email:  `user${i + 1}@cacheflow.dev`,
        role:   roles[i % roles.length],
        orders: Math.floor(Math.random() * 20),
        active: Math.random() > 0.2,
    }));
    const users = await User.insertMany(userDocs);
    console.log(`  ✔ ${users.length} users inserted`);

    // ── Seed Orders ──────────────────────────────────────────────────────────
    console.log('Seeding 200 orders…');
    const orderDocs = Array.from({ length: 200 }, () => {
        const user    = users[Math.floor(Math.random() * users.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const qty     = Math.floor(Math.random() * 5) + 1;
        return {
            userId:    user._id,
            productId: product._id,
            quantity:  qty,
            total:     parseFloat((product.price * qty).toFixed(2)),
            status:    statuses[Math.floor(Math.random() * statuses.length)],
        };
    });
    const orders = await Order.insertMany(orderDocs);
    console.log(`  ✔ ${orders.length} orders inserted`);

    console.log('\n🎉 Seeding complete! Database: cacheflow');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
