export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getUserActivity, getActivityStats } from '@/lib/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const [activities, stats] = await Promise.all([
      getUserActivity(userId),
      getActivityStats(userId),
    ]);
    
    return NextResponse.json({
      success: true,
      activities,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}