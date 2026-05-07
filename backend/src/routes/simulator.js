const express = require('express');
const router = express.Router();
const http = require('http');

/**
 * Traffic Simulator
 * Fires N requests against a given endpoint using the
 * HTTP client (loopback). Compares cached vs uncached timing.
 */

function makeRequest(path) {
    return new Promise((resolve) => {
        const start = performance.now();
        const options = {
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path,
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                const latency = parseFloat((performance.now() - start).toFixed(2));
                resolve({
                    path,
                    statusCode: res.statusCode,
                    source: res.headers['x-cache-source'] || 'Unknown',
                    latencyMs: latency,
                });
            });
        });

        req.on('error', (err) => {
            resolve({ path, error: err.message, latencyMs: 0 });
        });

        req.end();
    });
}

// POST /api/simulator/run
// Body: { endpoint: '/api/products', count: 50, delayMs: 100 }
router.post('/run', async (req, res) => {
    const { endpoint = '/api/products', count = 10, delayMs = 50 } = req.body;

    if (count > 500) {
        return res.status(400).json({ success: false, message: 'Max 500 requests per simulation' });
    }

    const results = [];
    const summary = { L1Hits: 0, L2Hits: 0, dbFetches: 0, totalMs: 0, minMs: Infinity, maxMs: 0 };

    for (let i = 0; i < count; i++) {
        const result = await makeRequest(endpoint);
        results.push(result);

        // Tally
        if (result.source === 'L1-LRU') summary.L1Hits++;
        else if (result.source === 'L2-Redis') summary.L2Hits++;
        else summary.dbFetches++;

        summary.totalMs += result.latencyMs;
        if (result.latencyMs < summary.minMs) summary.minMs = result.latencyMs;
        if (result.latencyMs > summary.maxMs) summary.maxMs = result.latencyMs;

        // Respect inter-request delay
        if (delayMs > 0 && i < count - 1) {
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }

    const totalHits = summary.L1Hits + summary.L2Hits;
    res.json({
        success: true,
        summary: {
            endpoint,
            totalRequests: count,
            L1Hits: summary.L1Hits,
            L2Hits: summary.L2Hits,
            dbFetches: summary.dbFetches,
            cacheHitRate: parseFloat(((totalHits / count) * 100).toFixed(2)),
            avgLatencyMs: parseFloat((summary.totalMs / count).toFixed(2)),
            minLatencyMs: summary.minMs === Infinity ? 0 : summary.minMs,
            maxLatencyMs: summary.maxMs,
        },
        results,
    });
});

// GET /api/simulator/endpoints — list available endpoints for the simulator dropdown
router.get('/endpoints', (req, res) => {
    res.json({
        success: true,
        data: [
            { path: '/api/products', label: 'All Products' },
            { path: '/api/products/categories', label: 'Product Categories' },
            { path: '/api/products/1', label: 'Product #1' },
            { path: '/api/users', label: 'All Users' },
            { path: '/api/users/1', label: 'User #1' },
            { path: '/api/orders', label: 'All Orders' },
        ],
    });
});

module.exports = router;
