import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { authenticated: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!adminUser) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, adminUser.password);

    if (!isValid) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 最終ログイン時刻を更新
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    return NextResponse.json({
      authenticated: true,
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
