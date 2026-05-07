/**
 * LRU Cache — Custom DSA Implementation
 * Uses: HashMap + Doubly Linked List
 * Time Complexity: O(1) for get, put, delete
 * Space Complexity: O(n) where n = capacity
 *
 * Features:
 *  - Capacity-based eviction (LRU policy)
 *  - TTL (Time-To-Live) per entry — auto expires stale data
 *  - Byte-level size tracking for dashboard metrics
 *  - Full stats: hits, misses, evictions
 */

class Node {
    constructor(key, value, ttl = 0) {
        this.key = key;
        this.value = value;
        this.expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : 0; // 0 = never expires
        this.byteSize = Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value), 'utf8');
        this.prev = null;
        this.next = null;
    }

    isExpired() {
        return this.expiresAt > 0 && Date.now() > this.expiresAt;
    }
}

class LRUCache {
    constructor(capacity = 100, defaultTTL = 60) {
        this.capacity = capacity;
        this.defaultTTL = defaultTTL; // seconds
        this.map = new Map();
        this.totalBytes = 0;

        // Stats counters
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            expirations: 0,
            totalSets: 0,
        };

        // Doubly linked list — head = most recent, tail = least recent
        this.head = new Node('__head__', null);
        this.tail = new Node('__tail__', null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    _removeNode(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    _addToFront(node) {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next.prev = node;
        this.head.next = node;
    }

    _evictLRU() {
        const lru = this.tail.prev;
        if (lru === this.head) return; // empty
        this._removeNode(lru);
        this.map.delete(lru.key);
        this.totalBytes -= lru.byteSize;
        this.stats.evictions++;
    }

    get(key) {
        if (!this.map.has(key)) {
            this.stats.misses++;
            return null;
        }

        const node = this.map.get(key);

        // Check TTL expiration
        if (node.isExpired()) {
            this._removeNode(node);
            this.map.delete(key);
            this.totalBytes -= node.byteSize;
            this.stats.expirations++;
            this.stats.misses++;
            return null;
        }

        // Move to front (most recently used)
        this._removeNode(node);
        this._addToFront(node);
        this.stats.hits++;
        return node.value;
    }

    put(key, value, ttl = this.defaultTTL) {
        this.stats.totalSets++;

        if (this.map.has(key)) {
            // Update existing node
            const node = this.map.get(key);
            this.totalBytes -= node.byteSize;
            node.value = value;
            node.expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : 0;
            node.byteSize = Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value), 'utf8');
            this.totalBytes += node.byteSize;
            this._removeNode(node);
            this._addToFront(node);
        } else {
            // Insert new node
            const newNode = new Node(key, value, ttl);
            this.map.set(key, newNode);
            this._addToFront(newNode);
            this.totalBytes += newNode.byteSize;

            // Evict LRU if over capacity
            if (this.map.size > this.capacity) {
                this._evictLRU();
            }
        }
    }

    delete(key) {
        if (!this.map.has(key)) return false;
        const node = this.map.get(key);
        this._removeNode(node);
        this.map.delete(key);
        this.totalBytes -= node.byteSize;
        return true;
    }

    clear() {
        this.map.clear();
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.totalBytes = 0;
    }

    // Returns ordered list of cache entries (most recent first)
    getEntries() {
        const entries = [];
        let current = this.head.next;
        while (current !== this.tail) {
            entries.push({
                key: current.key,
                size: current.byteSize,
                expiresAt: current.expiresAt,
                ttlRemaining: current.expiresAt > 0 ? Math.max(0, Math.ceil((current.expiresAt - Date.now()) / 1000)) : null,
                expired: current.isExpired(),
            });
            current = current.next;
        }
        return entries;
    }

    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            size: this.map.size,
            capacity: this.capacity,
            totalBytes: this.totalBytes,
            totalBytesMB: (this.totalBytes / 1024 / 1024).toFixed(3),
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            expirations: this.stats.expirations,
            hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00',
        };
    }
}

// Singleton in-memory LRU cache instance — capacity 200, default TTL 60s
const memoryCache = new LRUCache(200, 60);

module.exports = { LRUCache, memoryCache };
