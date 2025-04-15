import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}