import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: vol1の引換券を引換済み＆来場済みに更新
export async function POST(request: NextRequest) {
  try {
    // vol1の引換券を取得
    const vol1Codes = await prisma.exchangeCode.findMany({
      where: {
        code: {
          startsWith: 'vol1-',
        },
      },
    });

    console.log(`Found ${vol1Codes.length} vol1 codes`);

    let updatedCount = 0;
    let ticketsUpdated = 0;

    // トランザクションで一括更新
    await prisma.$transaction(async (tx) => {
      for (const code of vol1Codes) {
        // 引換券を使用済みに更新
        await tx.exchangeCode.update({
          where: { id: code.id },
          data: {
            isUsed: true,
            usedAt: new Date('2024-12-10'), // 過去の日付
          },
        });

        // orderIdがある場合、そのチケットを来場済みに
        if (code.orderId) {
          const updated = await tx.ticket.updateMany({
            where: { orderId: code.orderId },
            data: {
              isUsed: true,
              usedAt: new Date('2024-12-10'), // 過去の日付
            },
          });
          ticketsUpdated += updated.count;
        }

        updatedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      updatedCodes: updatedCount,
      updatedTickets: ticketsUpdated,
      message: `vol1: ${updatedCount}件を引換済み＆来場済みに更新しました`,
    });
  } catch (error) {
    console.error('Update failed:', error);
    return NextResponse.json(
      { error: 'Update failed', details: String(error) },
      { status: 500 }
    );
  }
}
