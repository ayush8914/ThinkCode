import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testCaseId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { testCaseId } = await params;
    const { input, output, isSample, explanation } = await request.json();
    
    const testCase = await prisma.testCase.update({
      where: { id: testCaseId },
      data: { input, output, isSample, explanation },
    });
    
    return NextResponse.json({ success: true, testCase });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update test case' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testCaseId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { testCaseId } = await params;
    await prisma.testCase.delete({ where: { id: testCaseId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete test case' }, { status: 500 });
  }
}