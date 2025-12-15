import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // 詳細情報を更新
    const performance = await prisma.performance.update({
      where: { id: performanceId },
      data: {
        flyerImages: body.flyerImages || [],
        painters: body.painters || [],
        choreographers: body.choreographers || [],
        navigators: body.navigators || [],
        guestDancers: body.guestDancers || [],
        staff: body.staff || [],
      },
    });

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Failed to update performance details:', error);
    return NextResponse.json(
      { error: 'Failed to update performance details' },
      { status: 500 }
    );
  }
}
