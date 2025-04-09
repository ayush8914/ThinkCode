import { Redis } from 'ioredis';
import { CONFIG } from './config.js';

export const redis = new Redis({
  host: CONFIG.redis.host,
  port: CONFIG.redis.port,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

export const redisUtils = {
  async checkRateLimit(userId: string, limit: number, windowSec: number): Promise<{
    allowed: boolean;
    current: number;
    remaining: number;
  }> {
    const key = `rate:submit:${userId}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSec);
    }
    
    return {
      allowed: current <= limit,
      current,
      remaining: Math.max(0, limit - current),
    };
  },
  
  async pushToQueue(task: any): Promise<void> {
    await redis.lpush('judge:queue', JSON.stringify(task));
  },
  
  async getQueueLength(): Promise<number> {
    return await redis.llen('judge:queue');
  },
  
  async publishResult(userId: string, result: any): Promise<void> {
    await redis.publish(`user:${userId}:submissions`, JSON.stringify(result));
  },
};