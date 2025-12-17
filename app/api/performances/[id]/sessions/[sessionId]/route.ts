import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const { id, sessionId } = await params;
    const performanceId = parseInt(id);
    const sessionIdNum = parseInt(sessionId);
    const body = await request.json();

    if (isNaN(performanceId) || isNaN(sessionIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const session = await prisma.performanceSession.update({
      where: { id: sessionIdNum },
      data: {
        showNumber: body.showNumber,
        performanceDate: body.performanceDate
          ? new Date(body.performanceDate)
          : undefined,
        performanceTime: body.performanceTime
          ? new Date(`1970-01-01T${body.performanceTime}`)
          : undefined,
        doorsOpenTime: body.doorsOpenTime
          ? new Date(`1970-01-01T${body.doorsOpenTime}`)
          : undefined,
        venueName: body.venueName,
        venueAddress: body.venueAddress,
        venueAccess: body.venueAccess,
        generalCapacity: body.generalCapacity,
        reservedCapacity: body.reservedCapacity,
        vip1Capacity: body.vip1Capacity !== undefined ? body.vip1Capacity : undefined,
        vip2Capacity: body.vip2Capacity !== undefined ? body.vip2Capacity : undefined,
        saleStatus: body.saleStatus,
        saleStartAt: body.saleStartAt ? new Date(body.saleStartAt) : undefined,
        saleEndAt: body.saleEndAt ? new Date(body.saleEndAt) : undefined,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    logger.error('Failed to update session', { error });
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const { id, sessionId } = await params;
    const performanceId = parseInt(id);
    const sessionIdNum = parseInt(sessionId);

    if (isNaN(performanceId) || isNaN(sessionIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.performanceSession.delete({
      where: { id: sessionIdNum },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete session', { error });
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
