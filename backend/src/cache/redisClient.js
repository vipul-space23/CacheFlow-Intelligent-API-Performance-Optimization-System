const redis = require('redis');

const client = redis.createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));

let isConnected = false;

const connectRedis = async () => {
    if (!isConnected) {
        try {
            await client.connect();
            isConnected = true;
            console.log('Connected to Redis');
        } catch (err) {
            console.error('Failed to connect to Redis. Running without L2 Cache (Redis). Falling back to L1 LRU Cache only.');
        }
    }
};

module.exports = {
    client,
    connectRedis
};
