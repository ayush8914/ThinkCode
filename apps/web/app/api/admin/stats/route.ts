import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const [
      totalUsers,
      totalProblems,
      totalSubmissions,
      pendingSubmissions,
      usersByRole,
      submissionsByStatus,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.problem.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'PENDING' } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.submission.groupBy({ by: ['status'], _count: true }),
      prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { 
          user: { select: { name: true, email: true } }, 
          problem: { select: { title: true } } 
        },
      }),
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySubmissions = await prisma.submission.count({
      where: { createdAt: { gte: today } },
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalProblems,
        totalSubmissions,
        pendingSubmissions,
        todaySubmissions,
        usersByRole,
        submissionsByStatus,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}