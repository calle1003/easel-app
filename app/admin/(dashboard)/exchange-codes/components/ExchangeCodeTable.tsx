/**
 * 引換券コードテーブルコンポーネント
 */

'use client';

import { Check, X, Copy } from 'lucide-react';
import { ExchangeCode } from '../types';

interface ExchangeCodeTableProps {
  codes: ExchangeCode[];
  loading: boolean;
  onCopyCode: (code: string) => void;
  formatDate: (date: string | null) => string;
}

export function ExchangeCodeTable({
  codes,
  loading,
  onCopyCode,
  formatDate,
}: ExchangeCodeTableProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto" />
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-slate-500">引換券コードがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                コード
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                出演者
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                対象公演日時
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                会場
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                使用状況
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                来場状況
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                使用日時
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {codes.map((code) => (
              <tr key={code.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-medium text-slate-800">
                    {code.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {code.performerName}
                    </p>
                    {code.performer?.nameKana && (
                      <p className="text-xs text-slate-500">
                        {code.performer.nameKana}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {code.performanceSession ? (
                    <div>
                      <p className="text-sm text-slate-800">
                        {new Date(code.performanceSession.performanceDate).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {code.performanceSession.showNumber}回目公演
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">未設定</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {code.performanceSession ? (
                    <p className="text-sm text-slate-800">
                      {code.performanceSession.venueName}
                    </p>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {code.isUsed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      <Check size={12} />
                      使用済み
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                      <X size={12} />
                      未使用
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {code.hasAttended ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      <Check size={12} />
                      来場済み
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>
                    {code.usedAt && (
                      <p className="text-sm text-slate-800">{formatDate(code.usedAt)}</p>
                    )}
                    {code.attendedAt && (
                      <p className="text-xs text-slate-500">
                        来場: {formatDate(code.attendedAt)}
                      </p>
                    )}
                    {!code.usedAt && !code.attendedAt && (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onCopyCode(code.code)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    title="コードをコピー"
                  >
                    <Copy size={14} />
                    コピー
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
