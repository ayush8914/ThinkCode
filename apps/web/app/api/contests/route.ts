import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const admin = searchParams.get('admin') === 'true';
    
    if (admin) {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const contests = await prisma.contest.findMany({
        include: { divisions: true, _count: { select: { problems: true, participants: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, contests });
    }
    
    const now = new Date();
    let where: any = { isPublic: true };
    if (status === 'upcoming') where.startTime = { gt: now };
    else if (status === 'live') { where.startTime = { lte: now }; where.endTime = { gt: now }; }
    else if (status === 'past') where.endTime = { lt: now };
    
    const contests = await prisma.contest.findMany({
      where, include: { divisions: true, _count: { select: { participants: true } } },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json({ success: true, contests });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { title, slug, description, contestName, contestType, startTime, endTime, selectedDivisions } = await request.json();
    const existing = await prisma.contest.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    
    const contest = await prisma.$transaction(async (tx) => {
      const c = await tx.contest.create({ data: { title, slug, description, contestName, contestType, startTime: new Date(startTime), endTime: new Date(endTime), isPublic: true } });
      if (selectedDivisions?.length) {
        await tx.contestDivision.createMany({ data: selectedDivisions.map((d: string) => ({ contestId: c.id, division: d as any })) });
      }
      return c;
    });
    return NextResponse.json({ success: true, contest });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
  }
}