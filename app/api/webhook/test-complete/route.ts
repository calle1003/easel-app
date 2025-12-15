import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

/**
 * テスト用：注文を手動で完了にしてメールを送信
 * POST /api/webhook/test-complete
 * Body: { sessionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // 注文を検索
    const order = await prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      include: { tickets: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found for session: ' + sessionId },
        { status: 404 }
      );
    }

    // 既に支払い済みの場合
    if (order.status === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Order already paid',
        orderId: order.id,
        ticketCount: order.tickets.length,
      });
    }

    // 1. 注文をPAIDに更新
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        stripePaymentIntentId: 'pi_test_' + Date.now(),
        paidAt: new Date(),
      },
    });

    // 2. 引換券を使用済みにする
    if (order.exchangeCodes) {
      const codes = order.exchangeCodes.split(',');
      await prisma.exchangeCode.updateMany({
        where: {
          code: { in: codes },
        },
        data: {
          isUsed: true,
          usedAt: new Date(),
          orderId: order.id,
        },
      });
    }

    // 3. チケットを発行
    const tickets = [];
    for (let i = 0; i < order.generalQuantity; i++) {
      tickets.push({
        orderId: order.id,
        ticketCode: crypto.randomUUID(),
        ticketType: 'GENERAL' as const,
        isExchanged: i < order.discountedGeneralCount,
      });
    }
    for (let i = 0; i < order.reservedQuantity; i++) {
      tickets.push({
        orderId: order.id,
        ticketCode: crypto.randomUUID(),
        ticketType: 'RESERVED' as const,
        isExchanged: false,
      });
    }

    await prisma.ticket.createMany({ data: tickets });

    // 4. チケット情報を取得
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { tickets: true },
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to fetch updated order' },
        { status: 500 }
      );
    }

    // 5. メール送信を試みる
    try {
      await sendPurchaseConfirmationEmail(order.customerEmail, {
        orderId: order.id,
        performanceLabel: order.performanceLabel || '',
        performanceDate: order.performanceDate,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        generalQuantity: order.generalQuantity,
        reservedQuantity: order.reservedQuantity,
        tickets: updatedOrder.tickets.map((t) => ({
          ticketCode: t.ticketCode,
          ticketType: t.ticketType,
          isExchanged: t.isExchanged,
        })),
      });

      return NextResponse.json({
        success: true,
        message: 'Order completed and email sent',
        orderId: order.id,
        ticketCount: updatedOrder.tickets.length,
        email: order.customerEmail,
      });
    } catch (emailError: any) {
      // メール送信に失敗してもチケットは発行済み
      console.error('Email send failed:', emailError);
      return NextResponse.json({
        success: true,
        message: 'Order completed but email failed',
        orderId: order.id,
        ticketCount: updatedOrder.tickets.length,
        emailError: emailError.message,
      });
    }
  } catch (error: any) {
    console.error('Test complete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    );
  }
}
