/**
 * CSV一括登録モーダル
 */

'use client';

import { useMemo } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Performance, CsvPerformerData, PerformanceSession } from '../types';

interface BatchUploadModalProps {
  isOpen: boolean;
  performances: Performance[];
  csvFile: File | null;
  csvData: CsvPerformerData[];
  batchPerformanceIds: number[];
  codesPerSession: Record<number, number>;
  uploading: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBatchPerformanceIdsChange: (ids: number[]) => void;
  onCodesPerSessionChange: (data: Record<number, number>) => void;
}

export function BatchUploadModal({
  isOpen,
  performances,
  csvFile,
  csvData,
  batchPerformanceIds,
  codesPerSession,
  uploading,
  onClose,
  onSubmit,
  onFileChange,
  onBatchPerformanceIdsChange,
  onCodesPerSessionChange,
}: BatchUploadModalProps) {
  // 選択された公演のセッション一覧を取得
  const selectedSessions = useMemo(() => {
    const sessions: Array<PerformanceSession & { performanceTitle: string; performanceVolume: string | null }> = [];
    batchPerformanceIds.forEach((perfId) => {
      const perf = performances.find((p) => p.id === perfId);
      if (perf?.sessions) {
        perf.sessions.forEach((session) => {
          sessions.push({
            ...session,
            performanceTitle: perf.title,
            performanceVolume: perf.volume,
          });
        });
      }
    });
    return sessions.sort((a, b) => {
      const dateA = new Date(a.performanceDate).getTime();
      const dateB = new Date(b.performanceDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.showNumber - b.showNumber;
    });
  }, [batchPerformanceIds, performances]);

  // 公演選択のトグル
  const handlePerformanceToggle = (performanceId: number) => {
    const isSelected = batchPerformanceIds.includes(performanceId);
    
    if (isSelected) {
      const perf = performances.find((p) => p.id === performanceId);
      const newCodesPerSession = { ...codesPerSession };
      if (perf?.sessions) {
        perf.sessions.forEach((session) => {
          delete newCodesPerSession[session.id];
        });
      }
      
      onBatchPerformanceIdsChange(batchPerformanceIds.filter((id) => id !== performanceId));
      onCodesPerSessionChange(newCodesPerSession);
    } else {
      onBatchPerformanceIdsChange([...batchPerformanceIds, performanceId]);
    }
  };

  // セッションのコード数変更
  const handleSessionCodeCountChange = (sessionId: number, count: number) => {
    onCodesPerSessionChange({
      ...codesPerSession,
      [sessionId]: Math.max(0, count),
    });
  };

  const totalCodesCount = Object.values(codesPerSession).reduce((sum, count) => sum + count, 0);
  const totalPerformersCount = csvData.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CSV一括登録" size="lg">
      <div className="space-y-4">
        {/* CSVファイル選択 */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            CSVファイル <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 cursor-pointer">
              <Upload size={18} className="text-slate-400" />
              <span className="text-sm text-slate-600">
                {csvFile ? csvFile.name : 'CSVファイルを選択'}
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            形式: 名前,ふりがな（ヘッダー行あり）
          </p>
        </div>

        {/* プレビュー */}
        {csvData.length > 0 && (
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              読み込みデータ ({csvData.length}件)
            </label>
            <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              {csvData.slice(0, 5).map((item, index) => (
                <div key={index} className="text-sm text-slate-700 py-1">
                  {item.name} {item.nameKana && `(${item.nameKana})`}
                </div>
              ))}
              {csvData.length > 5 && (
                <p className="text-xs text-slate-500 mt-2">
                  ...他{csvData.length - 5}件
                </p>
              )}
            </div>
          </div>
        )}

        {/* 公演選択 */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            出演公演（複数選択可） <span className="text-red-500">*</span>
          </label>
          <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
            {performances.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">公演がありません</p>
            ) : (
              performances.map((performance) => (
                <label
                  key={performance.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={batchPerformanceIds.includes(performance.id)}
                    onChange={() => handlePerformanceToggle(performance.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">
                      {performance.title}
                      {performance.volume && (
                        <span className="ml-2 text-xs text-slate-500">
                          ({performance.volume})
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* セッション一覧とコード数設定 */}
        {batchPerformanceIds.length === 0 && (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600 text-center">
              出演公演を選択すると、引換券コード数の設定が表示されます
            </p>
          </div>
        )}

        {selectedSessions.length > 0 && (
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              各出演者に割り当てるコード数
            </label>
            <div className="border border-slate-200 rounded-lg p-3 space-y-3 max-h-80 overflow-y-auto">
              {selectedSessions.map((session) => {
                const showNumber =
                  ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][
                    session.showNumber - 1
                  ] || `${session.showNumber}th`;
                const date = new Date(session.performanceDate);
                const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {session.performanceTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {showNumber} - {dateStr} - {session.venueName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={codesPerSession[session.id] || ''}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          const count = numericValue === '' ? 0 : parseInt(numericValue, 10);
                          handleSessionCodeCountChange(session.id, count);
                        }}
                        className="w-20 p-2 border border-slate-300 rounded text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-slate-600">枚 × {totalPerformersCount}人</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              合計: {totalCodesCount * totalPerformersCount}枚のコードを生成します
            </p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!csvFile || csvData.length === 0 || batchPerformanceIds.length === 0 || uploading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {uploading
              ? '登録中...'
              : `一括登録 (${csvData.length}人 × ${totalCodesCount}枚)`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
