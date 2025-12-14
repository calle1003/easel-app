import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { ticketCode } = await request.json();

    if (!ticketCode) {
      return NextResponse.json(
        { error: 'Ticket code is required' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: { order: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'チケットが見つかりません' },
        { status: 404 }
      );
    }

    if (ticket.isUsed) {
      return NextResponse.json(
        { success: false, error: 'このチケットは既に使用済みです' },
        { status: 400 }
      );
    }

    if (ticket.order.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: 'このチケットは有効ではありません' },
        { status: 400 }
      );
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '入場処理が完了しました',
    });
  } catch (error) {
    console.error('Failed to check in ticket:', error);
    return NextResponse.json(
      { error: 'Failed to check in ticket' },
      { status: 500 }
    );
  }
}
