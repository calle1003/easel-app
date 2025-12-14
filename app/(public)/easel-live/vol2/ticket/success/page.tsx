'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Ticket as TicketIcon, Mail, Loader2, Gift } from 'lucide-react';

interface TicketInfo {
  id: number;
  ticketCode: string;
  ticketType: 'GENERAL' | 'RESERVED';
  isExchanged: boolean;
  isUsed: boolean;
}

interface OrderInfo {
  id: number;
  customerName: string;
  customerEmail: string;
  performanceLabel: string;
  generalQuantity: number;
  reservedQuantity: number;
  totalAmount: number;
  discountAmount: number;
  status: string;
  tickets: TicketInfo[];
}

export default function TicketSuccessPage() {
  const searchParams = useSearchParams();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');

    if (sessionId) {
      fetchOrderInfo(sessionId);
    } else if (orderId) {
      fetchOrderById(parseInt(orderId));
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchOrderInfo = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/orders/by-session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderInfo(data);
      } else {
        setError('注文情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch order info:', err);
      setError('注文情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderById = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderInfo(data);
      } else {
        setError('注文情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch order info:', err);
      setError('注文情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="min-h-[400px] bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <CheckCircle className="mx-auto mb-8 text-green-500" size={72} strokeWidth={1.5} />
          
          <h1 className="font-serif text-3xl md:text-4xl font-light tracking-[0.15em] text-slate-800 mb-6">
            ご購入ありがとうございます
          </h1>
          
          <p className="text-slate-600 leading-relaxed mb-6">
            決済が正常に完了しました。
          </p>
          
          <div className="inline-flex items-center gap-2 px-6 py-4 bg-white border-2 border-green-300 rounded-lg shadow-sm">
            <Mail className="text-green-600" size={20} />
            <div className="text-left">
              <p className="text-sm font-semibold text-green-900 mb-0.5">
                確認メールをお送りしました
              </p>
              <p className="text-xs text-green-700">
                メール内のボタンからチケットをご確認ください
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      {!error && orderInfo && (
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Order Summary */}
          <div className="bg-slate-50 rounded-lg p-6 mb-8">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              注文情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">注文番号</p>
                <p className="text-slate-800 font-medium">#{orderInfo.id}</p>
              </div>
              <div>
                <p className="text-slate-500">お名前</p>
                <p className="text-slate-800 font-medium">{orderInfo.customerName}</p>
              </div>
              <div>
                <p className="text-slate-500">公演日時</p>
                <p className="text-slate-800 font-medium">{orderInfo.performanceLabel}</p>
              </div>
              <div>
                <p className="text-slate-500">お支払い金額</p>
                <p className="text-slate-800 font-medium text-lg">
                  ¥{orderInfo.totalAmount.toLocaleString()}
                  {orderInfo.discountAmount > 0 && (
                    <span className="text-green-600 text-sm ml-2">
                      (-¥{orderInfo.discountAmount.toLocaleString()})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Tickets Summary */}
          {orderInfo.tickets && orderInfo.tickets.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                <TicketIcon size={16} />
                発行済みチケット ({orderInfo.tickets.length}枚)
              </h2>
              
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="space-y-3">
                  {orderInfo.tickets.map((ticket, index) => (
                    <div 
                      key={ticket.id}
                      className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-slate-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              ticket.ticketType === 'GENERAL'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {ticket.ticketType === 'GENERAL' ? '一般席' : '指定席'}
                            </span>
                            {ticket.isExchanged && (
                              <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-600 flex items-center gap-1">
                                <Gift size={10} />
                                引換券
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            チケット #{ticket.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={20} />
                        <Link
                          href={`/tickets/view/${ticket.ticketCode}`}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          詳細を見る
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                  <Mail className="mx-auto mb-2 text-slate-400" size={24} />
                  <p className="text-sm text-slate-600 font-medium">
                    各チケットの詳細はメールをご確認ください
                  </p>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Mail className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-2">📧 メールをご確認ください</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• ご登録のメールアドレスにチケット情報を送信しました</li>
                      <li>• メール内の「チケットを表示」ボタンからQRコードをご確認いただけます</li>
                      <li>• 入場時にQRコードまたはチケットコードが必要です</li>
                      <li>• チケットは他の方と共有しないでください</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Tickets Message */}
          {(!orderInfo.tickets || orderInfo.tickets.length === 0) && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-slate-500 text-center">
                チケット情報を読み込み中です。しばらくお待ちください。
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-12 text-center space-y-4">
            <Link 
              href="/" 
              className="inline-block px-8 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              トップページに戻る
            </Link>
            <p className="text-sm text-slate-400">
              当日会場でお待ちしております
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-slate-500 mb-8">{error}</p>
          <Link 
            href="/" 
            className="inline-block px-8 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            トップページに戻る
          </Link>
        </div>
      )}

      {/* No Session ID */}
      {!searchParams.get('session_id') && !searchParams.get('order_id') && !loading && (
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-slate-500 mb-4">
            決済が正常に完了しました。<br />
            確認メールをご確認ください。
          </p>
          <Link 
            href="/" 
            className="inline-block px-8 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            トップページに戻る
          </Link>
        </div>
      )}
    </div>
  );
}
