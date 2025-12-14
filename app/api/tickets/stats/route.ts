import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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
    console.error('Failed to fetch ticket stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
