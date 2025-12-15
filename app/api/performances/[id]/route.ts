import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const performanceId = parseInt(id);

    if (isNaN(performanceId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const performance = await prisma.performance.findUnique({
      where: { id: performanceId },
    });

    if (!performance) {
      return NextResponse.json(
        { error: 'Performance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Failed to fetch performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const performance = await prisma.performance.update({
      where: { id: performanceId },
      data: {
        title: body.title,
        volume: body.volume,
        year: body.year || null,
        isOnSale: body.isOnSale || false,
        generalPrice: body.generalPrice,
        reservedPrice: body.reservedPrice,
        vip1Price: body.vip1Price || null,
        vip2Price: body.vip2Price || null,
        vip1Note: body.vip1Note || null,
        vip2Note: body.vip2Note || null,
        description: body.description,
      },
    });

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Failed to update performance:', error);
    return NextResponse.json(
      { error: 'Failed to update performance' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const performanceId = parseInt(id);

    if (isNaN(performanceId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.performance.delete({
      where: { id: performanceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete performance:', error);
    return NextResponse.json(
      { error: 'Failed to delete performance' },
      { status: 500 }
    );
  }
}
