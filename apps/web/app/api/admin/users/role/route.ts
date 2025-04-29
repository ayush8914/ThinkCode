import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@repo/db';

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Only ADMIN can change roles
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { userId, role } = await request.json();
    
    const validRoles = ['USER', 'PROBLEM_SETTER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    
    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
    
  } catch (error) {
    console.error('Failed to update user role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' }, 
      { status: 500 }
    );
  }
}