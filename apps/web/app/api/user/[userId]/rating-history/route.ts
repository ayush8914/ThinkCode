import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const ratingChanges = await prisma.ratingChange.findMany({
      where: { userId },
      include: {
        contest: { select: { title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    if (ratingChanges.length > 0) {
      // Transform to expected format
      const history = ratingChanges.map(rc => ({
        rating: rc.newRating,        // Changed from newRating to rating
        change: rc.change,
        createdAt: rc.createdAt.toISOString(),
        contest: rc.contest,
        rank: rc.rank,
      }));
      
      console.log('Sending history:', history); // DEBUG
      return NextResponse.json({ success: true, history });
    }
    
    // Return mock data if no history
    const mockHistory = [
      { rating: 800, change: 0, createdAt: new Date().toISOString(), contest: null },
    ];
    
    return NextResponse.json({ success: true, history: mockHistory });
    
  } catch (error) {
    console.error('Failed to fetch rating history:', error);
    
    const mockHistory = [
      { rating: 800, change: 0, createdAt: new Date().toISOString(), contest: null },
    ];
    
    return NextResponse.json({ success: true, history: mockHistory });
  }
}