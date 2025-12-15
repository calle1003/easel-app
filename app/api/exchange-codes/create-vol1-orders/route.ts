import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: vol1の引換券に注文とチケットを作成し、来場済みに設定
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

    let ordersCreated = 0;
    let ticketsCreated = 0;

    // トランザクションで処理
    await prisma.$transaction(async (tx) => {
      for (const code of vol1Codes) {
        // 既にorderIdがある場合はスキップ
        if (code.orderId) {
          // 既存の注文のチケットを来場済みに
          const tickets = await tx.ticket.updateMany({
            where: { orderId: code.orderId },
            data: {
              isUsed: true,
              usedAt: new Date('2024-12-10T18:00:00'), // 適当な来場日時
            },
          });
          ticketsCreated += tickets.count;
          continue;
        }

        // 注文を作成
        const order = await tx.order.create({
          data: {
            stripeSessionId: `dummy_session_vol1_${code.id}`,
            performanceDate: '2024-12-10',
            performanceLabel: 'easel live vol.1 - 2024/12/10',
            generalQuantity: 1,
            reservedQuantity: 0,
            generalPrice: 4000,
            reservedPrice: 0,
            discountedGeneralCount: 1,
            discountAmount: 500,
            exchangeCodes: code.code,
            totalAmount: 3500,
            customerName: 'ダミーユーザー',
            customerEmail: 'dummy@example.com',
            status: 'PAID',
            paidAt: new Date('2024-12-08'), // 引換日
          },
        });

        ordersCreated++;

        // チケットを作成（来場済み）
        await tx.ticket.create({
          data: {
            orderId: order.id,
            ticketCode: crypto.randomUUID(),
            ticketType: 'GENERAL',
            isExchanged: true,
            isUsed: true, // 来場済み
            usedAt: new Date('2024-12-10T18:00:00'), // 来場日時
          },
        });

        ticketsCreated++;

        // 引換券コードを更新
        await tx.exchangeCode.update({
          where: { id: code.id },
          data: {
            isUsed: true,
            usedAt: new Date('2024-12-08'), // 引換日
            orderId: order.id,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      ordersCreated,
      ticketsCreated,
      message: `vol1: ${ordersCreated}件の注文と${ticketsCreated}件のチケットを作成し、来場済みに設定しました`,
    });
  } catch (error) {
    console.error('Creation failed:', error);
    return NextResponse.json(
      { error: 'Creation failed', details: String(error) },
      { status: 500 }
    );
  }
}
