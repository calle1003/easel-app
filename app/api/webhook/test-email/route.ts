import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

/**
 * テスト用: 注文IDを指定してメールを送信
 * curl -X POST http://localhost:3000/api/webhook/test-email -H "Content-Type: application/json" -d '{"orderId":3}'
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // 注文を取得（チケット情報含む）
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { tickets: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: `Order #${orderId} not found` },
        { status: 404 }
      );
    }

    // メール送信
    await sendPurchaseConfirmationEmail(order.customerEmail, {
      orderId: order.id,
      performanceLabel: order.performanceLabel || '',
      performanceDate: order.performanceDate,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      generalQuantity: order.generalQuantity,
      reservedQuantity: order.reservedQuantity,
      tickets: order.tickets.map((t) => ({
        ticketCode: t.ticketCode,
        ticketType: t.ticketType,
        isExchanged: t.isExchanged,
      })),
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      order: {
        id: order.id,
        email: order.customerEmail,
        customerName: order.customerName,
        ticketCount: order.tickets.length,
        totalAmount: order.totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

/**
 * GET: 最近の注文一覧を取得
 * curl http://localhost:3000/api/webhook/test-email
 */
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { id: 'desc' },
      take: 10,
      include: {
        tickets: {
          select: {
            ticketCode: true,
            ticketType: true,
          },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        status: o.status,
        totalAmount: o.totalAmount,
        performanceLabel: o.performanceLabel,
        ticketCount: o.tickets.length,
      })),
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get orders' },
      { status: 500 }
    );
  }
}
