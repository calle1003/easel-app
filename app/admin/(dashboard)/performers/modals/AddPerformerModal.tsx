/**
 * 出演者追加モーダル
 */

'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { Performance, PerformerFormData, PerformanceSession } from '../types';

interface AddPerformerModalProps {
  isOpen: boolean;
  performances: Performance[];
  formData: PerformerFormData;
  editingId: number | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onFormDataChange: (data: PerformerFormData) => void;
}

export function AddPerformerModal({
  isOpen,
  performances,
  formData,
  editingId,
  onClose,
  onSubmit,
  onFormDataChange,
}: AddPerformerModalProps) {
  // 選択された公演のセッション一覧を取得
  const selectedSessions = useMemo(() => {
    const sessions: Array<PerformanceSession & { performanceTitle: string; performanceVolume: string | null }> = [];
    formData.performanceIds.forEach((perfId) => {
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
  }, [formData.performanceIds, performances]);

  // 公演選択のトグル
  const handlePerformanceToggle = (performanceId: number) => {
    const isSelected = formData.performanceIds.includes(performanceId);
    
    if (isSelected) {
      const perf = performances.find((p) => p.id === performanceId);
      const newCodesPerSession = { ...formData.codesPerSession };
      if (perf?.sessions) {
        perf.sessions.forEach((session) => {
          delete newCodesPerSession[session.id];
        });
      }
      
      onFormDataChange({
        ...formData,
        performanceIds: formData.performanceIds.filter((id) => id !== performanceId),
        codesPerSession: newCodesPerSession,
      });
    } else {
      onFormDataChange({
        ...formData,
        performanceIds: [...formData.performanceIds, performanceId],
      });
    }
  };

  // セッションのコード数変更
  const handleSessionCodeCountChange = (sessionId: number, count: number) => {
    onFormDataChange({
      ...formData,
      codesPerSession: {
        ...formData.codesPerSession,
        [sessionId]: Math.max(0, count),
      },
    });
  };

  const totalCodesCount = Object.values(formData.codesPerSession).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? '出演者を編集' : '出演者を登録'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* 名前 */}
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            placeholder="山田太郎"
            required
          />
        </div>

        {/* ふりがな */}
        <div>
          <label className="block text-sm text-slate-600 mb-1">ふりがな</label>
          <input
            type="text"
            value={formData.nameKana}
            onChange={(e) => onFormDataChange({ ...formData, nameKana: e.target.value })}
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            placeholder="やまだたろう"
          />
        </div>

        {/* 公演選択 */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            出演公演（複数選択可）
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
                    checked={formData.performanceIds.includes(performance.id)}
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
        {formData.performanceIds.length === 0 && !editingId && (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600 text-center">
              出演公演を選択すると、引換券コードの割り当て設定が表示されます
            </p>
          </div>
        )}

        {selectedSessions.length > 0 && !editingId && (
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              引換券コードの対象公演日時（複数選択可）
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
                        value={formData.codesPerSession[session.id] || ''}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          const count = numericValue === '' ? 0 : parseInt(numericValue, 10);
                          handleSessionCodeCountChange(session.id, count);
                        }}
                        className="w-20 p-2 border border-slate-300 rounded text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-slate-600">枚</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              各公演日時に割り当てるコード数を入力してください（合計: {totalCodesCount}枚）
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
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors"
          >
            {editingId ? '更新' : '登録'}
            {!editingId && totalCodesCount > 0 && ` (コード${totalCodesCount}枚生成)`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
