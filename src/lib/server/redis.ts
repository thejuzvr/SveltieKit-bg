import 'dotenv/config';
import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
	if (!redisClient) {
		redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
			maxRetriesPerRequest: null,
			retryStrategy: (times) => Math.min(times * 50, 2000),
			lazyConnect: false
		});

		redisClient.on('error', (err) => {
			console.error('[Redis] Connection error:', err.message);
		});

		redisClient.on('connect', () => {
			console.log('[Redis] Connected');
		});
	}
	return redisClient;
}

export function createRedisClient(): Redis {
	return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
		maxRetriesPerRequest: null,
		retryStrategy: (times) => Math.min(times * 50, 2000)
	});
}

export async function closeRedis(): Promise<void> {
	if (redisClient) {
		await redisClient.quit();
		redisClient = null;
	}
}
