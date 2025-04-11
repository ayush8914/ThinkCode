import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment-specific file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const ConfigSchema = z.object({
  PORT: z.string().default('3001'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
});

const config = ConfigSchema.parse(process.env);

export const CONFIG = {
  port: parseInt(config.PORT),
  redis: {
    host: config.REDIS_HOST,
    port: parseInt(config.REDIS_PORT),
  },
  database: {
    url: config.DATABASE_URL,
  },
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
} as const;

export type Config = typeof CONFIG;