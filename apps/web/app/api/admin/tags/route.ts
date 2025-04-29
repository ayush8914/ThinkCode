import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: { select: { problems: true } },
      },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json({ success: true, tags });
  } catch (error) {
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