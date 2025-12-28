import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkedInToday = await prisma.ticket.findMany({
      where: {
        isUsed: true,
        usedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // チケット種別ごとに集計
    const generalCheckedIn = checkedInToday.filter(t => t.ticketType === 'GENERAL').length;
    const reservedCheckedIn = checkedInToday.filter(t => t.ticketType === 'RESERVED').length;
    const vip1CheckedIn = checkedInToday.filter(t => t.ticketType === 'VIP1').length;
    const vip2CheckedIn = checkedInToday.filter(t => t.ticketType === 'VIP2').length;

    return NextResponse.json({
      totalCheckedIn: checkedInToday.length,
      generalCheckedIn,
      reservedCheckedIn,
      vip1CheckedIn,
      vip2CheckedIn,
    });
  } catch (error) {
    console.error('Failed to fetch today stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
