import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const tag = searchParams.get('tag') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (tag) {
      where.tags = {
        some: {
          tag: { name: tag },
        },
      };
    }
    
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          _count: { select: { submissions: true, testCases: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.problem.count({ where }),
    ]);
    
    return NextResponse.json({ success: true, problems, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 });
  }
}