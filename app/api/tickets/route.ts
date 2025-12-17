import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            performanceLabel: true,
            performanceDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    logger.error('Failed to fetch tickets', { error });
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
