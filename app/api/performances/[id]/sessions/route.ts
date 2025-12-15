import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const performanceId = parseInt(id);
    const body = await request.json();

    if (isNaN(performanceId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const session = await prisma.performanceSession.create({
      data: {
        performanceId,
        showNumber: body.showNumber,
        performanceDate: new Date(body.performanceDate),
        performanceTime: new Date(`1970-01-01T${body.performanceTime}`),
        doorsOpenTime: body.doorsOpenTime
          ? new Date(`1970-01-01T${body.doorsOpenTime}`)
          : null,
        venueName: body.venueName,
        venueAddress: body.venueAddress,
        venueAccess: body.venueAccess,
        generalCapacity: body.generalCapacity || 0,
        reservedCapacity: body.reservedCapacity || 0,
        vip1Capacity: body.vip1Capacity || 0,
        vip2Capacity: body.vip2Capacity || 0,
        saleStatus: body.saleStatus || 'NOT_ON_SALE',
        saleStartAt: body.saleStartAt ? new Date(body.saleStartAt) : null,
        saleEndAt: body.saleEndAt ? new Date(body.saleEndAt) : null,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
