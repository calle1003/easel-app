'use server';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type { CheckoutRequest, CheckoutResponse } from '@/types/checkout';
import { revalidatePath } from 'next/cache';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function createCheckoutSession(
  request: CheckoutRequest
): Promise<{ success: true; data: CheckoutResponse } | { success: false; error: string }> {
  try {
    // 0. バリデーション
    if (!request.customerName || request.customerName.trim() === '') {
      return { success: false, error: 'お名前を入力してください' };
    }
    if (!request.customerEmail || request.customerEmail.trim() === '') {
      return { success: false, error: 'メールアドレスを入力してください' };
    }
    if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(request.customerEmail)) {
      return { success: false, error: '有効なメールアドレスを入力してください' };
    }

    // 数量チェック
    const totalQuantity = request.generalQuantity + request.reservedQuantity;
    if (totalQuantity <= 0) {
      return { success: false, error: 'チケットを1枚以上選択してください' };
    }
    if (totalQuantity > 10) {
      return { success: false, error: '一度に購入できるチケットは10枚までです' };
    }

    // 1. パフォーマンス情報を取得
    const performance = await prisma.performance.findUnique({
      where: { id: request.performanceId },
    });

    if (!performance) {
      return { success: false, error: '公演情報が見つかりません' };
    }

    if (performance.saleStatus !== 'ON_SALE') {
      return { success: false, error: '現在販売中の公演ではありません' };
    }

    // 2. 引換券コードの検証
    const validExchangeCodes: string[] = [];
    if (request.exchangeCodes && request.exchangeCodes.length > 0) {
      for (const code of request.exchangeCodes) {
        const normalizedCode = code.trim().toUpperCase();
        const exchangeCode = await prisma.exchangeCode.findFirst({
          where: {
            code: normalizedCode,
            isUsed: false,
          },
        });

        if (!exchangeCode) {
          return { success: false, error: `無効または使用済みの引換券コードです: ${code}` };
        }

        validExchangeCodes.push(normalizedCode);
      }
    }

    // 3. 金額計算
    const discountedGeneralCount = validExchangeCodes.length;
    const freeGeneralQuantity = Math.min(discountedGeneralCount, request.generalQuantity);
    const chargeableGeneralQuantity = request.generalQuantity - freeGeneralQuantity;
    const discountAmount = freeGeneralQuantity * performance.generalPrice;
    const totalAmount =
      chargeableGeneralQuantity * performance.generalPrice +
      request.reservedQuantity * performance.reservedPrice;

    // 引換券適用数チェック
    if (discountedGeneralCount < 0) {
      return { success: false, error: '引換券適用枚数が不正です' };
    }
    if (discountedGeneralCount > request.generalQuantity) {
      return { success: false, error: '引換券適用枚数が一般席枚数を超えています' };
    }

    // 4. Stripe Checkout Session作成
    const lineItems: any[] = [];

    // 一般席（引換券適用・無料分）
    if (freeGeneralQuantity > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: 0,
          product_data: {
            name: `${performance.title} 一般席（引換券適用）`,
            description: '引換券による無料チケット',
          },
        },
        quantity: freeGeneralQuantity,
      });
    }

    // 一般席（有料分）
    if (chargeableGeneralQuantity > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: performance.generalPrice,
          product_data: {
            name: `${performance.title} 一般席`,
          },
        },
        quantity: chargeableGeneralQuantity,
      });
    }

    // 指定席
    if (request.reservedQuantity > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: performance.reservedPrice,
          product_data: {
            name: `${performance.title} 指定席`,
          },
        },
        quantity: request.reservedQuantity,
      });
    }

    // 合計金額が0円の場合はエラー（Stripeは0円決済不可）
    if (totalAmount <= 0) {
      return { success: false, error: 'お支払い金額が0円のため、決済は不要です。' };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${APP_URL}/easel-live/vol2/ticket/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/easel-live/vol2/ticket/cancel`,
      customer_email: request.customerEmail,
      locale: 'ja',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        performance_date: performance.performanceDate.toISOString().split('T')[0],
        customer_name: request.customerName,
        general_quantity: String(request.generalQuantity),
        reserved_quantity: String(request.reservedQuantity),
        discounted_count: String(freeGeneralQuantity),
        exchange_codes: validExchangeCodes.join(','),
      },
    });

    // 5. 注文をDBに保存（ステータス: PENDING）
    const order = await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        performanceDate: performance.performanceDate.toISOString().split('T')[0],
        performanceLabel: request.dateLabel || performance.title,
        generalQuantity: request.generalQuantity,
        reservedQuantity: request.reservedQuantity,
        generalPrice: performance.generalPrice,
        reservedPrice: performance.reservedPrice,
        discountedGeneralCount: freeGeneralQuantity,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        status: 'PENDING',
        exchangeCodes: validExchangeCodes.join(','),
      },
    });

    revalidatePath('/easel-live/vol2/ticket');

    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url || '',
        orderId: order.id,
      },
    };
  } catch (error: any) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error: error.message || '決済セッションの作成に失敗しました',
    };
  }
}

export async function validateExchangeCodes(codes: string[]): Promise<{
  valid: boolean;
  codes: Array<{ code: string; valid: boolean; used: boolean; performerName?: string }>;
}> {
  const results = await Promise.all(
    codes.map(async (code) => {
      const normalizedCode = code.trim().toUpperCase();
      const exchangeCode = await prisma.exchangeCode.findUnique({
        where: { code: normalizedCode },
      });

      return {
        code: normalizedCode,
        valid: !!exchangeCode,
        used: exchangeCode?.isUsed || false,
        performerName: exchangeCode?.performerName || undefined,
      };
    })
  );

  const valid = results.every((r) => r.valid && !r.used);

  return { valid, codes: results };
}
