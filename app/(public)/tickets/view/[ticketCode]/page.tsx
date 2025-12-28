'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface TicketData {
  found: boolean;
  error?: string;
  ticket?: {
    id: number;
    ticketCode: string;
    ticketType: string;
    isExchanged: boolean;
    isUsed: boolean;
    usedAt?: string;
    createdAt: string;
    order: {
      id: number;
      customerName: string;
      performanceLabel: string;
      performanceDate: string;
    };
  };
}

export default function TicketViewPage() {
  const params = useParams();
  const ticketCode = params.ticketCode as string;
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fetchTicketData = async () => {
    if (!ticketCode) return;

    try {
      const response = await fetch(`/api/tickets/view/${ticketCode}`);
      if (!response.ok) {
        throw new Error('チケット情報の取得に失敗しました');
      }
      const data = await response.json();
      setTicketData(data);
      setError('');

      // QRコードを生成（PNG画像として直接取得）
      setQrCode(`/api/qrcode/ticket/${ticketCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setTicketData({ found: false, error: err instanceof Error ? err.message : 'エラーが発生しました' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [ticketCode]);

  // 自動リフレッシュ（5秒ごと）
  useEffect(() => {
    if (!autoRefresh || !ticketCode) return;

    const interval = setInterval(() => {
      fetchTicketData();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, ticketCode]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchTicketData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">チケット情報を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !ticketData || !ticketData.found || !ticketData.ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">チケットが見つかりません</h1>
          <p className="text-slate-600 mb-6">
            {error || ticketData?.error || 'チケットコードが無効です'}
          </p>
          <Link
            href="/"
            className="inline-block bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition"
          >
            トップページへ
          </Link>
        </div>
      </div>
    );
  }

  const ticket = ticketData.ticket;
  const isUsed = ticket.isUsed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* ステータスバナー */}
        {isUsed ? (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-green-900">✅ 入場済み</div>
              <div className="text-sm text-green-700">
                {ticket.usedAt &&
                  new Date(ticket.usedAt).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">✓</span>
            </div>
            <div>
              <div className="font-bold text-blue-900">有効なチケット</div>
              <div className="text-sm text-blue-700">入場時にこの画面をご提示ください</div>
            </div>
          </div>
        )}

        {/* チケットカード */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-600 text-white p-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-white">easel チケット</h1>
              <button
                onClick={handleManualRefresh}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="更新"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-200 text-sm">{ticket.order.performanceLabel}</p>
          </div>

          {/* QRコード */}
          <div className="p-8 bg-slate-50 flex flex-col items-center">
            {qrCode ? (
              <img
                src={qrCode}
                alt="チケットQRコード"
                className="w-64 h-64 bg-white p-4 rounded-xl shadow-md"
              />
            ) : (
              <div className="w-64 h-64 bg-white p-4 rounded-xl shadow-md flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            )}
            <p className="mt-4 text-sm text-slate-600">入場時にスタッフにご提示ください</p>
          </div>

          {/* チケット情報 */}
          <div className="p-6 space-y-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">チケット番号</div>
              <div className="font-mono text-lg font-semibold text-slate-800 break-all">
                {ticket.ticketCode}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">チケット種別</div>
                <div className="font-semibold text-slate-800">
                  {ticket.ticketType === 'GENERAL' ? '一般席' : '指定席'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">お名前</div>
                <div className="font-semibold text-slate-800">{ticket.order.customerName}</div>
              </div>
            </div>

            {ticket.isExchanged && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <span className="text-amber-800 font-semibold text-sm">🎫 引換券使用</span>
              </div>
            )}
          </div>
        </div>

        {/* 自動更新切り替え */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-600">ステータス自動更新</span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="form-checkbox h-5 w-5 text-slate-800 rounded"
            />
          </label>
          <p className="text-xs text-slate-400 mt-2">
            {autoRefresh ? '5秒ごとに自動更新されます' : '手動で更新してください'}
          </p>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-2">ご注意</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• このチケットは1回のみ有効です</li>
            <li>• スクリーンショットでも入場可能です</li>
            <li>• 他の方への譲渡はできません</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
