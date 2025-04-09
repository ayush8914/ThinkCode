import express, { Request, Response } from 'express';
import cors from 'cors';
import { CONFIG } from './config.js';
import { redis } from './redis.js';
import { prisma } from '@repo/db';
import submissionRoutes from './routes/submission.js';
import problemRoutes from './routes/problem.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check Redis
    await redis.ping();
    
    // Check Database
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      data: {
        service: 'judge-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: CONFIG.isProduction ? 'production' : 'development',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service unhealthy',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api', submissionRoutes);
app.use('/api', problemRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: CONFIG.isDevelopment ? err.message : undefined,
  });
});

// Start server
const server = app.listen(CONFIG.port, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 Judge API Server Started        ║
╠════════════════════════════════════════╣
║  Port: ${CONFIG.port}                          
║  Environment: ${CONFIG.isProduction ? 'production' : 'development'}                 
║  Redis: ${CONFIG.redis.host}:${CONFIG.redis.port}                     
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await redis.quit();
      console.log('Redis connection closed');
      
      await prisma.$disconnect();
      console.log('Database connection closed');
      
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;