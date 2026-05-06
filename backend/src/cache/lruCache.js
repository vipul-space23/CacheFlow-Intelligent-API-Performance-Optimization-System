class Node {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}

class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.map = new Map();
        
        // Dummy head and tail to simplify edge cases
        this.head = new Node(-1, -1);
        this.tail = new Node(-1, -1);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    _removeNode(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    _addNodeToHead(node) {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next.prev = node;
        this.head.next = node;
    }

    get(key) {
        if (this.map.has(key)) {
            const node = this.map.get(key);
            // Move to head (most recently used)
            this._removeNode(node);
            this._addNodeToHead(node);
            return node.value;
        }
        return null;
    }

    put(key, value) {
        if (this.map.has(key)) {
            const node = this.map.get(key);
            node.value = value;
            this._removeNode(node);
            this._addNodeToHead(node);
        } else {
            const newNode = new Node(key, value);
            this.map.set(key, newNode);
            this._addNodeToHead(newNode);

            if (this.map.size > this.capacity) {
                // Remove LRU from tail
                const tailPrev = this.tail.prev;
                this._removeNode(tailPrev);
                this.map.delete(tailPrev.key);
            }
        }
    }
    
    // Helper to get stats
    size() {
        return this.map.size;
    }
}

// Singleton instance with capacity 100
const memoryCache = new LRUCache(100);

module.exports = { LRUCache, memoryCache };
