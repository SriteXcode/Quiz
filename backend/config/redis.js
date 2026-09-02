const Redis = require('ioredis');

const REDIS_URI = process.env.REDIS_URI || 'redis://127.0.0.1:6379';

let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(REDIS_URI, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 3000,
    lazyConnect: false,
    retryStrategy: (times) => {
      if (times > 3) return null; // Stop retrying after 3 attempts and fallback to DB
      return Math.min(times * 200, 1000);
    }
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Redis Connected]: In-memory cache engine active.');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
  });

  redisClient.on('error', () => {
    isRedisConnected = false;
    // Suppress error spam when Redis server is offline
  });
} catch (err) {
  isRedisConnected = false;
  console.warn('[Redis Init Warning]: Redis unavailable, using direct DB mode.', err.message);
}

const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 60) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch {
    return false;
  }
};

const deleteCacheByPattern = async (pattern) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  redisClient,
  getCache,
  setCache,
  deleteCacheByPattern,
  isRedisActive: () => isRedisConnected
};
