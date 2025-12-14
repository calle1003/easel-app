import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: { tickets: true },
      });

      if (!order) {
        console.error('Order not found for session:', session.id);
        return NextResponse.json({ received: true });
      }

      // 既に支払い済みの場合はスキップ
      if (order.status === 'PAID') {
        console.log('Order already paid:', order.id);
        return NextResponse.json({ received: true });
      }

      // 注文をPAIDに更新
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          stripePaymentIntentId: session.payment_intent as string,
          paidAt: new Date(),
        },
      });

      // 引換券コードを使用済みにする
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

      // チケットを発行
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

      // チケット情報を取得
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { tickets: true },
      });

      if (updatedOrder) {
        // メール送信
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
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;

      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (order && order.status === 'PENDING') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });
        console.log('Order cancelled due to session expiry:', order.id);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      // 支払い失敗イベント（必要に応じてメール通知などを追加）
      console.warn('Payment failed event received:', event.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
