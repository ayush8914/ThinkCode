import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const difficulty = searchParams.get('difficulty') || undefined;
    const search = searchParams.get('search') || undefined;
    const tags = searchParams.get('tags') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {
      isPublic: true,
    };
    
    // If slug is provided, return single problem
    if (slug) {
      const problem = await prisma.problem.findUnique({
        where: { slug },
        include: {
          tags: {
            include: { tag: true },
          },
          testCases: {
            where: { isSample: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });
      
      if (!problem) {
        return NextResponse.json(
          { success: false, error: 'Problem not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        problems: [problem],
        total: 1,
      });
    }
    
    // Regular filters for list view
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (tags) {
      const tagList = tags.split(',');
      where.tags = {
        some: {
          tag: {
            name: { in: tagList },
          },
        },
      };
    }
    
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
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
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.problem.count({ where }),
    ]);
    
    const formattedProblems = problems.map(p => ({
      ...p,
      tags: p.tags.map(t => t.tag),
    }));
    
    return NextResponse.json({
      success: true,
      problems: formattedProblems,
      total,
      limit,
      offset,
    });
    
  } catch (error) {
    console.error('Failed to fetch problems:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problems' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Only ADMIN and PROBLEM_SETTER can create problems
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'PROBLEM_SETTER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { 
      title, 
      slug, 
      description, 
      difficulty, 
      timeLimitMs, 
      memoryLimitKb, 
      isPublic, 
      testCases, 
      tags 
    } = body;
    
    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }
    
    // Check if slug already exists
    const existing = await prisma.problem.findUnique({
      where: { slug },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    
    // Create problem with test cases and tags in a transaction
    const problem = await prisma.$transaction(async (tx) => {
      // Create the problem
      const newProblem = await tx.problem.create({
        data: {
          title,
          slug,
          description: description || '',
          difficulty: difficulty || 'EASY',
          timeLimitMs: timeLimitMs || 1000,
          memoryLimitKb: memoryLimitKb || 262144,
          isPublic: isPublic ?? true,
        },
      });
      
      // Add tags if provided
      if (tags && tags.length > 0) {
        for (const tagId of tags) {
          await tx.problemTag.create({
            data: {
              problemId: newProblem.id,
              tagId: tagId,
            },
          });
        }
      }
      
      // Add test cases if provided
      if (testCases && testCases.length > 0) {
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          await tx.testCase.create({
            data: {
              problemId: newProblem.id,
              input: tc.input,
              output: tc.output,
              isSample: tc.isSample || false,
              explanation: tc.explanation || null,
              orderIndex: i,
            },
          });
        }
      }
      
      return newProblem;
    });
    
    return NextResponse.json({ 
      success: true, 
      problem: { id: problem.id, slug: problem.slug },
      slug: problem.slug,
    });
    
  } catch (error) {
    console.error('Failed to create problem:', error);
    return NextResponse.json({ error: 'Failed to create problem' }, { status: 500 });
  }
}