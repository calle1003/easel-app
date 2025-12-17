'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCheckoutSession } from '@/app/actions/checkout';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface OrderData {
  performanceId: number;
  performanceTitle?: string;
  date: string;
  dateLabel: string;
  hasExchangeCode: boolean;
  exchangeCodes: string[];
  generalQuantity: number;
  reservedQuantity: number;
  vip1Quantity?: number;
  vip2Quantity?: number;
  generalPrice: number;
  reservedPrice: number;
  vip1Price?: number;
  vip2Price?: number;
  discountedGeneralCount: number;
  discountAmount: number;
  total: number;
  name: string;
  email: string;
  phone: string;
}

export default function TicketConfirmPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // sessionStorageからデータを取得
    const savedData = sessionStorage.getItem('orderData');
    if (savedData) {
      try {
        setOrderData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse order data:', error);
        router.push('/ticket');
      }
    } else {
      // データがない場合は購入ページにリダイレクト
      router.push('/ticket');
    }
  }, [router]);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300" />
      </div>
    );
  }

  const {
    date,
    dateLabel,
    hasExchangeCode,
    exchangeCodes,
    generalQuantity,
    reservedQuantity,
    vip1Quantity = 0,
    vip2Quantity = 0,
    generalPrice,
    reservedPrice,
    vip1Price = 0,
    vip2Price = 0,
    discountedGeneralCount,
    discountAmount,
    total,
    name,
    email,
    phone,
  } = orderData;

  const handleBack = () => {
    // sessionStorageにデータが保存されているので、そのまま戻る
    router.push('/ticket');
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const result = await createCheckoutSession({
        performanceId: orderData.performanceId,
        generalQuantity,
        reservedQuantity,
        vip1Quantity,
        vip2Quantity,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        exchangeCodes: hasExchangeCode ? exchangeCodes : [],
        dateLabel: dateLabel,
      });

      if (result.success) {
        // 決済が成功したらsessionStorageをクリア
        sessionStorage.removeItem('orderData');
        window.location.href = result.data.url;
      } else {
        alert(result.error || '決済セッションの作成に失敗しました');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('決済処理中にエラーが発生しました。もう一度お試しください。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="min-h-[300px] flex flex-col justify-center px-6 bg-warm-50">
        <div className="max-w-3xl mx-auto w-full">
          <nav className="mb-3">
            <Link href="/" className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
              Home
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <button onClick={handleBack} className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
              Ticket
            </button>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-xs tracking-wider text-slate-500">確認</span>
          </nav>
          <div className="text-center">
            <p className="section-subtitle mb-4">Confirmation</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">ご注文内容の確認</h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-slate-500 mb-14">
            以下の内容でよろしければ、決済へお進みください。
          </p>

          {/* Order Summary - Ticket Info */}
          <div className="border border-slate-100 rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h2 className="text-xs tracking-wider text-slate-500 uppercase">
                チケット情報
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">公演日時</span>
                <span className="text-slate-700">{dateLabel}</span>
              </div>
              {generalQuantity > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">一般席（自由席）</span>
                  <span className="text-slate-700">
                    ¥{generalPrice.toLocaleString()} × {generalQuantity}枚
                  </span>
                </div>
              )}
              {reservedQuantity > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">指定席</span>
                  <span className="text-slate-700">
                    ¥{reservedPrice.toLocaleString()} × {reservedQuantity}枚
                  </span>
                </div>
              )}
              {vip1Quantity > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">VIP①席</span>
                  <span className="text-amber-700 font-medium">
                    ¥{vip1Price.toLocaleString()} × {vip1Quantity}枚
                  </span>
                </div>
              )}
              {vip2Quantity > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">VIP②席</span>
                  <span className="text-purple-700 font-medium">
                    ¥{vip2Price.toLocaleString()} × {vip2Quantity}枚
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Exchange Code Info */}
          {hasExchangeCode && exchangeCodes.length > 0 && (
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-8">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <h2 className="text-xs tracking-wider text-slate-500 uppercase">
                  引換券コード
                </h2>
              </div>
              <div className="p-6 space-y-2">
                {exchangeCodes.map((code, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-slate-500">コード {index + 1}</span>
                    <span className="text-slate-700 font-mono">{code}</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    ※引換券 {discountedGeneralCount}枚分の一般席が無料になります
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="border border-slate-100 rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h2 className="text-xs tracking-wider text-slate-500 uppercase">
                お客様情報
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">お名前</span>
                <span className="text-slate-700">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">メールアドレス</span>
                <span className="text-slate-700">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">電話番号</span>
                <span className="text-slate-700">{phone}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border border-slate-100 rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h2 className="text-xs tracking-wider text-slate-500 uppercase">
                お支払い金額
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {generalQuantity > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>一般席 × {generalQuantity}</span>
                  <span>
                    ¥{(generalQuantity * generalPrice).toLocaleString()}
                  </span>
                </div>
              )}
              {reservedQuantity > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>指定席 × {reservedQuantity}</span>
                  <span>
                    ¥{(reservedQuantity * reservedPrice).toLocaleString()}
                  </span>
                </div>
              )}
              {vip1Quantity > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>VIP①席 ¥{vip1Price.toLocaleString()} × {vip1Quantity}枚</span>
                  <span>
                    ¥{(vip1Quantity * vip1Price).toLocaleString()}
                  </span>
                </div>
              )}
              {vip2Quantity > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>VIP②席 ¥{vip2Price.toLocaleString()} × {vip2Quantity}枚</span>
                  <span>
                    ¥{(vip2Quantity * vip2Price).toLocaleString()}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>引換券割引（{discountedGeneralCount}枚分）</span>
                  <span>-¥{discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="p-6 bg-slate-800 text-white rounded-xl mb-8">
            <div className="flex items-center justify-between">
              <span>お支払い合計</span>
              <span className="font-serif text-3xl">
                ¥{total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* キャンセルポリシー（再確認） */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8">
            <h4 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              キャンセルポリシー
            </h4>
            <ul className="text-sm text-amber-800 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>キャンセル時は決済手数料を差し引いた額をお戻しいたします</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>本番7日前以降はキャンセル不可となります</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isLoading}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '処理中...' : '決済へ進む（Stripe）'}
            </button>
            <p className="text-center text-sm text-slate-400">
              ※決済はStripeによる安全なクレジットカード決済です
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="w-full py-4 text-center text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← 入力画面に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
