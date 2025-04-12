import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import bcrypt from 'bcryptjs';


export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        name,
        role: 'USER',
      }
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}