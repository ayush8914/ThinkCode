import { Router, Request, Response } from 'express';
import { prisma } from '@repo/db';

const router = Router();

// Get all problems
router.get('/problems', async (req: Request, res: Response) => {
  try {
    const { difficulty, tags, search, limit = '50', offset = '0' } = req.query;
    
    const where: any = {
      isPublic: true,
    };
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (tags) {
      const tagList = (tags as string).split(',');
      where.tags = {
        some: {
          tag: {
            name: { in: tagList },
          },
        },
      };
    }
    
    const problems = await prisma.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        createdAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });
    
    const total = await prisma.problem.count({ where });
    
    res.json({
      success: true,
      data: {
        problems: problems.map(p => ({
          ...p,
          tags: p.tags.map(t => t.tag),
        })),
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
    
  } catch (error) {
    console.error('Fetch problems error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get single problem
router.get('/problems/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        difficulty: true,
        timeLimitMs: true,
        memoryLimitKb: true,
        createdAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        testCases: {
          where: { isSample: true },
          select: {
            id: true,
            input: true,
            output: true,
            explanation: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        ...problem,
        tags: problem.tags.map(t => t.tag),
      },
    });
    
  } catch (error) {
    console.error('Fetch problem error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get all tags
router.get('/tags', async (_req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            problems: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    res.json({
      success: true,
      data: tags,
    });
    
  } catch (error) {
    console.error('Fetch tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;