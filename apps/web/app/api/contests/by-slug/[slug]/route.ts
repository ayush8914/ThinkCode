import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: {
        divisions: true,
        problems: {
          include: { problem: true },
          orderBy: { orderIndex: 'asc' },
        },
        participants: {
          include: { user: { select: { id: true, name: true, contestRating: true } } },
          orderBy: [{ score: 'desc' }, { penalty: 'asc' }],
        },
      },
    });
    
    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, contest });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contest' }, { status: 500 });
  }
}