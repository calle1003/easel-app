import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const performances = await prisma.performance.findMany({
      include: {
        sessions: {
          orderBy: { performanceDate: 'asc' },
        },
        performers: {
          include: {
            performer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(performances);
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
    const numberOfShows = body.numberOfShows || 1;
    const sessionsDates = body.sessionsDates || [];
    
    // 会場情報（全セッションに共通）
    const venueName = body.venueName || '未設定';
    const venueAddress = body.venueAddress || null;
    const venueAccess = body.venueAccess || null;
    
    // 指定された回数分のSessionを作成
    const sessionsData = [];
    for (let i = 1; i <= numberOfShows; i++) {
      const sessionDate = sessionsDates[i - 1];
      
      // 日時データがあればそれを使用、なければデフォルト値
      const performanceDate = sessionDate?.performanceDate 
        ? new Date(sessionDate.performanceDate)
        : new Date('2025-01-01');
      
      const performanceTime = sessionDate?.performanceTime
        ? new Date(`1970-01-01T${sessionDate.performanceTime}`)
        : new Date('1970-01-01T14:00:00');
      
      const doorsOpenTime = sessionDate?.doorsOpenTime
        ? new Date(`1970-01-01T${sessionDate.doorsOpenTime}`)
        : null;
      
      sessionsData.push({
        showNumber: i,
        performanceDate,
        performanceTime,
        doorsOpenTime,
        venueName: venueName,
        venueAddress: venueAddress,
        venueAccess: venueAccess,
        generalCapacity: 100,
        reservedCapacity: 30,
        generalSold: 0,
        reservedSold: 0,
        saleStatus: 'NOT_ON_SALE' as const,
        saleStartAt: null,
        saleEndAt: null,
      });
    }
    
    // PerformanceとSessionsを同時に作成
    const performance = await prisma.performance.create({
      data: {
        title: body.title,
        volume: body.volume,
        year: body.year || null,
        isOnSale: body.isOnSale || false,
        generalPrice: body.generalPrice,
        reservedPrice: body.reservedPrice,
        description: body.description,
        sessions: {
          create: sessionsData,
        },
      },
      include: {
        sessions: {
          orderBy: { showNumber: 'asc' },
        },
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
