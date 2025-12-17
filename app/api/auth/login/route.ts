import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { authenticated: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Rate Limiting: メールアドレスベースで1分に5回まで
    const rateLimitResult = checkRateLimit(`login:${email}`, {
      maxRequests: 5,
      windowMs: 60000, // 1分
    });

    if (!rateLimitResult.allowed) {
      logger.warn('Login rate limit exceeded', {
        email,
        retryAfter: rateLimitResult.retryAfter,
      });

      return NextResponse.json(
        {
          authenticated: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      );
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!adminUser) {
      logger.warn('Login attempt with non-existent email', { email });
      return NextResponse.json(
        { authenticated: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, adminUser.password);

    if (!isValid) {
      logger.warn('Login attempt with invalid password', {
        email,
        userId: adminUser.id,
      });
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

    logger.info('Successful login', {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    return NextResponse.json(
      {
        authenticated: true,
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining - 1),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        },
      }
    );
  } catch (error) {
    logger.error('Login error', { error });
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
