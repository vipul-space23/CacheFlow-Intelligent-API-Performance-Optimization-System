/**
 * Telemetry Service
 * Tracks all real-time performance metrics for CacheFlow:
 *  - Total requests, cache hits, misses
 *  - Average latency (cached vs uncached)
 *  - Per-endpoint stats
 *  - Time-series snapshots (rolling 30-point window) for charts
 */

const telemetry = {
    totalRequests: 0,
    l1Hits: 0,      // In-memory LRU hits
    l2Hits: 0,      // Redis hits
    misses: 0,      // DB fetches
    totalLatencyMs: 0,
    cachedLatencyMs: 0,
    uncachedLatencyMs: 0,
    cachedRequests: 0,
    uncachedRequests: 0,

    // Per-endpoint breakdown: { '/api/products': { requests, hits, misses, totalLatency } }
    endpoints: {},

    // Rolling time-series for charts (max 30 points)
    timeSeries: [],

    // Track last-recorded time for series
    _lastSnapshot: Date.now(),
};

/**
 * Record a completed request
 * @param {string} endpoint - Route path (e.g. '/api/products')
 * @param {'L1'|'L2'|'DB'} source - Where the response came from
 * @param {number} latencyMs - How long the full response took
 */
function record(endpoint, source, latencyMs) {
    telemetry.totalRequests++;
    telemetry.totalLatencyMs += latencyMs;

    if (source === 'L1') {
        telemetry.l1Hits++;
        telemetry.cachedLatencyMs += latencyMs;
        telemetry.cachedRequests++;
    } else if (source === 'L2') {
        telemetry.l2Hits++;
        telemetry.cachedLatencyMs += latencyMs;
        telemetry.cachedRequests++;
    } else {
        telemetry.misses++;
        telemetry.uncachedLatencyMs += latencyMs;
        telemetry.uncachedRequests++;
    }

    // Per-endpoint tracking
    if (!telemetry.endpoints[endpoint]) {
        telemetry.endpoints[endpoint] = { requests: 0, hits: 0, misses: 0, totalLatency: 0 };
    }
    const ep = telemetry.endpoints[endpoint];
    ep.requests++;
    ep.totalLatency += latencyMs;
    if (source !== 'DB') ep.hits++;
    else ep.misses++;

    // Snapshot time-series every 5 seconds
    const now = Date.now();
    if (now - telemetry._lastSnapshot >= 5000) {
        _takeSnapshot(now);
        telemetry._lastSnapshot = now;
    }
}

function _takeSnapshot(now) {
    const totalHits = telemetry.l1Hits + telemetry.l2Hits;
    const total = totalHits + telemetry.misses;
    const hitRate = total > 0 ? parseFloat(((totalHits / total) * 100).toFixed(1)) : 0;
    const avgLatency = telemetry.totalRequests > 0
        ? parseFloat((telemetry.totalLatencyMs / telemetry.totalRequests).toFixed(1))
        : 0;

    telemetry.timeSeries.push({
        time: new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        hits: telemetry.l1Hits + telemetry.l2Hits,
        misses: telemetry.misses,
        hitRate,
        avgLatency,
        requests: telemetry.totalRequests,
    });

    // Keep rolling window of 30 points
    if (telemetry.timeSeries.length > 30) {
        telemetry.timeSeries.shift();
    }
}

function getMetrics() {
    const totalHits = telemetry.l1Hits + telemetry.l2Hits;
    const total = totalHits + telemetry.misses;
    return {
        totalRequests: telemetry.totalRequests,
        l1Hits: telemetry.l1Hits,
        l2Hits: telemetry.l2Hits,
        misses: telemetry.misses,
        hitRate: total > 0 ? parseFloat(((totalHits / total) * 100).toFixed(2)) : 0,
        avgLatencyMs: telemetry.totalRequests > 0
            ? parseFloat((telemetry.totalLatencyMs / telemetry.totalRequests).toFixed(2))
            : 0,
        avgCachedLatencyMs: telemetry.cachedRequests > 0
            ? parseFloat((telemetry.cachedLatencyMs / telemetry.cachedRequests).toFixed(2))
            : 0,
        avgUncachedLatencyMs: telemetry.uncachedRequests > 0
            ? parseFloat((telemetry.uncachedLatencyMs / telemetry.uncachedRequests).toFixed(2))
            : 0,
    };
}

function getTopEndpoints() {
    return Object.entries(telemetry.endpoints)
        .map(([path, stats]) => ({
            path,
            requests: stats.requests,
            hits: stats.hits,
            misses: stats.misses,
            hitRate: stats.requests > 0 ? parseFloat(((stats.hits / stats.requests) * 100).toFixed(1)) : 0,
            avgLatencyMs: stats.requests > 0 ? parseFloat((stats.totalLatency / stats.requests).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);
}

function getTimeSeries() {
    return telemetry.timeSeries;
}

function reset() {
    telemetry.totalRequests = 0;
    telemetry.l1Hits = 0;
    telemetry.l2Hits = 0;
    telemetry.misses = 0;
    telemetry.totalLatencyMs = 0;
    telemetry.cachedLatencyMs = 0;
    telemetry.uncachedLatencyMs = 0;
    telemetry.cachedRequests = 0;
    telemetry.uncachedRequests = 0;
    telemetry.endpoints = {};
    telemetry.timeSeries = [];
    telemetry._lastSnapshot = Date.now();
}

module.exports = { record, getMetrics, getTopEndpoints, getTimeSeries, reset };
