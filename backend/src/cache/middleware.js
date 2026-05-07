/**
 * CacheFlow Middleware
 * Intercepts GET requests and checks a two-tier cache:
 *   L1 → In-memory LRU (fastest, in-process)
 *   L2 → Redis (persistent, shared across instances)
 *   DB → Mock database / slow fetch (fallback)
 *
 * Sets response headers:
 *   X-Cache-Source: L1-LRU | L2-Redis | DB
 *   X-Cache-Latency: latency in ms
 */

const { client } = require('./redisClient');
const { memoryCache } = require('./lruCache');
const telemetry = require('../services/telemetry');

const CACHE_TTL_SECONDS = 60; // how long data lives in Redis

const cacheMiddleware = async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl;
    const startTime = performance.now();

    // ─── L1: Check In-Memory LRU Cache ───────────────────────────────────────
    const l1Data = memoryCache.get(key);
    if (l1Data) {
        const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
        telemetry.record(key, 'L1', latencyMs);

        res.setHeader('X-Cache-Source', 'L1-LRU');
        res.setHeader('X-Cache-Latency', `${latencyMs}ms`);
        return res.json(JSON.parse(l1Data));
    }

    // ─── L2: Check Redis Cache ────────────────────────────────────────────────
    if (client.isOpen) {
        try {
            const l2Data = await client.get(key);
            if (l2Data) {
                // Promote hit to L1
                memoryCache.put(key, l2Data);

                const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
                telemetry.record(key, 'L2', latencyMs);

                res.setHeader('X-Cache-Source', 'L2-Redis');
                res.setHeader('X-Cache-Latency', `${latencyMs}ms`);
                return res.json(JSON.parse(l2Data));
            }
        } catch (err) {
            console.error('[Cache Middleware] Redis get error:', err.message);
        }
    }

    // ─── MISS: Let the route handler run, then intercept the response ─────────
    // We wrap res.json to capture the body before it's sent
    const originalJson = res.json.bind(res);

    res.json = (body) => {
        const serialized = JSON.stringify(body);

        // Store in L1
        memoryCache.put(key, serialized, CACHE_TTL_SECONDS);

        // Store in L2 (Redis) if available
        if (client.isOpen) {
            client.setEx(key, CACHE_TTL_SECONDS, serialized).catch((err) => {
                console.error('[Cache Middleware] Redis set error:', err.message);
            });
        }

        const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
        telemetry.record(key, 'DB', latencyMs);

        res.setHeader('X-Cache-Source', 'DB');
        res.setHeader('X-Cache-Latency', `${latencyMs}ms`);
        return originalJson(body);
    };

    next();
};

/**
 * Invalidate a specific key from both L1 and L2 caches
 */
const invalidateCache = async (key) => {
    memoryCache.delete(key);
    if (client.isOpen) {
        await client.del(key).catch(() => {});
    }
};

module.exports = { cacheMiddleware, invalidateCache };
