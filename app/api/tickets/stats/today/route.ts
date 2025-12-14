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

    return NextResponse.json({
      count: checkedInToday.length,
      tickets: checkedInToday,
    });
  } catch (error) {
    console.error('Failed to fetch today stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
