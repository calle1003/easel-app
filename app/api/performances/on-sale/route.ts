import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const performances = await prisma.performance.findMany({
      where: { saleStatus: 'ON_SALE' },
      orderBy: { performanceDate: 'asc' },
    });

    return NextResponse.json(performances);
  } catch (error) {
    console.error('Failed to fetch on-sale performances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performances' },
      { status: 500 }
    );
  }
}
