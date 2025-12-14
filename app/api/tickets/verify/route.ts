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
      include: {
        order: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({
        valid: false,
        error: 'チケットが見つかりません',
      });
    }

    if (ticket.isUsed) {
      return NextResponse.json({
        valid: false,
        error: 'このチケットは既に使用済みです',
        used: true,
      });
    }

    if (ticket.order.status !== 'PAID') {
      return NextResponse.json({
        valid: false,
        error: 'このチケットは有効ではありません',
      });
    }

    return NextResponse.json({
      valid: true,
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        ticketType: ticket.ticketType,
        order: {
          customerName: ticket.order.customerName,
          performanceLabel: ticket.order.performanceLabel,
        },
      },
    });
  } catch (error) {
    console.error('Failed to verify ticket:', error);
    return NextResponse.json(
      { error: 'Failed to verify ticket' },
      { status: 500 }
    );
  }
}
