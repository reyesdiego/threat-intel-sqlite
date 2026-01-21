import Redis from 'ioredis';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
};

// Create Redis client instance
const redis = new Redis(redisConfig);

// Handle connection events
redis.on('connect', () => {
    console.log('[Redis] Connecting...');
});

redis.on('ready', () => {
    console.log('[Redis] Connected and ready');
});

redis.on('error', (err) => {
    console.error('[Redis] Error:', err);
});

redis.on('close', () => {
    console.log('[Redis] Connection closed');
});

redis.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[Redis] Closing connection...');
    await redis.quit();
});

process.on('SIGINT', async () => {
    console.log('[Redis] Closing connection...');
    await redis.quit();
});

export default redis;
