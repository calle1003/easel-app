import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketCode: string }> }
) {
  try {
    const { ticketCode } = await params;

    if (!ticketCode || ticketCode.trim() === '') {
      return NextResponse.json(
        { found: false, error: 'チケットコードが指定されていません' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            performanceLabel: true,
            performanceDate: true,
            status: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({
        found: false,
        error: 'チケットが見つかりません',
      });
    }

    return NextResponse.json({
      found: true,
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        ticketType: ticket.ticketType,
        isExchanged: ticket.isExchanged,
        isUsed: ticket.isUsed,
        usedAt: ticket.usedAt,
        createdAt: ticket.createdAt,
        order: ticket.order,
      },
    });
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    return NextResponse.json(
      { found: false, error: 'チケット情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
