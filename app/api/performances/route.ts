import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const performances = await prisma.performance.findMany({
      orderBy: { performanceDate: 'asc' },
    });

    // 残席数を計算して追加
    const performancesWithRemaining = performances.map((p) => ({
      ...p,
      generalRemaining: p.generalCapacity - p.generalSold,
      reservedRemaining: p.reservedCapacity - p.reservedSold,
    }));

    return NextResponse.json(performancesWithRemaining);
  } catch (error) {
    console.error('Failed to fetch performances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performances' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const performance = await prisma.performance.create({
      data: {
        title: body.title,
        volume: body.volume,
        performanceDate: new Date(body.performanceDate),
        performanceTime: new Date(`1970-01-01T${body.performanceTime}`),
        doorsOpenTime: body.doorsOpenTime
          ? new Date(`1970-01-01T${body.doorsOpenTime}`)
          : null,
        venueName: body.venueName,
        venueAddress: body.venueAddress,
        venueAccess: body.venueAccess,
        generalPrice: body.generalPrice,
        reservedPrice: body.reservedPrice,
        generalCapacity: body.generalCapacity || 0,
        reservedCapacity: body.reservedCapacity || 0,
        saleStatus: body.saleStatus || 'NOT_ON_SALE',
        saleStartAt: body.saleStartAt ? new Date(body.saleStartAt) : null,
        saleEndAt: body.saleEndAt ? new Date(body.saleEndAt) : null,
        flyerImageUrl: body.flyerImageUrl,
        description: body.description,
      },
    });
    return NextResponse.json(performance, { status: 201 });
  } catch (error) {
    console.error('Failed to create performance:', error);
    return NextResponse.json(
      { error: 'Failed to create performance' },
      { status: 500 }
    );
  }
}
