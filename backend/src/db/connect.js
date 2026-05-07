/**
 * MongoDB Connection
 * Connects to MongoDB using the MONGODB_URI from .env
 * Falls back gracefully if MongoDB is not available,
 * so the app can still run using in-memory mock data.
 */

const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.log('[MongoDB] MONGODB_URI not set — using in-memory mock data');
        return;
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // fail fast if Mongo unreachable
        });
        isConnected = true;
        console.log('[MongoDB] Connected →', uri.replace(/\/\/.*@/, '//***@')); // mask credentials
    } catch (err) {
        console.log('[MongoDB] Not available — using in-memory mock data as fallback');
        console.log('          Reason:', err.message);
    }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
