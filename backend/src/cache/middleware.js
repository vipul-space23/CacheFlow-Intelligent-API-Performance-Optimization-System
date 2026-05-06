const { client } = require('./redisClient');
const { memoryCache } = require('./lruCache');

const cacheMiddleware = async (req, res, next) => {
    const key = req.originalUrl || req.url;

    // 1. Check L1 Cache (In-Memory LRU)
    const l1Data = memoryCache.get(key);
    if (l1Data) {
        console.log(`[L1 HIT] Serving from In-Memory LRU: ${key}`);
        // Attach a custom header to indicate source
        res.setHeader('X-Cache-Source', 'L1-LRU');
        return res.json(JSON.parse(l1Data));
    }

    // 2. Check L2 Cache (Redis)
    try {
        if (client.isOpen) {
            const l2Data = await client.get(key);
            if (l2Data) {
                console.log(`[L2 HIT] Serving from Redis: ${key}`);
                
                // Promote to L1 (LRU) since it was accessed
                memoryCache.put(key, l2Data);
                
                res.setHeader('X-Cache-Source', 'L2-Redis');
                return res.json(JSON.parse(l2Data));
            }
        }
    } catch (err) {
        console.error('Redis Get Error:', err);
    }

    console.log(`[MISS] Fetching from DB: ${key}`);
    
    // Intercept res.json to cache the response before sending it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        const stringifiedBody = JSON.stringify(body);
        
        // Save to L1 Cache
        memoryCache.put(key, stringifiedBody);
        
        // Save to L2 Cache (Redis) with expiration (e.g., 60 seconds)
        if (client.isOpen) {
            client.setEx(key, 60, stringifiedBody).catch(err => {
                console.error('Redis Set Error:', err);
            });
        }
        
        res.setHeader('X-Cache-Source', 'DB');
        originalJson(body);
    };

    next();
};

module.exports = { cacheMiddleware };
