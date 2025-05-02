import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const { problemId, orderIndex, visibleToDivisions } = await request.json();
    
    const existing = await prisma.contestProblem.findFirst({
      where: { contestId: id, problemId },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Problem already assigned' }, { status: 400 });
    }
    
    const contestProblem = await prisma.contestProblem.create({
      data: {
        contestId: id,
        problemId,
        orderIndex: orderIndex || 1,
        visibleToDivisions: visibleToDivisions || ['DIV1', 'DIV2', 'DIV3', 'DIV4'],
      },
      include: { problem: true },
    });
    
    return NextResponse.json({ success: true, contestProblem });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add problem' }, { status: 500 });
  }
}