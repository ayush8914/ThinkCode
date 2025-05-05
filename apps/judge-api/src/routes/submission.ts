import { Router, Request, Response } from 'express';
import { prisma, Language, Status } from '@repo/db';
import { redis, redisUtils } from '../redis.js';
import { SubmitCodeSchema, JudgeTask } from '../types.js';

const router = Router();

// Submit code
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const validation = SubmitCodeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.error.message,
      });
    }
    
    const { userId, problemId, code, language } = validation.data;
    
    // Rate limiting
    const rateLimit = await redisUtils.checkRateLimit(userId, 5, 10);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Maximum 5 submissions per 10 seconds. Try again in a few seconds.`,
        rateLimit,
      });
    }
    
    // Check if problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, title: true, timeLimitMs: true, memoryLimitKb: true },
    });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found',
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    // Create submission
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language: language as Language,
        status: 'PENDING',
        contestId: req.body.contestId || null,
      },
    });
    
    // Prepare task for queue
    const task: JudgeTask = {
      submissionId: submission.id,
      problemId,
      userId,
      code,
      language: language as Language,
      timestamp: Date.now(),
      contestId : req.body.contestId || null,
    };
    
    // Push to queue
    await redisUtils.pushToQueue(task);
    
    // Get queue position
    const queueLength = await redisUtils.getQueueLength();
    
    res.status(202).json({
      success: true,
      data: {
        submissionId: submission.id,
        status: 'PENDING',
        queuePosition: queueLength,
        createdAt: submission.createdAt,
      },
      message: 'Submission queued successfully',
    });
    
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get submission status
router.get('/submission/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        executionTimeMs: true,
        memoryUsedKb: true,
        errorMessage: true,
        failedTestCaseIndex: true,
        createdAt: true,
        judgedAt: true,
        code: true,
        language: true,
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            timeLimitMs: true,
            memoryLimitKb: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }
    
    res.json({
      success: true,
      data: submission,
    });
    
  } catch (error) {
    console.error('Fetch submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get user submissions
router.get('/submissions/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;
    
    const submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });
    
    const total = await prisma.submission.count({
      where: { userId },
    });
    
    res.json({
      success: true,
      data: {
        submissions,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
    
  } catch (error) {
    console.error('Fetch user submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get queue status
router.get('/queue/status', async (_req: Request, res: Response) => {
  try {
    const queueLength = await redisUtils.getQueueLength();
    const processingCount = await prisma.submission.count({
      where: { status: 'PROCESSING' },
    });
    const pendingCount = await prisma.submission.count({
      where: { status: 'PENDING' },
    });
    
    res.json({
      success: true,
      data: {
        queueLength,
        processingCount,
        pendingCount,
        status: queueLength > 50 ? 'busy' : queueLength > 20 ? 'moderate' : 'normal',
      },
    });
    
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;