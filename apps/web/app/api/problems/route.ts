import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';

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