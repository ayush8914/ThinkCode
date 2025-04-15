import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get total problems solved (unique problems with ACCEPTED status)
    const solvedProblems = await prisma.submission.groupBy({
      by: ['problemId'],
      where: {
        userId,
        status: 'ACCEPTED',
      },
    });

    // Get weekly solved count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklySolved = await prisma.submission.groupBy({
      by: ['problemId'],
      where: {
        userId,
        status: 'ACCEPTED',
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Get current streak (simplified - can be enhanced)
    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        status: 'ACCEPTED',
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      distinct: ['createdAt'],
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const sub of submissions) {
      const subDate = new Date(sub.createdAt);
      subDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - subDate.getTime()) / 86400000);
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        problemsSolved: solvedProblems.length,
        weeklySolved: weeklySolved.length,
        currentStreak: streak,
        contestRating: null,
        globalRank: null,
      },
    });

  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}