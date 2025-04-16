import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        language: true,
        createdAt: true,
        executionTimeMs: true,
        problem: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      submissions,
    });

  } catch (error) {
    console.error('Failed to fetch recent submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}