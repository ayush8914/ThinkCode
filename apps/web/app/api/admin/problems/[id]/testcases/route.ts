import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const testCases = await prisma.testCase.findMany({
      where: { problemId: id },
      orderBy: { orderIndex: 'asc' },
    });
    
    return NextResponse.json({ success: true, testCases });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch test cases' }, { status: 500 });
  }
}

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
    const { input, output, isSample, explanation } = await request.json();
    
    const maxOrder = await prisma.testCase.aggregate({
      where: { problemId: id },
      _max: { orderIndex: true },
    });
    
    const testCase = await prisma.testCase.create({
      data: {
        problemId: id,
        input,
        output,
        isSample: isSample || false,
        explanation,
        orderIndex: (maxOrder._max.orderIndex || -1) + 1,
      },
    });
    
    return NextResponse.json({ success: true, testCase });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create test case' }, { status: 500 });
  }
}