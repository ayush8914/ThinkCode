import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const difficulty = searchParams.get('difficulty') || undefined;
    const tag = searchParams.get('tag') || undefined;
    
    const where: any = { isPublic: true };
    if (difficulty) where.difficulty = difficulty;
    if (tag) {
      where.tags = { some: { tag: { name: tag } } };
    }
    
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: {
            select: {
              tag: { select: { id: true, name: true } }
            }
          },
          _count: { select: { submissions: true } },
          ...(session?.user?.id && {
            submissions: {
              where: { userId: session.user.id },
              select: { status: true },
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          })
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.problem.count({ where })
    ]);
    
    const problemsWithStatus = problems.map(problem => {
      const { submissions, ...rest } = problem;
      let userStatus = 'NONE';
      
      if (submissions?.length) {
        const hasSolved = submissions.some(s => s.status === 'ACCEPTED');
        userStatus = hasSolved ? 'SOLVED' : 'ATTEMPTED';
      }
      
      return { ...rest, userStatus };
    });
    
    return NextResponse.json({
      success: true,
      problems: problemsWithStatus,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
    
  } catch (error) {
    console.error('Failed to fetch problems:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problems' },
      { status: 500 }
    );
  }
}