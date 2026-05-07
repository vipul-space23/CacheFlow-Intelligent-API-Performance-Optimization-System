const express = require('express');
const router = express.Router();
const telemetry = require('../services/telemetry');
const { memoryCache } = require('../cache/lruCache');

// GET /api/analytics/metrics
// Returns the main KPI snapshot used by the dashboard stat cards
router.get('/metrics', (req, res) => {
    const metrics = telemetry.getMetrics();
    const cacheStats = memoryCache.getStats();
    res.json({
        success: true,
        data: {
            ...metrics,
            cacheSize: cacheStats.size,
            cacheCapacity: cacheStats.capacity,
            cacheSizeBytes: cacheStats.totalBytes,
            cacheSizeMB: cacheStats.totalBytesMB,
            cacheEvictions: cacheStats.evictions,
            cacheExpirations: cacheStats.expirations,
        },
    });
});

// GET /api/analytics/timeseries
// Returns rolling 30-point time-series for Recharts line/area charts
router.get('/timeseries', (req, res) => {
    res.json({
        success: true,
        data: telemetry.getTimeSeries(),
    });
});

// GET /api/analytics/endpoints
// Returns top-10 endpoints by request count
router.get('/endpoints', (req, res) => {
    res.json({
        success: true,
        data: telemetry.getTopEndpoints(),
    });
});

// GET /api/analytics/cache-entries
// Returns current LRU cache contents (for Cache Explorer page)
router.get('/cache-entries', (req, res) => {
    res.json({
        success: true,
        data: memoryCache.getEntries(),
        stats: memoryCache.getStats(),
    });
});

// DELETE /api/analytics/cache
// Flush the entire in-memory LRU cache
router.delete('/cache', (req, res) => {
    memoryCache.clear();
    res.json({ success: true, message: 'In-memory cache flushed' });
});

// POST /api/analytics/reset
// Reset all telemetry counters
router.post('/reset', (req, res) => {
    telemetry.reset();
    res.json({ success: true, message: 'Telemetry counters reset' });
});

module.exports = router;
