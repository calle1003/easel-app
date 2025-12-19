/**
 * 単発コード追加モーダル
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { PerformerSelect } from '../components/PerformerSelect';
import { PerformanceSessionSelector } from '../components/PerformanceSessionSelector';
import { Performer, Performance, ExchangeCodeFormData } from '../types';

interface AddCodeModalProps {
  isOpen: boolean;
  performers: Performer[];
  performances: Performance[];
  formData: ExchangeCodeFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onFormDataChange: (data: ExchangeCodeFormData) => void;
}

export function AddCodeModal({
  isOpen,
  performers,
  performances,
  formData,
  onClose,
  onSubmit,
  onFormDataChange,
}: AddCodeModalProps) {
  const [performerSearch, setPerformerSearch] = useState('');
  const [showPerformerDropdown, setShowPerformerDropdown] = useState(false);

  // 選択された公演のセッション一覧を取得
  const selectedSessions = useMemo(() => {
    const sessions: Array<any> = [];
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
      // 選択解除: その公演のセッションを削除
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
      // 選択追加
      onFormDataChange({
        ...formData,
        performanceIds: [...formData.performanceIds, performanceId],
      });
    }
  };

  // セッションのコード数変更（単一追加モードでは常に1）
  const handleSessionChange = (sessionId: number, count: number) => {
    if (count === 0) {
      const newCodesPerSession = { ...formData.codesPerSession };
      delete newCodesPerSession[sessionId];
      onFormDataChange({
        ...formData,
        codesPerSession: newCodesPerSession,
      });
    } else {
      onFormDataChange({
        ...formData,
        codesPerSession: { [sessionId]: count },
      });
    }
  };

  const handleReset = () => {
    setPerformerSearch('');
    setShowPerformerDropdown(false);
  };

  const totalCodesCount = Object.values(formData.codesPerSession).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        handleReset();
      }}
      title="コードを追加"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* 出演者選択 */}
        <PerformerSelect
          performers={performers}
          value={formData.performerId}
          searchText={performerSearch}
          showDropdown={showPerformerDropdown}
          onSearchChange={setPerformerSearch}
          onSelect={(id, name) => {
            onFormDataChange({ ...formData, performerId: id });
            setPerformerSearch(name);
          }}
          onSetShowDropdown={setShowPerformerDropdown}
          required
          emptyMessage={
            <span>
              ※ 先に
              <Link href="/admin/performers" className="underline">
                出演者を登録
              </Link>
              してください
            </span>
          }
        />

        {/* コード入力 */}
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            コード <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                code: e.target.value.toLowerCase(),
              })
            }
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono"
            placeholder="vol2-abc12"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            形式: vol2-abc12 (英数字5桁・小文字)
          </p>
        </div>

        {/* 公演・セッション選択 */}
        <PerformanceSessionSelector
          performances={performances}
          selectedPerformanceIds={formData.performanceIds}
          codesPerSession={formData.codesPerSession}
          onPerformanceToggle={handlePerformanceToggle}
          onSessionCodeCountChange={handleSessionChange}
          mode="single"
        />

        {/* ボタン */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={
              !formData.performerId ||
              formData.performanceIds.length === 0 ||
              totalCodesCount === 0
            }
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>
      </form>
    </Modal>
  );
}
