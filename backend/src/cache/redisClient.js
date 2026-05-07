/**
 * Redis Client (optional L2 cache)
 * If Redis is not running, the server falls back silently to L1 LRU cache.
 * Auto-reconnect is disabled to prevent noisy error spam.
 */

const redis = require('redis');

let client = null;
let redisAvailable = false;

const connectRedis = async () => {
    try {
        client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: false,       // disable auto-reconnect — we fail fast
                connectTimeout: 3000,           // 3s timeout
            },
        });

        // Surface errors but don't crash
        client.on('error', () => {});

        await client.connect();
        redisAvailable = true;
        console.log('[Redis] Connected to Redis (L2 cache enabled)');
    } catch (err) {
        redisAvailable = false;
        console.log('[Redis] Not available — running with L1 In-Memory LRU Cache only');
        client = null;
    }
};

// Proxy object used by middleware — gracefully becomes a no-op if Redis is down
const redisProxy = {
    get isOpen() {
        return redisAvailable && client !== null && client.isOpen;
    },
    async get(key) {
        if (!this.isOpen) return null;
        return client.get(key);
    },
    async setEx(key, ttl, value) {
        if (!this.isOpen) return;
        return client.setEx(key, ttl, value);
    },
    async del(key) {
        if (!this.isOpen) return;
        return client.del(key);
    },
};

const isRedisAvailable = () => redisAvailable && client !== null && client.isOpen;

module.exports = { client: redisProxy, connectRedis, isRedisAvailable };
