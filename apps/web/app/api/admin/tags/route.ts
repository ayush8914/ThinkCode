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
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const whereClause = search 
      ? `WHERE "name" ILIKE '%${search}%'`
      : '';
    
    const orderClause = sort === 'problems'
      ? `ORDER BY problem_count ${order.toUpperCase()}`
      : `ORDER BY "name" ${order.toUpperCase()}`;
    
    const query = `
      SELECT 
        t.*,
        COUNT(pt."problemId") as problem_count
      FROM tags t
      LEFT JOIN problem_tags pt ON pt."tagId" = t.id
      ${whereClause}
      GROUP BY t.id
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tags t
      ${whereClause}
    `;
    
    const tags = await prisma.$queryRawUnsafe(query) as any[];
    const countResult = await prisma.$queryRawUnsafe(countQuery) as any[];
    const total = parseInt(countResult[0]?.total || '0');
    
    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      _count: { problems: parseInt(tag.problem_count) || 0 },
    }));
    
    return NextResponse.json({ success: true, tags: formattedTags, total });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }
    
    const existing = await prisma.tag.findUnique({
      where: { name: name.trim() },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
    }
    
    const tag = await prisma.tag.create({
      data: { name: name.trim() },
    });
    
    return NextResponse.json({ success: true, tag });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}