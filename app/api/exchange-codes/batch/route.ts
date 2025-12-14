import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { count, performerName } = await request.json();

    if (!count || count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      );
    }

    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = `EXCHANGE${Date.now()}${i}`;
      codes.push({
        code: code.toUpperCase(),
        performerName: performerName || null,
      });
    }

    const created = await prisma.exchangeCode.createMany({
      data: codes,
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch (error) {
    console.error('Failed to create batch exchange codes:', error);
    return NextResponse.json(
      { error: 'Failed to create exchange codes' },
      { status: 500 }
    );
  }
}
