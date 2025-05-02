import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { getDivisionFromRating } from '@/lib/division';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { slug } = await params;
    
    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: { divisions: true },
    });
    
    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }
    
    if (new Date() > contest.startTime) {
      return NextResponse.json({ error: 'Contest has already started' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { contestRating: true },
    });
    
    const userRating = user?.contestRating || 800;
    const division = getDivisionFromRating(userRating);
    
    const hasDivision = contest.divisions.some(d => d.division === division);
    if (!hasDivision) {
      return NextResponse.json({ error: `Division ${division} not available` }, { status: 400 });
    }
    
    const participant = await prisma.contestParticipant.create({
      data: {
        contestId: contest.id,
        userId: session.user.id,
        division: division as any,
      },
    });
    
    return NextResponse.json({ success: true, participant, division });
    
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}