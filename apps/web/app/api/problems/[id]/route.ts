import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'PROBLEM_SETTER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const { 
      title, 
      slug, 
      description, 
      difficulty, 
      timeLimitMs, 
      memoryLimitKb, 
      isPublic, 
      testCases, 
      tags 
    } = await request.json();
    
    const existing = await prisma.problem.findFirst({
      where: { 
        slug, 
        id: { not: id } 
      },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.problem.update({
        where: { id },
        data: {
          title,
          slug,
          description,
          difficulty,
          timeLimitMs,
          memoryLimitKb,
          isPublic,
          tags: { deleteMany: {} },
        },
      });
      
      if (tags && tags.length > 0) {
        await tx.problem.update({
          where: { id },
          data: {
            tags: {
              create: tags.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            },
          },
        });
      }
      
      const existingTestCaseIds = testCases
        .filter((tc: any) => tc.id && !tc.id.startsWith('temp-'))
        .map((tc: any) => tc.id);
      
      await tx.testCase.deleteMany({
        where: {
          problemId: id,
          NOT: { id: { in: existingTestCaseIds } },
        },
      });
      
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        if (tc.id && !tc.id.startsWith('temp-')) {
          await tx.testCase.update({
            where: { id: tc.id },
            data: {
              input: tc.input,
              output: tc.output,
              isSample: tc.isSample || false,
              explanation: tc.explanation || null,
              orderIndex: i,
            },
          });
        } else {
          await tx.testCase.create({
            data: {
              problemId: id,
              input: tc.input,
              output: tc.output,
              isSample: tc.isSample || false,
              explanation: tc.explanation || null,
              orderIndex: i,
            },
          });
        }
      }
    });
    
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('Failed to update problem:', error);
    return NextResponse.json({ error: 'Failed to update problem' }, { status: 500 });
  }
}