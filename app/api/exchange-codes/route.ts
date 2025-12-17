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
    const codes = await prisma.exchangeCode.findMany({
      orderBy: [
        {
          performer: {
            nameKana: 'asc',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            nameKana: true,
          },
        },
        performanceSession: {
          select: {
            id: true,
            showNumber: true,
            performanceDate: true,
            performanceTime: true,
            venueName: true,
          },
        },
      },
    });

    // 来場情報を取得
    const codesWithAttendance = await Promise.all(
      codes.map(async (code) => {
        if (code.orderId) {
          // 注文に紐づくチケットを取得
          const tickets = await prisma.ticket.findMany({
            where: { orderId: code.orderId },
          });

          // いずれかのチケットが使用済みなら来場済み
          const hasAttended = tickets.some((t) => t.isUsed);
          const attendedAt = tickets.find((t) => t.usedAt)?.usedAt || null;

          return {
            ...code,
            hasAttended,
            attendedAt,
          };
        }
        return {
          ...code,
          hasAttended: false,
          attendedAt: null,
        };
      })
    );

    return NextResponse.json(codesWithAttendance);
  } catch (error) {
    logger.error('Failed to fetch exchange codes', { error });
    return NextResponse.json(
      { error: 'Failed to fetch exchange codes' },
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
    const { code, performerId, performanceSessionId } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!performerId) {
      return NextResponse.json({ error: 'Performer is required' }, { status: 400 });
    }

    const normalizedCode = code.trim().toLowerCase();

    // Check if code already exists
    const existingCode = await prisma.exchangeCode.findUnique({
      where: { code: normalizedCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'このコードは既に登録されています' },
        { status: 400 }
      );
    }

    // Get performer name for backward compatibility
    const performer = await prisma.performer.findUnique({
      where: { id: parseInt(performerId) },
    });

    if (!performer) {
      return NextResponse.json(
        { error: '出演者が見つかりません' },
        { status: 400 }
      );
    }

    const exchangeCode = await prisma.exchangeCode.create({
      data: {
        code: normalizedCode,
        performerId: parseInt(performerId),
        performerName: performer.name,
        performanceSessionId: performanceSessionId ? parseInt(performanceSessionId) : null,
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            nameKana: true,
          },
        },
        performanceSession: {
          select: {
            id: true,
            showNumber: true,
            performanceDate: true,
            performanceTime: true,
            venueName: true,
          },
        },
      },
    });

    return NextResponse.json(exchangeCode, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このコードは既に存在します' },
        { status: 400 }
      );
    }
    logger.error('Failed to create exchange code', { error });
    return NextResponse.json(
      { error: 'Failed to create exchange code' },
      { status: 500 }
    );
  }
}
