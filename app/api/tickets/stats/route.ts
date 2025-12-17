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
    const total = await prisma.ticket.count();
    const used = await prisma.ticket.count({ where: { isUsed: true } });
    const unused = total - used;
    const general = await prisma.ticket.count({ where: { ticketType: 'GENERAL' } });
    const reserved = await prisma.ticket.count({ where: { ticketType: 'RESERVED' } });

    return NextResponse.json({
      total,
      used,
      unused,
      general,
      reserved,
    });
  } catch (error) {
    logger.error('Failed to fetch ticket stats', { error });
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
