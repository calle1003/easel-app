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

    // トランザクションで公演とセッションを更新
    const performance = await prisma.$transaction(async (tx) => {
      // 公演情報を更新
      const updatedPerformance = await tx.performance.update({
        where: { id: performanceId },
        data: {
          title: body.title,
          volume: body.volume,
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

      // セッション情報を更新（sessionsDatesDataがある場合）
      if (body.sessionsDates && Array.isArray(body.sessionsDates)) {
        // 既存セッションのIDリストを取得
        const sessionIds = body.sessionsDates
          .filter((s: any) => s.id)
          .map((s: any) => s.id);

        // sessionsDatesに含まれないセッションを削除（sessionIdsがある場合のみ）
        if (sessionIds.length > 0) {
          await tx.performanceSession.deleteMany({
            where: {
              performanceId: performanceId,
              id: {
                notIn: sessionIds,
              },
            },
          });
        }

        // セッションを更新または作成
        for (const sessionData of body.sessionsDates) {
          // 日時データの変換
          const performanceDate = sessionData.performanceDate 
            ? new Date(sessionData.performanceDate)
            : new Date('2025-01-01');
          
          const performanceTime = sessionData.performanceTime
            ? new Date(`1970-01-01T${sessionData.performanceTime}`)
            : new Date('1970-01-01T14:00:00');
          
          const doorsOpenTime = sessionData.doorsOpenTime
            ? new Date(`1970-01-01T${sessionData.doorsOpenTime}`)
            : null;

          if (sessionData.id) {
            // 既存セッションを更新
            await tx.performanceSession.update({
              where: { id: sessionData.id },
              data: {
                showNumber: sessionData.showNumber,
                performanceDate,
                performanceTime,
                doorsOpenTime,
                generalCapacity: sessionData.generalCapacity || 100,
                reservedCapacity: sessionData.reservedCapacity || 30,
                vip1Capacity: sessionData.vip1Capacity || 0,
                vip2Capacity: sessionData.vip2Capacity || 0,
              },
            });
          } else {
            // 新しいセッションを作成
            await tx.performanceSession.create({
              data: {
                performanceId: performanceId,
                showNumber: sessionData.showNumber,
                performanceDate,
                performanceTime,
                doorsOpenTime,
                venueName: body.venueName || '未設定',
                venueAddress: body.venueAddress || null,
                venueAccess: body.venueAccess || null,
                generalCapacity: sessionData.generalCapacity || 100,
                reservedCapacity: sessionData.reservedCapacity || 30,
                vip1Capacity: sessionData.vip1Capacity || 0,
                vip2Capacity: sessionData.vip2Capacity || 0,
                generalSold: 0,
                reservedSold: 0,
                vip1Sold: 0,
                vip2Sold: 0,
                saleStatus: 'NOT_ON_SALE',
              },
            });
          }
        }
      }

      return updatedPerformance;
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
