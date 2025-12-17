'use server';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
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
    const vip1Qty = request.vip1Quantity || 0;
    const vip2Qty = request.vip2Quantity || 0;
    const totalQuantity = request.generalQuantity + request.reservedQuantity + vip1Qty + vip2Qty;
    if (totalQuantity <= 0) {
      return { success: false, error: 'チケットを1枚以上選択してください' };
    }
    if (totalQuantity > 10) {
      return { success: false, error: '一度に購入できるチケットは10枚までです' };
    }

    // 1. パフォーマンスセッション情報を取得
    const performanceSession = await prisma.performanceSession.findUnique({
      where: { id: request.performanceId },
      include: {
        performance: true,
      },
    });

    if (!performanceSession) {
      return { success: false, error: '公演情報が見つかりません' };
    }

    if (performanceSession.saleStatus !== 'ON_SALE') {
      return { success: false, error: '現在販売中の公演ではありません' };
    }

    const performance = performanceSession.performance;

    // 2. 引換券コードの検証
    const validExchangeCodes: string[] = [];
    if (request.exchangeCodes && request.exchangeCodes.length > 0) {
      for (const code of request.exchangeCodes) {
        const normalizedCode = code.trim().toLowerCase();
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
    
    const vip1Amount = vip1Qty * (performance.vip1Price || 0);
    const vip2Amount = vip2Qty * (performance.vip2Price || 0);
    
    const totalAmount =
      chargeableGeneralQuantity * performance.generalPrice +
      request.reservedQuantity * performance.reservedPrice +
      vip1Amount +
      vip2Amount;

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

    // 一般席（有料分）- 管理画面の価格を使用
    if (chargeableGeneralQuantity > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: performance.generalPrice,
          product_data: {
            name: `${performance.title} 一般席`,
            description: `公演日: ${performanceSession.performanceDate.toISOString().split('T')[0]}`,
          },
        },
        quantity: chargeableGeneralQuantity,
      });
    }

    // 指定席 - 管理画面の価格を使用
    if (request.reservedQuantity > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: performance.reservedPrice,
          product_data: {
            name: `${performance.title} 指定席`,
            description: `公演日: ${performanceSession.performanceDate.toISOString().split('T')[0]}`,
          },
        },
        quantity: request.reservedQuantity,
      });
    }

    // VIP①席 - 管理画面の価格を使用
    if (vip1Qty > 0 && performance.vip1Price) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: performance.vip1Price,
          product_data: {
            name: `${performance.title} VIP①席`,
            description: performance.vip1Note 
              ? `${performance.vip1Note} | 公演日: ${performanceSession.performanceDate.toISOString().split('T')[0]}`
              : `公演日: ${performanceSession.performanceDate.toISOString().split('T')[0]}`,
          },
        },
        quantity: vip1Qty,
      });
    }

    // VIP②席 - 管理画面の価格を使用
    if (vip2Qty > 0 && performance.vip2Price) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: performance.vip2Price,
          product_data: {
            name: `${performance.title} VIP②席`,
            description: performance.vip2Note 
              ? `${performance.vip2Note} | 公演日: ${performanceSession.performanceDate.toISOString().split('T')[0]}`
              : `公演日: ${performanceSession.performanceDate.toISOString().split('T')[0]}`,
          },
        },
        quantity: vip2Qty,
      });
    }

    // 合計金額が0円の場合はエラー（Stripeは0円決済不可）
    if (totalAmount <= 0) {
      return { success: false, error: 'お支払い金額が0円のため、決済は不要です。' };
    }

    logger.info('Creating Stripe checkout session', {
      customerEmail: request.customerEmail,
      totalAmount,
      generalQuantity: request.generalQuantity,
      reservedQuantity: request.reservedQuantity,
      vip1Quantity: vip1Qty,
      vip2Quantity: vip2Qty,
      exchangeCodes: validExchangeCodes.length,
    });

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${APP_URL}/ticket/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/ticket/cancel`,
      customer_email: request.customerEmail,
      locale: 'ja',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        performance_date: performanceSession.performanceDate.toISOString().split('T')[0],
        customer_name: request.customerName,
        general_quantity: String(request.generalQuantity),
        reserved_quantity: String(request.reservedQuantity),
        vip1_quantity: String(vip1Qty),
        vip2_quantity: String(vip2Qty),
        discounted_count: String(freeGeneralQuantity),
        exchange_codes: validExchangeCodes.join(','),
      },
    });

    // 5. 注文をDBに保存（ステータス: PENDING）
    const order = await prisma.order.create({
      data: {
        stripeSessionId: stripeSession.id,
        performanceDate: performanceSession.performanceDate.toISOString().split('T')[0],
        performanceLabel: request.dateLabel || performance.title,
        generalQuantity: request.generalQuantity,
        reservedQuantity: request.reservedQuantity,
        vip1Quantity: vip1Qty,
        vip2Quantity: vip2Qty,
        generalPrice: performance.generalPrice,
        reservedPrice: performance.reservedPrice,
        vip1Price: performance.vip1Price || 0,
        vip2Price: performance.vip2Price || 0,
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

    logger.success('Checkout session created successfully', {
      sessionId: stripeSession.id,
      orderId: order.id,
      totalAmount,
    });

    revalidatePath('/ticket');

    return {
      success: true,
      data: {
        sessionId: stripeSession.id,
        url: stripeSession.url || '',
        orderId: order.id,
      },
    };
  } catch (error: any) {
    logger.error('Checkout error', { error: error.message });
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
      const normalizedCode = code.trim().toLowerCase();
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
