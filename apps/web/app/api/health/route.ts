import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      data: {
        service: 'web',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Service unhealthy',
    }, { status: 503 });
  }
}