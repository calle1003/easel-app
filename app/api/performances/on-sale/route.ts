import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // 販売中の公演とそのセッションを取得
    const performances = await prisma.performance.findMany({
      where: { 
        isOnSale: true,
      },
      include: {
        sessions: {
          where: {
            saleStatus: 'ON_SALE',
          },
          orderBy: {
            performanceDate: 'asc',
          },
        },
      },
    });

    // 販売中のセッションを持つ公演のみをフィルタリングし、フラット化
    const onSaleSessions = performances.flatMap(performance => 
      performance.sessions.map(session => ({
        id: session.id,
        title: performance.title,
        volume: performance.volume,
        performanceDate: session.performanceDate,
        performanceTime: session.performanceTime,
        doorsOpenTime: session.doorsOpenTime,
        venueName: session.venueName,
        venueAddress: session.venueAddress,
        venueAccess: session.venueAccess,
        generalPrice: performance.generalPrice,
        reservedPrice: performance.reservedPrice,
        vip1Price: performance.vip1Price,
        vip2Price: performance.vip2Price,
        vip1Note: performance.vip1Note,
        vip2Note: performance.vip2Note,
        generalCapacity: session.generalCapacity,
        generalSold: session.generalSold,
        reservedCapacity: session.reservedCapacity,
        reservedSold: session.reservedSold,
        vip1Capacity: session.vip1Capacity,
        vip1Sold: session.vip1Sold,
        vip2Capacity: session.vip2Capacity,
        vip2Sold: session.vip2Sold,
        saleStatus: session.saleStatus,
        saleStartAt: session.saleStartAt,
        saleEndAt: session.saleEndAt,
      }))
    );

    return NextResponse.json(onSaleSessions);
  } catch (error) {
    logger.error('Failed to fetch on-sale performances', { error });
    return NextResponse.json(
      { error: 'Failed to fetch performances' },
      { status: 500 }
    );
  }
}
