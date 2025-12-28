/**
 * チェックイン結果表示コンポーネント
 */

import { CheckCircle, AlertCircle, X, UserCheck, UserX } from 'lucide-react';
import { ScanStatus, TicketInfo } from '../types';

interface CheckInResultProps {
  scanStatus: ScanStatus;
  ticketInfo: TicketInfo | null;
  errorMessage: string;
  onCheckIn?: () => void;
  onReject?: () => void;
}

export function CheckInResult({
  scanStatus,
  ticketInfo,
  errorMessage,
  onCheckIn,
  onReject,
}: CheckInResultProps) {
  // スキャン中または待機中は表示しない
  if (scanStatus === 'idle' || scanStatus === 'scanning') {
    return null;
  }

  // 検証済み（管理者の判断待ち）
  if (scanStatus === 'verified' && ticketInfo) {
    return (
      <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={28} />
          <h3 className="text-lg md:text-xl font-bold text-blue-800">チケット確認</h3>
        </div>
        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">お名前</span>
            <span className="text-sm font-medium text-slate-800">
              {ticketInfo.order?.customerName || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">チケット種別</span>
            <span className="text-sm font-medium text-slate-800">
              {ticketInfo.ticketType === 'GENERAL' && '一般席（自由席）'}
              {ticketInfo.ticketType === 'RESERVED' && '指定席'}
              {ticketInfo.ticketType === 'VIP1' && 'VIP1席'}
              {ticketInfo.ticketType === 'VIP2' && 'VIP2席'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">公演</span>
            <span className="text-sm font-medium text-slate-800">
              {ticketInfo.order?.performanceLabel || '-'}
            </span>
          </div>
          {ticketInfo.isExchanged && (
            <div className="bg-amber-100 border border-amber-300 rounded px-3 py-2">
              <span className="text-sm text-amber-800 font-medium">🎫 引換券使用チケット</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={onCheckIn}
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-3 md:py-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
          >
            <UserCheck size={20} className="flex-shrink-0" />
            <span className="whitespace-nowrap">入場許可</span>
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-3 md:py-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
          >
            <UserX size={20} className="flex-shrink-0" />
            <span className="whitespace-nowrap">入場拒否</span>
          </button>
        </div>
      </div>
    );
  }

  // 成功
  if (scanStatus === 'success' && ticketInfo) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <CheckCircle className="text-green-600 flex-shrink-0" size={28} />
          <h3 className="text-lg md:text-xl font-bold text-green-800">入場完了</h3>
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
              {ticketInfo.ticketType === 'GENERAL' && '一般席（自由席）'}
              {ticketInfo.ticketType === 'RESERVED' && '指定席'}
              {ticketInfo.ticketType === 'VIP1' && 'VIP1席'}
              {ticketInfo.ticketType === 'VIP2' && 'VIP2席'}
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
      <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={28} />
          <h3 className="text-lg md:text-xl font-bold text-amber-800">使用済みチケット</h3>
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
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <X className="text-red-600 flex-shrink-0" size={28} />
          <h3 className="text-lg md:text-xl font-bold text-red-800">エラー</h3>
        </div>
        <p className="text-sm text-red-700">{errorMessage || 'チケットの確認に失敗しました'}</p>
      </div>
    );
  }

  return null;
}
