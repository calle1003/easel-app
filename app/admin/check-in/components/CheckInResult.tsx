/**
 * チェックイン結果表示コンポーネント
 */

import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { ScanStatus, TicketInfo } from '../types';

interface CheckInResultProps {
  scanStatus: ScanStatus;
  ticketInfo: TicketInfo | null;
  errorMessage: string;
}

export function CheckInResult({
  scanStatus,
  ticketInfo,
  errorMessage,
}: CheckInResultProps) {
  // スキャン中または待機中は表示しない
  if (scanStatus === 'idle' || scanStatus === 'scanning') {
    return null;
  }

  // 成功
  if (scanStatus === 'success' && ticketInfo) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-600" size={32} />
          <h3 className="text-xl font-bold text-green-800">入場完了</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">お名前</span>
            <span className="text-sm font-medium text-slate-800">
              {ticketInfo.order?.customerName || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">チケット種別</span>
            <span className="text-sm font-medium text-slate-800">
              {ticketInfo.ticketType === 'GENERAL' ? '一般席' : '指定席'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">公演</span>
            <span className="text-sm font-medium text-slate-800">
              {ticketInfo.order?.performanceLabel || '-'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 既に使用済み
  if (scanStatus === 'already-used' && ticketInfo) {
    return (
      <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-amber-600" size={32} />
          <h3 className="text-xl font-bold text-amber-800">使用済みチケット</h3>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-amber-700">このチケットは既に使用されています。</p>
          {ticketInfo.usedAt && (
            <p className="text-sm text-amber-600">
              使用日時: {new Date(ticketInfo.usedAt).toLocaleString('ja-JP')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // エラー
  if (scanStatus === 'error') {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <X className="text-red-600" size={32} />
          <h3 className="text-xl font-bold text-red-800">エラー</h3>
        </div>
        <p className="text-sm text-red-700">{errorMessage || 'チケットの確認に失敗しました'}</p>
      </div>
    );
  }

  return null;
}
