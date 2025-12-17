import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    return NextResponse.json(news);
  } catch (error) {
    logger.error('Failed to fetch news', { error });
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const body = await request.json();
    const news = await prisma.news.create({
      data: {
        title: body.title,
        content: body.content,
        publishedAt: new Date(body.publishedAt || Date.now()),
        category: body.category,
      },
    });
    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    logger.error('Failed to create news', { error });
    return NextResponse.json(
      { error: 'Failed to create news' },
      { status: 500 }
    );
  }
}
