import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('PUT /api/problems/[id] called');
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'PROBLEM_SETTER')) {
    console.log('Unauthorized, role:', session?.user?.role);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('Updating problem:', id, body);
    
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
    } = body;
    
    // Check if slug already exists on another problem
    const existing = await prisma.problem.findFirst({
      where: { 
        slug, 
        id: { not: id } 
      },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    
    // Update problem basic info
    await prisma.problem.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        difficulty,
        timeLimitMs,
        memoryLimitKb,
        isPublic,
      },
    });
    
    // Update tags if provided
    if (tags && tags.length > 0) {
      await prisma.problemTag.deleteMany({ where: { problemId: id } });
      
      for (const tagId of tags) {
        await prisma.problemTag.create({
          data: {
            problemId: id,
            tagId: tagId,
          },
        });
      }
    }
    
    // Update test cases if provided
    if (testCases && testCases.length > 0) {
      // Delete existing test cases
      await prisma.testCase.deleteMany({ where: { problemId: id } });
      
      // Create new test cases
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        await prisma.testCase.create({
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
    
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('Failed to update problem:', error);
    return NextResponse.json({ error: 'Failed to update problem' }, { status: 500 });
  }
}